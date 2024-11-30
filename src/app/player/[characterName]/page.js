import React from "react";
import Link from "next/link";
import styles from "./styles.module.scss";
import FactionLogo from "@/components/FactionLogo";
import { worldNames, getCharacterWorldData } from "@/utils/world";
import TimePlayed from "@/components/character/TimePlayed";
import { getFactionColor, FactionColoredName } from "@/utils/factions";
import Killboard from "@/components/character/Killboard";
import Friends from "@/components/character/Friends";
import { characterTitle } from "@/utils/characterTitle";


async function getCharacterData(characterName) {
  const baseUrl = `https://census.daybreakgames.com/s:${process.env.SERVICE_ID}/get/ps2:v2`;

  // Use `name.first_lower` with lowercase conversion
  const endpoint = `${baseUrl}/character?name.first_lower=${characterName.toLowerCase()}&c:resolve=outfit,stat_history,online_status,title_id`;

  const res = await fetch(endpoint);

  if (!res.ok) {
    throw new Error("Failed to fetch character data");
  }

  const data = await res.json();
  const character = data.character_list?.[0];

  if (!character) return null;

  // Fetch the title name
  const titleName = await characterTitle(character.title_id);

  return { ...character, titleName };
}

export default async function CharacterPage({ params: asyncParams }) {
  const params = await asyncParams;
  const { characterName } = params;

  // Sanitize and convert characterName to lowercase
  const sanitizedCharacterName = characterName.trim().toLowerCase();

  // Fetch character data
  const characterData = await getCharacterData(sanitizedCharacterName);

  if (!characterData) {
    return (
      <div className={styles.errorContainer}>
        <h1>Character Not Found</h1>
        <p>We couldn&apos;t find a character named &rdquo;{sanitizedCharacterName}&rdquo;.</p>
      </div>
    );
  }

  const {
    character_id,
    name,
    faction_id,
    battle_rank,
    prestige_level,
    times,
    certs,
    outfit,
    stats,
    titleName,
  } = characterData;

  // Fetch character world data using character_id
  const worldId = await getCharacterWorldData(character_id);
  const serverName = worldNames[worldId] || "Unknown";

  // Determine if the character is online
  const isOnline = characterData.online_status === "1";

  // experience level
  const maxLevel = prestige_level < 1 ? 120 : 100;
  const currentLevel = parseInt(battle_rank.value, 10);
  const nextLevel = currentLevel + 1;

  return (
    <div className={styles.container}>
      <header
        className={styles.header}
        style={{
          backgroundColor: `${getFactionColor(faction_id)}33`,
        }}
      >
        <div className={styles.headerContent}>
          <div className={styles.characterDetails}>
            {titleName && (
              <p className={styles.characterTitle}>{titleName}</p>
            )}
            <h1 className={styles.characterName}>
              <FactionColoredName name={name.first} factionId={faction_id} />
              {outfit && (
                <>
                  {" "}
                  <Link href={`/outfit/${encodeURIComponent(outfit.name.toLowerCase())}`}>
                    [{outfit.alias}]
                  </Link>
                </>
              )}
            </h1>
            <p className={styles.characterRank}>
              Battle Rank: {battle_rank.value} ~ Prestige: {prestige_level}
            </p>
            <p className={styles.characterServer}>Server: {serverName}</p>
            <p className={styles.characterStatus}>
              <span
                className={`statusDot ${isOnline ? 'online' : 'offline'}`}
                data-tooltip={isOnline ? "Online" : "Offline"}
              ></span>{" "}
              <span className={styles.statusText}>
                {isOnline ? "Online" : "Offline"}
              </span>
            </p>
          </div>
        </div>
        <FactionLogo factionId={faction_id} className={styles.factionLogo} />
      </header>

      <section className={styles.section}>
        <h2>General Information</h2>
        <p><strong>Creation Date:</strong> {new Date(times.creation * 1000).toLocaleDateString()}</p>
        <p><strong>Last Login:</strong> {new Date(times.last_login * 1000).toLocaleString()}</p>
        <TimePlayed minutesPlayed={times.minutes_played} />
      </section>

      <section className={styles.section}>
        <h2>Battle Rank</h2>
        <p className={styles.characterRank}>
          Battle Rank: {currentLevel} ~ {prestige_level > 0 && `Prestige ${prestige_level}`}
        </p>
        <div className={styles.progressBarContainer}>
          <div
            className={styles.progressBar}
            style={{ width: `${battle_rank.percent_to_next}%` }}
          ></div>
        </div>
        <p className={styles.progressText}>
          Progress: {battle_rank.percent_to_next}%
          {currentLevel < maxLevel && (
            <span className={styles.nextLevel}>
              &nbsp;→ Next Level: {nextLevel}
            </span>
          )}
        </p>
      </section>

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

      {/* Friends Section */}
      <section className={styles.section}>
  <Friends characterId={character_id} />
</section>

      {/* Killboard Section */}
      <section className={styles.section}>
        <h2>Killboard</h2>
        <Killboard character_id={character_id} />
      </section>

    </div >
  );
}
