'use client'
import React, { useEffect, useState } from "react";

function Server({ characterId }) {
  const [serverName, setServerName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!characterId) return;

    async function fetchCharacterWorld() {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/character/world/${characterId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch character world data");
        }

        const data = await response.json();
        setServerName(data.serverName || "Unknown");
      } catch (err) {
        console.error(err);
        setError("Unable to load server information");
      } finally {
        setLoading(false);
      }
    }

    fetchCharacterWorld();
  }, [characterId]);

  if (loading) return <p>Loading server...</p>;
  if (error) return <p>{error}</p>;

  return <p>Server: {serverName}</p>;
}

export default Server;
