'use client'; // Ensure this component runs on the client side

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FactionColoredName } from "@/utils/factions";

const Friends = ({ characterId }) => {
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchFriends() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/character/friends/${characterId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch friends data.");
        }

        const data = await response.json();
        setFriends(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFriends();
  }, [characterId]);

  if (isLoading) {
    return <p>Loading friends...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (friends.length === 0) {
    return <p>This character has no friends.</p>;
  }

  return (
    <section>
      <h2>
        Friends{" "}
        <span className="friendsCount">
          {friends.length > 0 ? `(${friends.length})` : "(0)"}
        </span>
      </h2>
      <div className="tableContainer">
        <table className="table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Name</th>
              <th>BR ~ Prestige</th>
            </tr>
          </thead>
          <tbody>
            {friends.map((friend, index) => (
              <tr key={index}>
                <td>
                  <span
                    className={`statusDot ${friend.online === "1" ? "online" : "offline"}`}
                    data-tooltip={friend.online === "1" ? "Online" : "Offline"}
                  ></span>
                </td>
                <td>
                  <Link href={`/player/${friend.name.toLowerCase()}`}>
                    <FactionColoredName
                      name={friend.name}
                      factionId={friend.faction_id}
                    />
                  </Link>
                  {friend.outfit.alias && (
                    <>
                      {" "}
                      <Link
                        href={`/outfit/${friend.outfit.name.toLowerCase()}`}
                      >
                        [{friend.outfit.alias}]
                      </Link>
                    </>
                  )}
                </td>
                <td>
                  {friend.battle_rank} ~ {friend.prestige_level}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Friends;
