"use client";

import React, { useEffect, useState } from "react";
import useDashboardData from "../hooks/dashboard.data";
import { Line } from "react-chartjs-2";
import { Chart, ChartOptions, FontSpec, registerables } from "chart.js"; // Import necessary Chart.js modules
import "chartjs-adapter-date-fns";
import annotationPlugin, {
  AnnotationElement,
  AnnotationOptions,
  AnnotationTypeRegistry,
} from "chartjs-plugin-annotation";
import { Header } from "./Header";
import { GroupGetResponse, ScoreOverview, ScoreOverviewSparse } from "../types/Group";
import Link from "next/link";
import { format } from "date-fns";

Chart.register(...registerables); // Register necessary modules for Chart.js v3
Chart.register(annotationPlugin);
// Chart.defaults.backgroundColor = "#9BD0F5";
Chart.defaults.borderColor = "#333333";
Chart.defaults.color = "#ffffff";

export const Dashboard = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "";
  const { groups, wsConnected, qualiLimits, candiLimits, qualiGroups, candiGroups } =
    useDashboardData(apiUrl, websocketUrl);
  const [chartData, setChartData] = useState<any>(null);
  const [chartOptions, setChartOptions] = useState<ChartOptions<"line">>({});
  const [proRecord, setProRecord] = useState(0);
  const [proRecordAt, setProRecordAt] = useState<Date | null>(null);
  const [beerHeight, setBeerHeight] = useState<string>();
  const [isPro, setIsPro] = useState<Boolean>(false);

  useEffect(() => {
    if (groups.length < 1) {
      setChartData(null);
      return;
    }

    const groupLabels: string[] = [];
    const groupData: any[] = [];
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    const sixHoursAgo = new Date().getTime() - 6 * 60 * 60 * 1000;

    groups
      .sort((a, b) => a.uuid.localeCompare(b.uuid))
      .forEach((group, index) => {
        const cumScoreData = group.scores
          .filter((score) => score.amount !== 0)
          .map((score) => {
            const timestamp = new Date(score.createdAt).getTime();
            if (timestamp < minX) minX = timestamp;
            if (timestamp > maxX) maxX = timestamp;
            if (score.cumScore < minY) minY = score.cumScore;
            if (score.cumScore > maxY) maxY = score.cumScore;

            return {
              x: timestamp,
              y: score.cumScore,
              special: score.special,
            };
          });

        groupLabels.push(group.name);
        groupData.push({
          label: group.name,
          data: cumScoreData,
          borderColor: group.color, // Use the color from the array based on index
          backgroundColor: group.color, // Set fill color same as the border color
          pointStyle: (context: { dataIndex: number }) => {
            const isSpecial = cumScoreData[context.dataIndex]?.special;
            return isSpecial ? "star" : "circle"; // Render as star if 'special' is true
          },
          pointRadius: (context: { dataIndex: number }) => {
            const isSpecial = cumScoreData[context.dataIndex]?.special;
            return isSpecial ? 16 : 5;
          },
          borderWidth: (context: { dataIndex: number }) => {
            const isSpecial = cumScoreData[context.dataIndex]?.special;
            return isSpecial ? 4 : 2; // Thicker border for stars
          },
          hitRadius: 100,
          fill: false,
        });
      });

    const data = {
      labels: groupLabels,
      datasets: groupData,
    };

    setChartData(data);
    minX = Math.max(minX, sixHoursAgo);
    maxX = Math.min(maxX, new Date().getTime());
    const fontConfig: FontSpec = {
      family: "'Roboto', 'Helvetica', 'Arial', sans-serif", // Apply the desired system font here
      weight: "normal", // You can adjust the weight if needed
      size: 14,
      lineHeight: 1,
      style: "normal",
    };

    type AnnotationType = AnnotationOptions<keyof AnnotationTypeRegistry>;
    const annotations: AnnotationType[] = [];
    if (qualiLimits) {
      annotations.push({
        type: "box",
        xMin: Math.floor(minX / (10 * 60 * 1000)) * (10 * 60 * 1000),
        xMax: Math.ceil(maxX / (10 * 60 * 1000)) * (10 * 60 * 1000),
        yMin: qualiLimits.min - 0.5,
        yMax: qualiLimits.max + 0.5,
        backgroundColor: "#16653499", // Change color as needed
        drawTime: "beforeDatasetsDraw",
        borderColor: "#166534ff",
        borderWidth: 1,
      });
    }
    if (candiLimits) {
      annotations.push({
        type: "box",
        xMin: Math.floor(minX / (10 * 60 * 1000)) * (10 * 60 * 1000),
        xMax: Math.ceil(maxX / (10 * 60 * 1000)) * (10 * 60 * 1000),
        yMin: candiLimits.min - 0.5,
        yMax: candiLimits.max + 0.5,
        backgroundColor: "#9A6B0066", // Change color as needed
        drawTime: "beforeDatasetsDraw",
        borderColor: "#9A6B00ff",
        borderWidth: 1,
      });
    }

    const options: ChartOptions<"line"> = {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        // legend: {
        //   position: "bottom",
        //   labels: {
        //     font: fontConfig,
        //     usePointStyle: true,
        //     pointStyle: "circle",
        //     padding: 20,
        //   },
        // },
        annotation: {
          annotations: annotations,
        },
        // title: {
        //   display: true,

        //   font: fontConfig,
        // },
      },
      scales: {
        x: {
          type: "time",
          time: {
            parser: "timestamp", // Use timestamp if using milliseconds
            tooltipFormat: "yyyy-MM-dd HH:mm:ss",
            unit: "minute",
            displayFormats: {
              minute: "HH:mm",
            },
            round: "minute",
          },
          min: Math.floor(minX / (10 * 60 * 1000)) * (10 * 60 * 1000),
          max: Math.ceil(maxX / (10 * 60 * 1000)) * (10 * 60 * 1000),
          ticks: {
            stepSize: 10,
            source: "auto",
            autoSkip: true, // Enable auto skipping
            maxRotation: 0, // Set the maximum rotation angle to 0 degrees
            font: fontConfig,
          },
        },
        y: {
          ticks: {
            stepSize: 1,
            precision: 0, // Round y-axis ticks to integers
            font: fontConfig,
          },
          min: minY - 1,
          max: maxY + 1,
        },
      },
    };

    // Update options state
    setChartOptions(options);
  }, [groups, qualiLimits, candiLimits]); // Include 'groups' as dependency if it's used inside the useEffect

  const calcBarWidth = (score: number): string => {
    const maxScore = Math.max(...groups.map((group) => group.score));
    const percentage = 100 - Math.round((score / maxScore) * 100);
    return `${percentage}%`;
  };

  function largestConsecutiveTrueSeries(arr: boolean[]) {
    let maxCount = 0; // Variable to store the maximum consecutive count
    let currentCount = 0; // Variable to store the current consecutive count

    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === true) {
        currentCount++; // Increment the count for consecutive true values

        // Update maxCount if currentCount exceeds it
        if (currentCount > maxCount) {
          maxCount = currentCount;
        }
      } else {
        // Reset the current count if the sequence breaks
        currentCount = 0;
      }
    }

    return maxCount;
  }

  interface ConsecutiveInfo {
    maxCount: number;
    lastCreatedAt: Date | null;
  }

  function getConsecutiveInfo(scores: ScoreOverviewSparse[]): ConsecutiveInfo {
    let maxCount = 0; // Variable to store the maximum consecutive count
    let currentCount = 0; // Variable to store the current consecutive count
    let lastCreatedAt: Date | null = null; // Variable to store the createdAt of the last score in the largest consecutive series
    const sortedScores = scores.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    for (const score of sortedScores) {
      if (score.amount > 0) {
        currentCount++; // Increment the count for consecutive true values

        if (currentCount > maxCount) {
          maxCount = currentCount;
          lastCreatedAt = new Date(score.createdAt); // Update lastCreatedAt when a new largest series is found
        }
      } else {
        currentCount = 0; // Reset the count if the sequence breaks
      }
    }
    console.log(lastCreatedAt);

    return { maxCount, lastCreatedAt };
  }

  useEffect(() => {
    const flattenedScores = groups.flatMap((group) => group.scores);
    const { maxCount, lastCreatedAt } = getConsecutiveInfo(flattenedScores);
    setProRecord(maxCount);
    setProRecordAt(lastCreatedAt);
    calcBeerHeight();
  }, [groups]);

  const calcBeerHeight = () => {
    const flattenedScores = groups.flatMap((group) => group.scores);
    const sortedScores = flattenedScores.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const countToPercentage = (count: number): string => {
      return `${Math.round(((5 - Math.max(count, 1)) / 5) * 100)}%`;
    };
    let count = 0;
    for (const score of sortedScores) {
      if (score.amount === 0) {
        break;
      }
      if (score.amount < 0) {
        continue;
      }
      count++;
    }
    setIsPro(count > 1);
    setBeerHeight(countToPercentage(count));
  };

  function getTimeSince(date: Date): string {
    const now = new Date();
    const diff = Math.abs(now.getTime() - date.getTime());
    const minutes = Math.floor(diff / 60000); // Calculate total minutes difference
    const hours = Math.floor(minutes / 60); // Calculate total hours difference
    const remainingMinutes = minutes % 60; // Calculate remaining minutes

    if (hours >= 1) {
      if (remainingMinutes === 0) {
        return `vor ${hours}h`;
      } else {
        return `vor ${hours}h ${remainingMinutes}min`;
      }
    } else {
      return `vor ${remainingMinutes}min`;
    }
  }

  return (
    <div className="px-4 lg:px-8 pb-4 lg:pb-8 w-full flex flex-col h-screen">
      <Header online={wsConnected} />
      {/* <Link href="/admin">Admin</Link> */}

      {/* <div className="flex flex-col">
        {qualiLimits && (
          <div>
            Quali: {qualiLimits.min}, {qualiLimits.max}
          </div>
        )}
        {candiLimits && (
          <div>
            Candi: {candiLimits.min}, {candiLimits.max}
          </div>
        )}
      </div> */}

      {/* <div className="flex flex-row space-x-1 justify-center">
        {qualiGroups && (
          <>
            <div className="my-auto pr-2 text-sm">Qualifiziert: </div>
            {qualiGroups.map((group: GroupGetResponse) => (
              <div key={group.uuid} className="rounded-xl bg-green-800 px-3 py-2">
                {group.name}
              </div>
            ))}
          </>
        )}
        {candiGroups && (
          <>
            <div className="my-auto pr-2 text-sm pl-5">Auf Kippe: </div>
            {candiGroups.map((group: GroupGetResponse) => (
              <div key={group.uuid} className="rounded-xl bg-yellow-800 px-3 py-2">
                {group.name}
              </div>
            ))}
          </>
        )}
      </div> */}
      <section className="flex md:flex-row h-full">
        <div className="flex flex-grow h-full">
          {chartData && <Line data={chartData} options={chartOptions} />}
        </div>
        <div className="flex flex-col flex-shrink">
          {groups && (
            <>
              <div className="flex flex-row justify-between space-x-8 text-right uppercase font-bold text-sm px-5">
                <p className="pl-3">Name</p>
                <div className="flex flex-row">
                  {/* <p className="w-12">Sp</p>
                  <p className="w-12">St</p> */}
                  <p className="w-12">Shots</p>
                </div>
              </div>
              <ul className="w-96">
                {groups
                  .sort((a, b) => b.score - a.score)
                  .map((group, index) => (
                    <li
                      key={group.uuid}
                      className={`${
                        group.score < 1
                          ? "bg-transparent border-gray-700"
                          : group.qualified
                            ? " border-green-700"
                            : group.candidate
                              ? "border-yellow-700"
                              : "border-gray-800"
                      } px-5 py-3 border-b first:border-t relative`}
                    >
                      <div
                        className={`${
                          group.score < 1
                            ? "bg-transparent border-gray-700"
                            : group.qualified
                              ? "bg-green-800 border-green-700"
                              : group.candidate
                                ? "bg-yellow-800 border-yellow-700"
                                : "bg-gray-600 border-gray-700"
                        } left-0 top-0 bottom-0 right-0 absolute -z-10`}
                        style={{ right: calcBarWidth(group.score) }}
                      ></div>
                      <div
                        className="absolute w-5 left-0 top-0 h-full border-r border-black"
                        style={{ background: group.color }}
                      ></div>
                      <div className="flex flex-row justify-between space-x-8 text-right">
                        <p className="pl-3 text-xl" style={{ textShadow: "black 1px 1px" }}>
                          {group.name}
                        </p>
                        <div className="flex flex-row">
                          {/* <p className="w-12">
                            {group.scores.reduce(
                              (count, score) => count + (score.special ? 1 : 0),
                              0
                            )}
                          </p>
                          <p className="w-12">
                            {largestConsecutiveTrueSeries(
                              group.scores.map((score) => score.special)
                            )}
                          </p> */}
                          <p className="w-12 text-xl" style={{ textShadow: "black 1px 1px" }}>
                            {group.score}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>

              {/* Pro Runde Rekord */}
              {/* <section className="">
                <h3 className="text-sm uppercase font-bold mt-6 px-4">Rekord Pro-Runde</h3>
                <div className="flex flex-row justify-between px-4 py-3 bg-gray-900">
                  <div className="">{proRecord && <>{proRecord}</>}</div>
                  <div className="flex flex-row space-x-3">
                    <div className="text-gray-500">
                      {proRecordAt && proRecordAt instanceof Date && (
                        <>{getTimeSince(proRecordAt)}</>
                      )}
                    </div>
                    <div>
                      {proRecordAt && proRecordAt instanceof Date && (
                        <>{`um ${format(proRecordAt, "HH:mm")}`}</>
                      )}
                    </div>
                  </div>
                </div>
                <div></div>
              </section> */}

              {/* Bierglas */}
              {/* <section className="">
                <h3 className="text-sm uppercase font-bold mt-6 px-4">Aktuelles Glas</h3>
                <div className="bg-gray-900 border-4 border-t-0 border-white h-32 w-24 mx-auto mt-6 relative">
                  {isPro && (
                    <>
                      <div className="text-center p-2 uppercase font-bold text-sm flex justify-center">
                        <div className=" border border-black z-20 bg-yellow-300 px-2 py-1 rounded-lg text-black">
                          PRO
                        </div>
                      </div>
                    </>
                  )}
                  <div
                    className="bg-yellow-300 absolute bottom-0 left-0 right-0"
                    style={{ top: beerHeight }}
                  ></div>
                </div>
              </section> */}
            </>
          )}
        </div>
      </section>
    </div>
  );
};
