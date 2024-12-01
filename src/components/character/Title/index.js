'use client'

import React, { useEffect, useState } from "react";

function TitleName({ titleId }) {
  const [titleName, setTitleName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!titleId) return;

    async function fetchTitleName() {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/title/${titleId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch title name");
        }

        const { titleName } = await response.json();
        setTitleName(titleName);
      } catch (err) {
        console.error(err);
        setError("Unable to load title name");
      } finally {
        setLoading(false);
      }
    }

    fetchTitleName();
  }, [titleId]);

  if (loading) return <p>Loading title...</p>;
  if (error) return <p>{error}</p>;

  return <p>{titleName}</p>;
}

export default TitleName;
