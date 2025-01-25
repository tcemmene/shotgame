import { useState, useEffect, useRef } from "react";
import { GroupGetResponse } from "../types/Group";

const NOF_QUALI_GROUPS = 3;

const useDashboardData = (apiUrl: string, websocketUrl: string) => {
  const [groups, setGroups] = useState<GroupGetResponse[]>([]);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const wsClientRef = useRef<WebSocket | null>(null);
  const [qualiLimits, setQualiLimits] = useState<{ min: number; max: number } | null>(null);
  const [candiLimits, setCandiLimits] = useState<{ min: number; max: number } | null>(null);
  const [qualiGroups, setQualiGroups] = useState<GroupGetResponse[] | null>(null);
  const [candiGroups, setCandiGroups] = useState<GroupGetResponse[] | null>(null);

  const loadGroups = async () => {
    try {
      // load overviews
      const api = process.env.NEXT_PUBLIC_API_URL;
      if (!api) {
        throw new Error("API URL not available");
      }
      const res = await fetch(`${api}/groups?details=true`);
      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }
      const groups = await res.json();
      const groupsWithCumulativeScores = groups.map(calculateCumulativeScores);
      setGroups(groupsWithCumulativeScores);
    } catch (error) {
      console.error("Error fetching data:", error);
      setTimeout(loadGroups, 5000); // Retry after 5 seconds
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await loadGroups();
    };
    loadData();
  }, []);

  const initializeWebSocket = () => {
    if (wsClientRef.current) {
      return; // If WebSocket connection exists, do not create a new one
    }
    console.log("Initialize WebSocket..");

    const wsUrl = String(process.env.NEXT_PUBLIC_WEBSOCKET_URL);
    const wsClient = new WebSocket(wsUrl);

    wsClient.onopen = () => {
      console.log("WebSocket connected");
      setWsConnected(true);
    };

    wsClient.onmessage = (event) => {
      const { channel, ...message } = JSON.parse(event.data);
      switch (channel) {
        case "score:total":
          handleTotalScoreUpdate(message);
          break;
        case "score:add":
          handleAddScore(message);
          break;
        case "score:remove":
          handleRemoveScore(message);
          break;
        default:
          // Handle other channels if needed
          break;
      }
    };

    wsClient.onclose = () => {
      console.log("WebSocket connection closed");
      setWsConnected(false);
      wsClientRef.current = null; // Reset WebSocket reference on close
      setTimeout(initializeWebSocket, 5000); // Retry after 5 seconds
    };

    wsClientRef.current = wsClient; // Save WebSocket instance in the ref
  };

  const calculateCumulativeScores = (group: GroupGetResponse): GroupGetResponse => {
    let cumulativeScore = 0;
    const updatedScores = group.scores.map((score) => {
      cumulativeScore += score.amount;
      return { ...score, cumScore: cumulativeScore };
    });

    return { ...group, scores: updatedScores };
  };

  const handleTotalScoreUpdate = (msg: any) => {
    setGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.uuid !== msg.uuid) {
          return group;
        }
        const updatedGroup = { ...group, score: msg.newScore };
        return calculateCumulativeScores(updatedGroup);
      })
    );
  };

  const handleAddScore = (addedScore: any) => {
    setGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.uuid !== addedScore.gameGroupUuid) {
          return group;
        }
        const existingScore = group.scores.find((score) => score.uuid === addedScore.uuid);
        if (existingScore) {
          return group;
        }
        const updatedGroup = {
          ...group,
          scores: [...group.scores, addedScore],
        };
        return calculateCumulativeScores(updatedGroup);
      })
    );
  };

  const handleRemoveScore = (removedScore: any) => {
    setGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.uuid !== removedScore.gameGroupUuid) {
          return group;
        }
        const updatedScores = group.scores.filter((score) => score.uuid !== removedScore.uuid);
        const updatedGroup = { ...group, scores: updatedScores };
        return calculateCumulativeScores(updatedGroup);
      })
    );
  };

  const cleanup = () => {
    if (wsClientRef.current) {
      wsClientRef.current.close();
      wsClientRef.current = null;
    }
  };

  useEffect(() => {
    initializeWebSocket();
    window.addEventListener("beforeunload", cleanup);
    return () => {
      window.removeEventListener("beforeunload", cleanup);
      cleanup();
    };
  }, []);

  const calculateLimits = (): void => {
    // sort the scrores descending (0=largest)
    const sortedGroups = [...groups].sort((a, b) => b.score - a.score);

    // group the scores and count them
    const groupedAndCounted = sortedGroups.reduce(
      (acc, curr) => {
        const { score } = curr;
        if (acc[score]) {
          acc[score].count++;
        } else {
          acc[score] = { score, count: 1 };
        }
        return acc;
      },
      {} as { [key: number]: { score: number; count: number } }
    );

    // find qualified limits
    const groupCounts = Array.from(Object.values(groupedAndCounted));
    const sortedGroupCounts = groupCounts.sort((a, b) => b.score - a.score);

    let minQualifiedScore = null;
    let maxQualifiedScore = null;

    let qualiCount = 0;
    for (const groupCount of sortedGroupCounts) {
      if (qualiCount + groupCount.count > NOF_QUALI_GROUPS) {
        break;
      }
      minQualifiedScore = Math.min(minQualifiedScore ?? Infinity, groupCount.score);
      maxQualifiedScore = Math.max(maxQualifiedScore ?? -Infinity, groupCount.score);
      qualiCount += groupCount.count;
    }

    // find candidate limits
    let minCandidateScore = null;
    let maxCandidateScore = null;

    for (const groupCount of sortedGroupCounts) {
      if (minQualifiedScore && groupCount.score >= minQualifiedScore) {
        continue;
      }
      if (qualiCount >= NOF_QUALI_GROUPS) {
        continue;
      }
      minCandidateScore = groupCount.score;
      maxCandidateScore = groupCount.score;
      break;
    }

    if (maxCandidateScore !== null && minQualifiedScore !== null) {
      minQualifiedScore = maxCandidateScore + 1;
    }

    // save the limits
    if (minQualifiedScore === null || maxQualifiedScore === null) {
      setQualiLimits(null);
    } else {
      setQualiLimits({ min: minQualifiedScore, max: maxQualifiedScore });
    }
    if (minCandidateScore === null || maxCandidateScore === null) {
      setCandiLimits(null);
    } else {
      setCandiLimits({ min: minCandidateScore, max: maxCandidateScore });
    }
  };

  const updateQualifiedGroups = () => {
    if (!qualiLimits) {
      for (const group of groups) {
        group.qualified = false;
      }
      setQualiGroups(null);
      return;
    }
    var qualifiedGroups: GroupGetResponse[] = [];
    for (const group of groups) {
      if (group.score < qualiLimits.min) {
        continue;
      }
      group.qualified = true;
      group.candidate = false;
      qualifiedGroups.push(group);
    }
    qualifiedGroups = qualifiedGroups.sort((a, b) => b.score - a.score);
    setQualiGroups(qualifiedGroups);
  };

  const updateCandidateGroups = () => {
    if (!candiLimits) {
      for (const group of groups) {
        group.candidate = false;
      }
      setCandiGroups(null);
      return;
    }
    var candiGroups: GroupGetResponse[] = [];
    for (const group of groups) {
      if (group.score < candiLimits.min) {
        continue;
      }
      if (group.score > candiLimits.max) {
        continue;
      }
      group.qualified = false;
      group.candidate = true;
      candiGroups.push(group);
    }
    candiGroups = candiGroups.sort((a, b) => b.score - a.score);
    setCandiGroups(candiGroups);
  };

  useEffect(() => {
    calculateLimits();
  }, [groups]);

  useEffect(() => {
    updateQualifiedGroups();
  }, [groups, qualiLimits, candiLimits]);

  useEffect(() => {
    updateCandidateGroups();
  }, [groups, qualiLimits, candiLimits]);

  return { groups, wsConnected, qualiLimits, candiLimits, qualiGroups, candiGroups };
};

export default useDashboardData;
