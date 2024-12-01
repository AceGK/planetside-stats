'use client';
import React, { useState } from "react";
import styles from "./styles.module.scss";

const TimePlayed = ({ minutesPlayed }) => {
  const [timeUnit, setTimeUnit] = useState("minutes");

  const calculateTimePlayed = () => {
    if (timeUnit === "hours") {
      return (minutesPlayed / 60).toLocaleString(undefined, { minimumFractionDigits: 2 });
    }
    if (timeUnit === "days") {
      return (minutesPlayed / 1440).toLocaleString(undefined, { minimumFractionDigits: 2 });
    }
    return parseInt(minutesPlayed, 10).toLocaleString();
  };

  return (
    <p>
      <strong>Time Played:</strong> {calculateTimePlayed()}{" "}
      <select
        value={timeUnit}
        onChange={(e) => setTimeUnit(e.target.value)}
        className={styles.timeDropdown}
      >
        <option value="minutes">minutes</option>
        <option value="hours">hours</option>
        <option value="days">days</option>
      </select>
    </p>
  );
};

export default TimePlayed;
