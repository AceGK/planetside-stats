'use client';

import React, { useEffect, useState } from "react";

const PerformanceStats = ({ characterId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/character/stats/${characterId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch character stats");
        }

        const data = await response.json();

        if (!data.stat_history) {
          throw new Error("Stat history not found in response");
        }

        // Extract relevant stats
        const kills = data.stat_history.find(stat => stat.stat_name === "kills")?.all_time || 0;
        const deaths = data.stat_history.find(stat => stat.stat_name === "deaths")?.all_time || 0;
        const oneLifeMaxKills = data.stat_history.find(stat => stat.stat_name === "kills")?.one_life_max || 0;
        const kdRatio = deaths > 0 ? (kills / deaths).toFixed(2) : "N/A";

        setStats({ kills, deaths, oneLifeMaxKills, kdRatio });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [characterId]);

  return (
    <div>
      <h2>Performance</h2>
      {loading ? (
        <p>Loading performance stats...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : stats ? (
        <>
          <p><strong>Total Kills:</strong> {Number(stats.kills).toLocaleString()}</p>
          <p><strong>Total Deaths:</strong> {Number(stats.deaths).toLocaleString()}</p>
          <p><strong>K/D Ratio:</strong> {stats.kdRatio}</p>
          <p><strong>One-Life Max Kills:</strong> {Number(stats.oneLifeMaxKills).toLocaleString()}</p>
        </>
      ) : (
        <p>No stats available.</p>
      )}
    </div>
  );
};

export default PerformanceStats;
