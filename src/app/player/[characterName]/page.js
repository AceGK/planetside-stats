import React from "react";
import Link from "next/link";
import styles from "./styles.module.scss";
import FactionLogo from "@/components/FactionLogo";
import TimePlayed from "@/components/character/TimePlayed";
import { getFactionColor, FactionColoredName } from "@/utils/factions";
import Killboard from "@/components/character/Killboard";
import Friends from "@/components/character/Friends";

async function fetchTitleName(titleId) {
  if (!titleId) return null;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/title/${titleId}`
  );

  if (response.ok) {
    const { titleName } = await response.json();
    return titleName;
  }

  return null;
}

async function getCharacterWorld(characterId) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/character/world/${characterId}`);
  if (!res.ok) {
    throw new Error("Failed to fetch character world data");
  }
  return res.json();
}

export default async function CharacterPage({ params: asyncParams }) {
  const params = await asyncParams;
  const { characterName } = params;
  const sanitizedCharacterName = characterName.trim().toLowerCase();

  try {
    // Fetch character data from the API
    const characterResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/character?characterName=${sanitizedCharacterName}`
    );

    const characterData = await characterResponse.json();
    if (!characterResponse.ok) {
      throw new Error(characterData.error || "Failed to fetch character data");
    }

    const { character_id, title_id, ...restCharacterData } = characterData;

    // Fetch world and title concurrently
    const [worldData, titleName] = await Promise.all([
      getCharacterWorld(character_id),
      fetchTitleName(title_id),
    ]);

    const { worldId, serverName } = worldData;
    const isOnline = restCharacterData.online_status === "1";

    const maxLevel = restCharacterData.prestige_level < 1 ? 120 : 100;
    const currentLevel = parseInt(restCharacterData.battle_rank.value, 10);
    const nextLevel = currentLevel + 1;

    return (
      <div className={styles.container}>
        {/* Character Header */}
        <header
          className={styles.header}
          style={{
            backgroundColor: `${getFactionColor(restCharacterData.faction_id)}33`,
          }}
        >
          <div className={styles.headerContent}>
            <div className={styles.characterDetails}>
              {titleName && <p className={styles.characterTitle}>{titleName}</p>}
              <h1 className={styles.characterName}>
                <FactionColoredName
                  name={restCharacterData.name.first}
                  factionId={restCharacterData.faction_id}
                />
                {restCharacterData.outfit && (
                  <>
                    {" "}
                    <Link href={`/outfit/${encodeURIComponent(restCharacterData.outfit.name.toLowerCase())}`}>
                      [{restCharacterData.outfit.alias}]
                    </Link>
                  </>
                )}
              </h1>
              <p className={styles.characterRank}>
                Battle Rank: {restCharacterData.battle_rank.value} ~ Prestige: {restCharacterData.prestige_level}
              </p>
              <p className={styles.characterServer}>Server: {serverName || "Unknown"}</p>
              <p className={styles.characterStatus}>
                <span
                  className={`statusDot ${isOnline ? "online" : "offline"}`}
                  data-tooltip={isOnline ? "Online" : "Offline"}
                ></span>{" "}
                <span className={styles.statusText}>
                  {isOnline ? "Online" : "Offline"}
                </span>
              </p>
            </div>
          </div>
          <FactionLogo factionId={restCharacterData.faction_id} className={styles.factionLogo} />
        </header>

        {/* General Information */}
        <section className={styles.section}>
          <h2>General Information</h2>
          <p><strong>Creation Date:</strong> {new Date(restCharacterData.times.creation * 1000).toLocaleDateString()}</p>
          <p><strong>Last Login:</strong> {new Date(restCharacterData.times.last_login * 1000).toLocaleString()}</p>
          <TimePlayed minutesPlayed={restCharacterData.times.minutes_played} />
        </section>

        {/* Battle Rank */}
        <section className={styles.section}>
          <h2>Battle Rank</h2>
          <p className={styles.characterRank}>
            Battle Rank: {currentLevel} ~ {restCharacterData.prestige_level > 0 && `Prestige ${restCharacterData.prestige_level}`}
          </p>
          <div className={styles.progressBarContainer}>
            <div
              className={styles.progressBar}
              style={{ width: `${restCharacterData.battle_rank.percent_to_next}%` }}
            ></div>
          </div>
          <p className={styles.progressText}>
            Progress: {restCharacterData.battle_rank.percent_to_next}%{" "}
            {currentLevel < maxLevel && (
              <span className={styles.nextLevel}>
                &nbsp;→ Next Level: {nextLevel}
              </span>
            )}
          </p>
        </section>

        {/* Certifications */}
        <section className={styles.section}>
          <h2>Certifications</h2>
          <div className={styles.statsGrid}>
            <div className={styles.stat}>
              <p><strong>Earned Points:</strong> {restCharacterData.certs.earned_points.toLocaleString()}</p>
            </div>
            <div className={styles.stat}>
              <p><strong>Available Points:</strong> {restCharacterData.certs.available_points.toLocaleString()}</p>
            </div>
          </div>
        </section>

        {/* Key Stats */}
        {/* <section className={styles.section}>
          <h2>Key Stats</h2>
          <div className={styles.statsGrid}>
            {restCharacterData.stats.stat_history.map((stat, index) => (
              <div key={index} className={styles.stat}>
                <p><strong>{stat.stat_name.replace("_", " ").toUpperCase()}:</strong> {stat.all_time.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section> */}

        {/* Friends */}
        <section className={styles.section}>
          <Friends characterId={character_id} />
        </section>

        {/* Killboard */}
        <section className={styles.section}>
          <h2>Killboard</h2>
          <Killboard character_id={character_id} />
        </section>
      </div>
    );
  } catch (error) {
    console.error("Error rendering CharacterPage:", error);
    return (
      <div className={styles.errorContainer}>
        <h1>Character Not Found</h1>
        <p>We couldn&apos;t find a character named &rdquo;{sanitizedCharacterName}&rdquo;.</p>
      </div>
    );
  }
}
