'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FactionColoredName } from "@/utils/factions";

export default function Killboard({ character_id }) {
  const [killboard, setKillboard] = useState([]);
  const [deathBoard, setDeathBoard] = useState([]);
  const [killboardLoading, setKillboardLoading] = useState(true);
  const [deathBoardLoading, setDeathBoardLoading] = useState(true);
  const [killboardError, setKillboardError] = useState(null);
  const [deathBoardError, setDeathBoardError] = useState(null);

  useEffect(() => {
    async function fetchKillboardData() {
      setKillboardLoading(true);
      try {
        const killboardRes = await fetch(
          `/api/character/killboard/kills/${character_id}`
        );
        if (!killboardRes.ok) {
          throw new Error("Failed to fetch killboard data");
        }
        const killboardData = await killboardRes.json();
        setKillboard(killboardData);
      } catch (err) {
        console.error(err);
        setKillboardError("Failed to fetch killboard data.");
      } finally {
        setKillboardLoading(false);
      }
    }

    async function fetchDeathBoardData() {
      setDeathBoardLoading(true);
      try {
        const deathBoardRes = await fetch(
          `/api/character/killboard/deaths/${character_id}`
        );
        if (!deathBoardRes.ok) {
          throw new Error("Failed to fetch death board data");
        }
        const deathBoardData = await deathBoardRes.json();
        setDeathBoard(deathBoardData);
      } catch (err) {
        console.error(err);
        setDeathBoardError("Failed to fetch death board data.");
      } finally {
        setDeathBoardLoading(false);
      }
    }

    fetchKillboardData();
    fetchDeathBoardData();
  }, [character_id]);

  return (
    <>
      <h2>Killboard</h2>
      <h3>Top Kills</h3>
      {killboardLoading ? (
        <p>Loading killboard...</p>
      ) : killboardError ? (
        <p>{killboardError}</p>
      ) : killboard.length > 0 ? (
        <div className="tableContainer">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Kills</th>
                <th>BR ~ Prestige</th>
              </tr>
            </thead>
            <tbody>
              {killboard.map((entry, index) => (
                <tr key={index}>
                  <td>#{index + 1}</td>
                  <td>
                    {entry.isOnline && (
                      <span
                        className="statusDot online"
                        title="Online"
                      ></span>
                    )}
                    <Link href={`/player/${entry.name}`}>
                      <FactionColoredName
                        name={entry.name}
                        factionId={entry.factionId}
                      />
                    </Link>
                    {entry.outfit?.alias && (
                      <>
                        {" "}
                        <Link href={`/outfit/${entry.outfit.name}`}>
                          [{entry.outfit.alias}]
                        </Link>
                      </>
                    )}
                  </td>
                  <td>{entry.kills}</td>
                  <td>
                    {entry.battleRank} ~ {entry.prestigeLevel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No kills recorded.</p>
      )}

      <h3>Top Deaths</h3>
      {deathBoardLoading ? (
        <p>Loading death board...</p>
      ) : deathBoardError ? (
        <p>{deathBoardError}</p>
      ) : deathBoard.length > 0 ? (
        <div className="tableContainer">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Deaths</th>
                <th>BR ~ Prestige</th>
              </tr>
            </thead>
            <tbody>
              {deathBoard.map((entry, index) => (
                <tr key={index}>
                  <td>#{index + 1}</td>
                  <td>
                    {entry.isOnline && (
                      <span
                        className="statusDot online"
                        title="Online"
                      ></span>
                    )}
                    <Link href={`/player/${entry.name}`}>
                      <FactionColoredName
                        name={entry.name}
                        factionId={entry.factionId}
                      />
                    </Link>
                    {entry.outfit?.alias && (
                      <>
                        {" "}
                        <Link href={`/outfit/${entry.outfit.name}`}>
                          [{entry.outfit.alias}]
                        </Link>
                      </>
                    )}
                  </td>
                  <td>{entry.deaths}</td>
                  <td>
                    {entry.battleRank} ~ {entry.prestigeLevel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No deaths recorded.</p>
      )}
    </>
  );
}
