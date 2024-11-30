import React from "react";
import Link from "next/link";
import styles from "./styles.module.scss";
import { FactionColoredName } from "@/utils/factions";
import getOnlineStatus from "@/utils/getOnlineStatus";

const baseUrl = `https://census.daybreakgames.com/s:${process.env.SERVICE_ID}/get/ps2:v2`;

// Function to fetch killboard data
async function fetchKillboardData(character_id) {
  const killboardEndpoint = `${baseUrl}/characters_event_grouped/?character_id=${character_id}&type=KILL&c:limit=110&c:sort=count:-1`;
  const killboardRes = await fetch(killboardEndpoint, { cache: "no-store" });

  if (!killboardRes.ok) throw new Error("Failed to fetch killboard data");

  const killboardData = await killboardRes.json();
  const killEvents = killboardData.characters_event_grouped_list || [];

  const characterIds = killEvents.map((event) => event.character_id);
  if (characterIds.length === 0) {
    return [];
  }

  const namesEndpoint = `${baseUrl}/character?character_id=${characterIds.join(
    ","
  )}&c:show=character_id,name.first,faction_id,battle_rank.value,prestige_level&c:resolve=outfit`;
  const namesRes = await fetch(namesEndpoint, { cache: "no-store" });

  if (!namesRes.ok) throw new Error("Failed to fetch character names");

  const namesData = await namesRes.json();
  const namesList = namesData.character_list || [];
  const onlineStatuses = await getOnlineStatus(characterIds);

  return killEvents
    .map((event) => {
      const matchedCharacter = namesList.find(
        (character) => character.character_id === event.character_id
      );
      return {
        characterId: event.character_id,
        name: matchedCharacter?.name?.first || "Unknown",
        factionId: matchedCharacter?.faction_id || null,
        kills: event.count,
        battleRank: matchedCharacter?.battle_rank?.value || "N/A",
        prestigeLevel: matchedCharacter?.prestige_level || 0,
        outfit: {
          alias: matchedCharacter?.outfit?.alias || null,
          name: matchedCharacter?.outfit?.name || null,
        }, // Include both alias and name
        isOnline: onlineStatuses[event.character_id] || false,
      };
    })
    .filter(
      (entry) =>
        entry.characterId !== character_id && entry.name !== "Unknown"
    )
    .slice(0, 100);
}

// Function to fetch deathboard data
async function fetchDeathBoardData(character_id) {
  const deathboardEndpoint = `${baseUrl}/characters_event_grouped/?character_id=${character_id}&type=DEATH&c:groupBy=attacker_character_id&c:limit=110&c:sort=count:-1`;
  const deathboardRes = await fetch(deathboardEndpoint, { cache: "no-store" });

  if (!deathboardRes.ok) throw new Error("Failed to fetch death board data");

  const deathboardData = await deathboardRes.json();
  const deathEvents = deathboardData.characters_event_grouped_list || [];

  const attackerIds = deathEvents.map((event) => event.character_id);
  if (attackerIds.length === 0) {
    return [];
  }

  const attackerEndpoint = `${baseUrl}/character?character_id=${attackerIds.join(
    ","
  )}&c:show=character_id,name.first,faction_id,battle_rank.value,prestige_level&c:resolve=outfit`;
  const attackerRes = await fetch(attackerEndpoint, { cache: "no-store" });

  if (!attackerRes.ok) throw new Error("Failed to fetch attacker details");

  const attackerData = await attackerRes.json();
  const attackers = attackerData.character_list || [];
  const onlineStatuses = await getOnlineStatus(attackerIds);

  return deathEvents
    .map((event) => {
      const attacker = attackers.find(
        (char) => char.character_id === event.character_id
      );

      return {
        attackerId: event.character_id,
        name: attacker?.name?.first || "Unknown",
        factionId: attacker?.faction_id || null,
        deaths: event.count,
        battleRank: attacker?.battle_rank?.value || "N/A",
        prestigeLevel: attacker?.prestige_level || 0,
        outfit: {
          alias: attacker?.outfit?.alias || null,
          name: attacker?.outfit?.name || null,
        },
        isOnline: onlineStatuses[event.character_id] || false,
      };
    })
    .filter(
      (entry) =>
        entry.attackerId !== character_id && entry.name !== "Unknown"
    )
    .slice(0, 100);
}

export default async function Killboard({ character_id }) {
  let killboard = [];
  let deathBoard = [];
  try {
    [killboard, deathBoard] = await Promise.all([
      fetchKillboardData(character_id),
      fetchDeathBoardData(character_id),
    ]);
  } catch (err) {
    console.error("Error fetching killboard or deathboard:", err.message);
  }

  return (
    <>
      <h3>Top Kills</h3>
      {killboard.length > 0 ? (
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
                        className={`statusDot online`}
                        data-tooltip="Online"
                      ></span>
                    )}{" "}
                    <Link href={`/player/${entry.name}`}>
                      <FactionColoredName
                        name={entry.name}
                        factionId={entry.factionId}
                      />
                    </Link>
                    {entry.outfit && entry.outfit.alias && (
                      <>
                        {" "}
                        <Link
                          href={`/outfit/${entry.outfit.name}`}
                        >
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
      {deathBoard.length > 0 ? (
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
                        className={`statusDot online`}
                        data-tooltip="Online"
                      ></span>
                    )}{" "}
                    <Link href={`/player/${entry.name}`}>
                      <FactionColoredName
                        name={entry.name}
                        factionId={entry.factionId}
                      />
                    </Link>
                    {entry.outfit && entry.outfit.alias && (
                      <>
                        {" "}
                        <Link
                          href={`/outfit/${entry.outfit.name}`}
                        >
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
