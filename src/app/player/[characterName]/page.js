import React from "react";
import Link from "next/link";
import styles from "./styles.module.scss";
import FactionLogo from "@/components/FactionLogo";
import { worldNames, getCharacterWorldData } from "@/utils/world";
import TimePlayed from "@/components/character/TimePlayed";
import getOnlineStatus from "@/utils/getOnlineStatus";
import { getFactionColor, FactionColoredName } from "@/utils/factions";
import Killboard from "@/components/character/Killboard";


async function getTitleData(titleId) {
  if (!titleId) return null;

  const baseUrl = `https://census.daybreakgames.com/s:${process.env.SERVICE_ID}/get/ps2:v2`;
  const endpoint = `${baseUrl}/title?title_id=${titleId}`;

  const res = await fetch(endpoint);

  if (!res.ok) {
    throw new Error("Failed to fetch title data");
  }

  const data = await res.json();
  const title = data.title_list?.[0]?.name?.en;
  return title || null;
}


async function getCharacterData(characterName) {
  const baseUrl = `https://census.daybreakgames.com/s:${process.env.SERVICE_ID}/get/ps2:v2`;
  const endpoint = `${baseUrl}/character?name.first_lower=${characterName.toLowerCase()}&c:resolve=outfit,stat_history,online_status,title_id`;

  const res = await fetch(endpoint);

  if (!res.ok) {
    throw new Error("Failed to fetch character data");
  }

  const data = await res.json();
  const character = data.character_list?.[0];

  if (!character) return null;

  // Fetch the title name
  const titleName = await getTitleData(character.title_id);

  return { ...character, titleName };
}

async function getFriendDetails(friendIds) {
  const baseUrl = `https://census.daybreakgames.com/s:${process.env.SERVICE_ID}/get/ps2:v2`;
  const idsQuery = friendIds.join(",");

  const endpoint = `${baseUrl}/character?character_id=${idsQuery}&c:resolve=outfit&c:show=character_id,name.first,faction_id,battle_rank.value,prestige_level,outfit.alias,outfit.name`;
  const res = await fetch(endpoint);

  if (!res.ok) {
    throw new Error("Failed to fetch friend details");
  }

  const data = await res.json();
  return data.character_list || [];
}

async function getCharacterFriends(characterId) {
  const baseUrl = `https://census.daybreakgames.com/s:${process.env.SERVICE_ID}/get/ps2:v2`;
  const endpoint = `${baseUrl}/characters_friend?character_id=${characterId}`;

  const res = await fetch(endpoint);

  if (!res.ok) {
    throw new Error("Failed to fetch character friends");
  }

  const data = await res.json();
  const characterFriendData = data.characters_friend_list?.[0];
  const friendList = characterFriendData?.friend_list || [];

  const friendIds = friendList.map((friend) => friend.character_id);
  if (friendIds.length === 0) return [];

  const friendDetails = await getFriendDetails(friendIds);
  const onlineStatuses = await getOnlineStatus(friendIds);

  return friendList.map((friend) => {
    const friendDetail = friendDetails.find((fd) => fd.character_id === friend.character_id);
    return {
      ...friend,
      name: friendDetail?.name?.first || "Unknown",
      faction_id: friendDetail?.faction_id || null,
      battle_rank: friendDetail?.battle_rank?.value || "N/A",
      prestige_level: friendDetail?.prestige_level || 0,
      isOnline: onlineStatuses[friend.character_id] || false,
      outfit: friendDetail?.outfit || "n/a",
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
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

  // Fetch friends data
  const friends = await getCharacterFriends(character_id);
  console.log(friends);

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
                  <Link href={`/outfit/${encodeURIComponent(outfit.name)}`}>
                    [{outfit.alias}]
                  </Link>
                </>
              )}
            </h1>
            <p className={styles.characterRank}>
              Battle Rank: {battle_rank.value} ~ Prestige: {prestige_level}
            </p>

            <p className={styles.characterServer}>
              Server: {serverName}
            </p>
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
        <h2>
          Friends{" "}
          <span className="friendsCount">
            {friends.length > 0 ? `(${friends.length})` : "(0)"}
          </span>
        </h2>
        {friends.length > 0 ? (
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
                        className={`statusDot ${friend.online === "1" ? "online" : "offline"
                          }`}
                        data-tooltip={friend.online === "1" ? "Online" : "Offline"}
                      ></span>
                    </td>
                    <td>
                      <Link
                        href={`/player/${friend.name}`}
                        style={{ textDecoration: "none" }}
                      >
                        <FactionColoredName
                          name={friend.name}
                          factionId={friend.faction_id}
                        />
                        {friend.outfit.alias && <span> [{friend.outfit.alias}]</span>}
                      </Link>
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
          <p>This character has no friends listed.</p>
        )}
      </section>

      {/* Killboard Section */}
      <section className={styles.section}>
        <h2>Killboard</h2>
        <Killboard character_id={character_id} />
      </section>

    </div >
  );
}
