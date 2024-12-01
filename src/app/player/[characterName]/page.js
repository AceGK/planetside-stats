import React from "react";
import Link from "next/link";
import styles from "./styles.module.scss";
import FactionLogo from "@/components/FactionLogo";
import TimePlayed from "@/components/character/TimePlayed";
import TitleName from "@/components/character/Title";
import Server from "@/components/character/Server"; // Import the new Server component
import { getFactionColor, FactionColoredName } from "@/utils/factions";
import Killboard from "@/components/character/Killboard";
import Friends from "@/components/character/Friends";
import Performance from "@/components/character/Performance";
import { GiRank3 } from "react-icons/gi";
import { FaUser } from "react-icons/fa";


export default async function CharacterPage({ params: asyncParams }) {
  const params = await asyncParams;
  const { characterName } = params;
  const sanitizedCharacterName = characterName.trim().toLowerCase();

  try {
    // Fetch character data from the API, excluding stats
    const characterResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/character?characterName=${sanitizedCharacterName}`
    );

    const characterData = await characterResponse.json();
    if (!characterResponse.ok) {
      throw new Error(characterData.error || "Failed to fetch character data");
    }

    // Explicitly extract only the needed fields
    const {
      character_id,
      title_id,
      battle_rank,
      certs,
      faction_id,
      name,
      online_status,
      outfit,
      prestige_level,
      times,
    } = characterData;
    console.log(characterData)
    console.log(character_id)

    const isOnline = online_status === "1";

    const maxLevel = prestige_level < 1 ? 120 : 100;
    const currentLevel = parseInt(battle_rank.value, 10);
    const nextLevel = currentLevel + 1;

    return (
      <div className={styles.container}>
        {/* Character Header */}
        <header
          className={styles.header}
          style={{
            backgroundColor: `${getFactionColor(faction_id)}33`,
          }}
        >
          <div className={styles.headerContent}>
            <div className={styles.characterDetails}>
              <TitleName titleId={title_id} />
              <h1 className={styles.characterName}>
                <FactionColoredName name={name.first} factionId={faction_id} />
                {outfit && (
                  <>
                    {" "}
                    <Link
                      href={`/outfit/${encodeURIComponent(
                        outfit.name.toLowerCase()
                      )}`}
                    >
                      [{outfit.alias}]
                    </Link>
                  </>
                )}
              </h1>
              <p className={styles.characterRank}>
                Battle Rank: {battle_rank.value}
              </p>
              <p className={styles.characterRank}>
                Prestige: {prestige_level}
              </p>
              <Server characterId={character_id} />
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
          <FactionLogo factionId={faction_id} className={styles.factionLogo} />
        </header>

        {/* General Information */}
        <section className={styles.section}>
          <h2>
          General</h2>
          <p>
            <strong>Creation Date:</strong>{" "}
            {new Date(times.creation * 1000).toLocaleDateString()}
          </p>
          <p>
            <strong>Last Login:</strong>{" "}
            {new Date(times.last_login * 1000).toLocaleString()}
          </p>
          <TimePlayed minutesPlayed={times.minutes_played} />
        </section>

        {/* Battle Rank */}
        <section className={styles.section}>
          <h2>

            Battle Rank
          </h2>
          <p className={styles.characterRank}>Battle Rank: {currentLevel}</p>
          <p className={styles.characterRank}>Prestige {prestige_level}</p>
          <div className={styles.progressBarContainer}>
            <div
              className={styles.progressBar}
              style={{
                width: `${battle_rank.percent_to_next}%`,
              }}
            ></div>
          </div>
          <p className={styles.progressText}>
            Progress: {battle_rank.percent_to_next}%{" "}
            {currentLevel < maxLevel && (
              <span className={styles.nextLevel}>
                &nbsp;→ Next Level: {nextLevel}
              </span>
            )}
          </p>
        </section>

        {/* Certifications */}
        {/* <section className={styles.section}>
          <h2>Certifications</h2>
          <div>
            <div>
              <p>
                <strong>Earned Points:</strong>{" "}
                {parseInt(certs.earned_points, 10).toLocaleString()}
              </p>
            </div>
            <div>
              <p>
                <strong>Spent Points:</strong>{" "}
                {parseInt(certs.spent_points, 10).toLocaleString()}
              </p>
            </div>
            <div>
              <p>
                <strong>Available Points:</strong>{" "}
                {parseInt(certs.available_points, 10).toLocaleString()}
              </p>
            </div>
          </div>
          <div className={styles.certProgressContainer}>
            <div
              className={styles.certProgressBar}
              style={{
                width: `${(parseFloat(certs.percent_to_next) * 100).toFixed(
                  2
                )}%`,
              }}
            ></div>
          </div>
          <p className={styles.progressText}>
            Progress to Next Point:{" "}
            {(parseFloat(certs.percent_to_next) * 100).toFixed(2)}%
          </p>
        </section> */}

        {/* Other Components */}
        <section className={styles.section}>
          <Performance characterId={character_id} />
        </section>

        <section className={styles.section}>
          <Friends characterId={character_id} />
        </section>

        <section className={styles.section}>
          <Killboard character_id={character_id} />
        </section>
      </div>
    );
  } catch (error) {
    console.error("Error rendering CharacterPage:", error);
    return (
      <div className={styles.errorContainer}>
        <h1>Character Not Found</h1>
        <p>
          We couldn&apos;t find a character named &rdquo;{sanitizedCharacterName}&rdquo;.
        </p>
      </div>
    );
  }
}

