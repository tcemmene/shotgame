import Image from "next/image";
import React from "react";
import Countdown from "./Countdown";

export type HeaderProps = {
  online: boolean;
};

export const Header = ({ online }: HeaderProps) => {
  const getTargetDateTime = (): Date => {
    const now = new Date();
    const targetDateTime = new Date(now);
    targetDateTime.setDate(now.getDate() + 1);
    targetDateTime.setHours(2, 30, 0, 0);
    return targetDateTime;
  };

  return (
    <div className="z-10 w-full items-center justify-between text-sm flex flex-row py-4">
      <div className="left-0 top-0 flex w-full justify-center lg:w-auto flex-col">
        <p className="font-bold text-3xl">Shots</p>
        {/* <p>toxic {new Date().getFullYear()}</p> */}
      </div>
      <div>
        <Countdown targetDateTime={getTargetDateTime()} />
      </div>
      <div className="flex flex-col bottom-0 left-0 h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
        <div className="flex flex-row space-x-1">
          <p>by</p>
          <p className="uppercase font-bold">BBF</p>
        </div>
        <div className="flex flex-row space-x-1 items-baseline">
          <div className={`w-2 h-2 rounded-full ${online ? "bg-green-600 " : "bg-gray-600"}`}></div>
          <div
            className={`${
              online ? " text-green-600" : " text-gray-600"
            } uppercase font-bold text-sm`}
          >
            {online ? "Online" : "Offline"}
          </div>
        </div>
      </div>
    </div>
  );
};
