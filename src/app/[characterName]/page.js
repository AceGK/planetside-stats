import React from "react";
import styles from "./styles.module.scss";
import factionNames from "@/utils/factions";
import { worldNames, getCharacterWorldData } from "@/utils/world";

async function getCharacterData(characterName) {
  const baseUrl = `https://census.daybreakgames.com/s:${process.env.SERVICE_ID}/get/ps2:v2`;
  const endpoint = `${baseUrl}/character?name.first_lower=${characterName.toLowerCase()}&c:resolve=outfit,stat_history,online_status`;

  const res = await fetch(endpoint);

  if (!res.ok) {
    throw new Error("Failed to fetch character data");
  }

  const data = await res.json();
  return data.character_list?.[0] || null;
}

export default async function CharacterPage({ params: asyncParams }) {
  const params = await asyncParams;
  const { characterName } = params;

  // Fetch character data
  const characterData = await getCharacterData(characterName);

  if (!characterData) {
    return (
      <div className={styles.errorContainer}>
        <h1>Character Not Found</h1>
        <p>We couldn&apos;t find a character named &rdquo;{characterName}&rdquo;.</p>
      </div>
    );
  }

  const { character_id, name, faction_id, battle_rank, prestige_level, times, certs, outfit, stats, online_status } =
    characterData;

  // Fetch character world data using character_id
  const worldId = await getCharacterWorldData(character_id);
  const serverName = worldNames[worldId] || "Unknown";

  // Determine if the character is online
  const isOnline = online_status?.online_status_list?.[0]?.status === "online";

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>{name.first}</h1>
        <p>Faction: {factionNames[faction_id]}</p>
        <p>Battle Rank: {battle_rank.value} (Prestige Level: {prestige_level})</p>
        <p>Server: {serverName}</p>
        <p>Status: <span style={{ color: isOnline ? "green" : "red" }}>{isOnline ? "Online" : "Offline"}</span></p>
      </header>

      <section className={styles.section}>
        <h2>General Information</h2>
        <p><strong>Creation Date:</strong> {new Date(times.creation * 1000).toLocaleDateString()}</p>
        <p><strong>Last Login:</strong> {new Date(times.last_login * 1000).toLocaleString()}</p>
        <p><strong>Minutes Played:</strong> {times.minutes_played.toLocaleString()} minutes</p>
      </section>

      {outfit && (
        <section className={styles.section}>
          <h2>Outfit</h2>
          <p><strong>Outfit Name:</strong> {outfit.name} (Alias: {outfit.alias})</p>
          <p><strong>Members:</strong> {outfit.member_count}</p>
        </section>
      )}

      <section className={styles.section}>
        <h2>Certifications</h2>
        <div className={styles.statsGrid}>
          <div className={styles.stat}>
            <p><strong>Earned Points:</strong> {certs.earned_points.toLocaleString()}</p>
          </div>
          <div className={styles.stat}>
            <p><strong>Available Points:</strong> {certs.available_points.toLocaleString()}</p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Key Stats</h2>
        <div className={styles.statsGrid}>
          {stats.stat_history.map((stat, index) => (
            <div key={index} className={styles.stat}>
              <p><strong>{stat.stat_name.replace("_", " ").toUpperCase()}:</strong> {stat.all_time.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
