"use client";

import React, { useEffect, useState } from "react";
import { GroupGetResponse, ScoreOverview, ScoreOverviewExtended } from "../types/Group";
import { UrlWithStringQuery } from "url";
import { format } from "date-fns";
import Link from "next/link";
import IncrementButton from "./increment_button";

const Admin = () => {
  const [groups, setGroups] = useState<GroupGetResponse[]>([]);
  const [scores, setScores] = useState<ScoreOverviewExtended[]>([]);
  const [groupNameInput, setGroupNameInput] = useState("");

  const api = process.env.NEXT_PUBLIC_API_URL;

  const loadGroups = async () => {
    try {
      // load overviews
      if (!api) {
        throw new Error("API URL not available");
      }
      const res = await fetch(`${api}/groups?details=true`);
      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }
      const groups = await res.json();
      setGroups(groups);
    } catch (error) {
      console.error("Error fetching data:", error);
      setTimeout(loadGroups, 5000); // Retry after 5 seconds
    }
  };

  const addScore = async (uuid: string, amount: number, special: boolean = false) => {
    const bodyData = {
      gameGroupUuid: uuid,
      username: "admin",
      amount: amount,
      special: special,
    };
    const res = await fetch(`${api}/scores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
    });
    const data = await res.json();
    await loadScores();
  };

  const removeScore = async (uuid: string, force: boolean = false) => {
    if (!force) {
      const confirmed = window.confirm("Are you sure you want to delete this score?");
      if (!confirmed) {
        return;
      }
    }
    const res = await fetch(`${api}/scores/${uuid}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!force) {
      await loadScores();
    }
  };

  const removeAllScores = async () => {
    const confirmed = window.confirm("Are you sure you want to delete ALL scores?");
    if (!confirmed) {
      return;
    }
    const res = await Promise.all(scores.map((score) => removeScore(score.uuid, true)));
    await loadScores();
  };

  const loadScores = async () => {
    if (!groups) {
      return;
    }
    try {
      // load overviews
      if (!api) {
        throw new Error("API URL not available");
      }
      const res = await fetch(`${api}/scores`);
      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }
      const scores = await res.json();
      for (const score of scores) {
        const group = groups.find((x) => x.uuid === score.gameGroupUuid);
        if (!group) {
          continue;
        }
        score.name = group.name;
      }
      setScores(scores);
    } catch (error) {
      console.error("Error fetching data:", error);
      setTimeout(loadScores, 5000); // Retry after 5 seconds
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await loadGroups();
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await loadScores();
    };
    loadData();
  }, [groups]);

  const handleGroupNameInputChange = (event: any) => {
    setGroupNameInput(event.target.value);
  };

  const addGroup = async () => {
    const email = `${groupNameInput}@example.com`;
    const bodyData = {
      name: groupNameInput,
      email: email,
    };
    const res = await fetch(`${api}/groups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
    });
    const data = await res.json();
    setGroupNameInput("");
    await loadGroups();
  };

  const removeGroup = async (uuid: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this player?");
    if (!confirmed) {
      return;
    }
    const res = await fetch(`${api}/groups/${uuid}`, {
      method: "DELETE",
    });
    const data = await res.json();
    await loadGroups();
    await loadScores();
  };

  return (
    <div className="p-6 mx-auto flex flex-col max-w-2xl justify-center  ">
      {" "}
      {/* Added items-center justify-center */}
      <h1 className="uppercase text-2xl font-bold mb-4">Players ({groups.length})</h1>
      {/* Players */}
      {groups && (
        <section className="flex flex-col justify-center max-w-2xl">
          {groups
            .sort((a, b) => a.uuid.localeCompare(b.uuid))
            .map((group, index) => (
              <div
                key={group.uuid}
                className="flex flex-row justify-between rounded-lg mb-2 bg-gray-950 p-2 border border-gray-800 relative overflow-clip"
              >
                <div
                  className="absolute w-2 left-0 top-0 h-full"
                  style={{ background: group.color }}
                ></div>
                <div className="my-auto pl-2">{group.name}</div>
                <div className="flex flex-row space-x-2">
                  {/* <div>
                    <button
                      type="button"
                      onClick={() => addScore(group.uuid, 0)}
                      className="px-3 py-3 bg-orange-700 rounded-lg hover:bg-orange-600 w-16"
                    >
                      PE
                    </button>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => addScore(group.uuid, 1, true)}
                      className="px-3 py-3 bg-yellow-700 rounded-lg hover:bg-yellow-600 w-16"
                    >
                      SP
                    </button>
                  </div> */}
                  <div>
                    <button
                      type="button"
                      onClick={() => addScore(group.uuid, 1)}
                      className="px-1 py-2 bg-blue-700 rounded-lg hover:bg-blue-600 w-12"
                    >
                      +1
                    </button>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => addScore(group.uuid, 1)}
                      className="px-1 py-2 bg-blue-700 rounded-lg hover:bg-blue-600 w-12"
                    >
                      +2
                    </button>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => addScore(group.uuid, 1)}
                      className="px-1 py-2 bg-blue-700 rounded-lg hover:bg-blue-600 w-12"
                    >
                      +4
                    </button>
                  </div>
                  <IncrementButton group={group} addScore={addScore} />

                  {/* <div>
                  <button
                    type="button"
                    onClick={() => addScore(group.uuid, -1)}
                    className="px-3 py-2 bg-red-700 rounded-lg hover:bg-red-600"
                  >
                    -1
                  </button>
                </div> */}
                </div>
              </div>
            ))}

          <div
            key="addPlayer"
            className="flex flex-row justify-between rounded-lg mb-2 bg-gray-950 p-2 border border-gray-800 relative overflow-clip"
          >
            <input
              type="text"
              value={groupNameInput}
              maxLength={26}
              onChange={handleGroupNameInputChange}
              className="bg-gray-900 rounded-md px-2 w-full mr-2"
            />
            <div>
              <button
                type="button"
                onClick={addGroup} // Handle button click
                className="px-3 py-3 bg-blue-700 rounded-lg hover:bg-blue-600 w-16"
              >
                ADD
              </button>
            </div>
          </div>
        </section>
      )}
      {/* Score History */}
      {scores && scores.length > 0 && (
        <>
          <h1 className="uppercase text-2xl font-bold mb-4 mt-5">
            Score History ({scores.length})
          </h1>
          <section className="flex flex-col justify-start max-w-2xl">
            {scores
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((score) => (
                <div
                  key={score.uuid}
                  className="flex flex-row justify-between rounded-lg mb-2 bg-gray-950 p-2 border border-gray-800 relative"
                >
                  {score.special && (
                    <>
                      <div className="absolute -top-2 -left-2">
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M 12,2
       L 14.74,8.5
       L 22,9.25
       L 16.87,14.5
       L 19.48,22
       L 12,18
       L 4.52,22
       L 7.13,14.5
       L 2,9.25
       L 9.26,8.5
       Z"
                            fill="yellow"
                            stroke="black"
                            strokeWidth="0.5" // Use strokeWidth instead of stroke-width
                          />
                        </svg>
                      </div>
                    </>
                  )}
                  <div className="my-auto flex flex-col pl-2">
                    <p>{score.name}</p>
                    <p className="text-gray-500">
                      {format(new Date(score.createdAt), "dd.MM.yyyy HH:mm:ss")}
                    </p>
                  </div>
                  <div className="flex flex-row space-x-2">
                    <p className="p-3">{score.amount > 0 ? `+${score.amount}` : score.amount}</p>
                    <div>
                      <button
                        type="button"
                        onClick={() => removeScore(score.uuid)}
                        className="px-3 py-3 bg-red-700 rounded-lg hover:bg-red-600 w-16"
                      >
                        DEL
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            <div className="text-right m-2">
              <button
                type="button"
                onClick={() => removeAllScores()}
                className="px-3 py-3 bg-red-700 rounded-lg hover:bg-red-600"
              >
                DELETE ALL
              </button>
            </div>
          </section>
        </>
      )}
      {/* Manage Players */}
      {groups && (
        <section className="flex flex-col justify-start max-w-2xl">
          <h1 className="uppercase text-2xl font-bold mb-4 mt-5">Manage Players</h1>
          {groups
            .sort((a, b) => a.uuid.localeCompare(b.uuid))
            .map((group, index) => (
              <div
                key={group.uuid}
                className="flex flex-row justify-between rounded-lg mb-2 bg-gray-950 p-2 border border-gray-800 relative overflow-clip"
              >
                <div
                  className="absolute w-2 left-0 top-0 h-full"
                  style={{ background: group.color }}
                ></div>
                <div className="my-auto pl-3">{group.name}</div>
                <div className="flex flex-row space-x-2">
                  <Link
                    href={`/admin/group-edit/${group.uuid}`}
                    className="px-3 py-3 bg-blue-700 rounded-lg hover:bg-blue-600 w-16 text-center align-middle"
                  >
                    EDIT
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeGroup(group.uuid)}
                    className="px-3 py-3 bg-red-700 rounded-lg hover:bg-red-600 w-16"
                  >
                    DEL
                  </button>
                </div>
              </div>
            ))}
        </section>
      )}
    </div>
  );
};
export default Admin;
