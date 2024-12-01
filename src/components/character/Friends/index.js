'use client'; // Ensure this component runs on the client side

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FactionColoredName } from "@/utils/factions";
import { GiThreeFriends } from "react-icons/gi";

const Friends = ({ characterId }) => {
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchFriends() {
      setIsLoading(true);
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

  return (
    <section>
      <h2>
        {/* <GiThreeFriends />  */}
        Friends
        <span className="friendsCount">
          {friends.length > 0 ? `(${friends.length})` : ""}
        </span>
      </h2>
      {isLoading ? (
        <p>Loading friends...</p>
      ) : error ? (
        <p>{error}</p>
      ) : friends.length > 0 ? (
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
                      className={`statusDot ${
                        friend.online === "1" ? "online" : "offline"
                      }`}
                      data-tooltip={
                        friend.online === "1" ? "Online" : "Offline"
                      }
                    ></span>
                  </td>
                  <td>
                    <Link href={`/player/${friend.name.toLowerCase()}`}>
                      <FactionColoredName
                        name={friend.name}
                        factionId={friend.faction_id}
                      />
                    </Link>
                    {friend.outfit?.alias && (
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
      ) : (
        <p>This character has no friends.</p>
      )}
    </section>
  );
};

export default Friends;
