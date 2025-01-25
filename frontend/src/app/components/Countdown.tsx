import React, { useEffect, useState } from "react";

interface CountdownProps {
  targetDateTime: Date;
}

const Countdown: React.FC<CountdownProps> = ({ targetDateTime }) => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    let blockUpdate = false;
    const getTimeRemaining = () => {
      const now = new Date();

      // Calculate the time difference in milliseconds
      let difference = targetDateTime.getTime() - now.getTime();

      const dailyHoursDifference = Math.abs(targetDateTime.getHours() - now.getHours());
      if (dailyHoursDifference < 1) {
        setElapsed(true);
        blockUpdate = true;
        difference = 0;
      } else {
        setElapsed(false);
        blockUpdate = false;
      }

      // If the target time has passed, set it for the next day
      if (difference < 0 && !blockUpdate) {
        const nextDay = new Date(targetDateTime);
        nextDay.setDate(nextDay.getDate() + 1);
        difference = nextDay.getTime() - now.getTime();
      }

      // Calculate remaining hours, minutes, and seconds
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      // Format the remaining time in HH:mm:ss format
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
        seconds
      ).padStart(2, "0")}`;
    };

    // Update the time remaining every second
    let interval: NodeJS.Timeout;
    if (!blockUpdate) {
      interval = setInterval(() => {
        const remainingTime = getTimeRemaining();
        setTimeRemaining(remainingTime);
      }, 1000);
    }

    // Clear interval on unmount
    return () => clearInterval(interval);
  }, [targetDateTime]);

  return (
    <div
      className={`${elapsed ? "bg-green-600" : "bg-transparent"} text-center px-2 py-1 rounded-lg`}
    >
      <p>Zeit bis Ende</p>
      <p className="font-bold text-2xl">{timeRemaining}</p>
    </div>
  );
};

export default Countdown;
