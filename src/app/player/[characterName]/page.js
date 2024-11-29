import React from "react";
import Link from "next/link";
import styles from "./styles.module.scss";
import faction from "@/utils/factions";
import FactionLogo from "@/components/FactionLogo";
import { worldNames, getCharacterWorldData } from "@/utils/world";
import TimePlayed from "@/components/TimePlayed";

const factionColors = {
  "3": "#e61f23", // Terran Republic
  "2": "#007dc3", // New Conglomerate
  "1": "#9139d0", // Vanu Sovereignty
  "4": "#b7b7b7", // Nanite Systems Operatives
};

function getFactionColor(factionId) {
  return factionColors[factionId] || "var(--clr-default)";
}

const FactionColoredName = ({ name, factionId }) => (
  <span style={{ color: getFactionColor(factionId), fontWeight: 'bold' }} className={styles.factionName}>
    {name}
  </span>
);

async function getTitleData(titleId) {
  if (!titleId) return null;

  const baseUrl = `https://census.daybreakgames.com/s:${process.env.SERVICE_ID}/get/ps2:v2`;
  const endpoint = `${baseUrl}/title?title_id=${titleId}`;

  const res = await fetch(endpoint);

  if (!res.ok) {
    throw new Error("Failed to fetch title data");
  }

  const data = await res.json();
  const title = data.title_list?.[0]?.name?.en; // Use English title
  return title || null;
}

// Main component
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


// online status for friends and killboard
async function getOnlineStatus(characterIds) {
  const baseUrl = `https://census.daybreakgames.com/s:${process.env.SERVICE_ID}/get/ps2:v2`;
  const endpoint = `${baseUrl}/characters_online_status?character_id=${characterIds.join(",")}`;

  const res = await fetch(endpoint);

  if (!res.ok) {
    throw new Error("Failed to fetch online statuses");
  }

  const data = await res.json();
  const statusList = data.characters_online_status_list || [];
  return statusList.reduce((acc, status) => {
    acc[status.character_id] = status.online_status === "1"; // Map character_id to true/false for online status
    return acc;
  }, {});
}

async function getFriendDetails(friendIds) {
  const baseUrl = `https://census.daybreakgames.com/s:${process.env.SERVICE_ID}/get/ps2:v2`;
  const idsQuery = friendIds.join(",");

  const endpoint = `${baseUrl}/character?character_id=${idsQuery}&c:show=character_id,name.first,faction_id,battle_rank.value,prestige_level`;
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
      isOnline: onlineStatuses[friend.character_id] || false, // Use the online status map
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

async function getKillboardData(characterId) {
  const baseUrl = `https://census.daybreakgames.com/s:${process.env.SERVICE_ID}/get/ps2:v2`;
  const killboardEndpoint = `${baseUrl}/characters_event_grouped/?character_id=${characterId}&type=KILL&c:limit=200&c:sort=count:-1`;

  const res = await fetch(killboardEndpoint);
  if (!res.ok) {
    throw new Error("Failed to fetch killboard data");
  }

  const data = await res.json();
  const killEvents = data.characters_event_grouped_list || [];

  const characterIds = killEvents.map((event) => event.character_id);
  if (characterIds.length === 0) {
    return [];
  }

  const namesEndpoint = `${baseUrl}/character?character_id=${characterIds.join(",")}&c:show=character_id,name.first,faction_id,battle_rank.value,prestige_level`;
  const namesRes = await fetch(namesEndpoint);

  if (!namesRes.ok) {
    throw new Error("Failed to fetch character data for names");
  }

  const namesData = await namesRes.json();
  const namesList = namesData.character_list || [];

  const onlineStatuses = await getOnlineStatus(characterIds);

  return killEvents
    .map((event) => {
      const matchedCharacter = namesList.find((character) => character.character_id === event.character_id);
      return {
        characterId: event.character_id,
        name: matchedCharacter?.name?.first || "Name Unavailable",
        factionId: matchedCharacter?.faction_id || null,
        kills: event.count,
        battleRank: matchedCharacter?.battle_rank?.value || "N/A",
        prestigeLevel: matchedCharacter?.prestige_level || 0,
        isOnline: onlineStatuses[event.character_id] || false, // Use the online status map
      };
    })
    .filter((entry) => entry.name !== "Name Unavailable" && entry.characterId !== characterId) // Remove unavailable names and current character
    .slice(0, 100); // Ensure only 100 entries
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

  // Fetch detailed killboard data
  const killboard = await getKillboardData(character_id);

  // Fetch character world data using character_id
  const worldId = await getCharacterWorldData(character_id);
  const serverName = worldNames[worldId] || "Unknown";

  // Fetch friends data
  const friends = await getCharacterFriends(character_id);

  // Determine if the character is online
  const isOnline = characterData.online_status === "1";

  // console.log(killboard)

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
                className={`${styles.statusDot} ${isOnline ? styles.online : styles.offline
                  }`}
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

      {/* {
        outfit && (
          <section className={styles.section}>
            <h2>Outfit</h2>
            <p>
              <strong>Outfit Name:</strong>{" "}
              <Link href={`/outfit/${encodeURIComponent(outfit.name)}`}>
                {outfit.name} [{outfit.alias}]
              </Link>
            </p>
            <p>
              <strong>Members:</strong> {outfit.member_count}
            </p>
          </section>
        )
      } */}

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
          <span className={styles.friendsCount}>
            {friends.length > 0 ? `(${friends.length})` : "(0)"}
          </span>
        </h2>
        {friends.length > 0 ? (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
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
                        className={`${styles.statusDot} ${friend.online === "1" ? styles.online : styles.offline}`}
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
        {killboard.length > 0 ? (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
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
                          className={`${styles.statusDot} ${styles.online}`}
                          data-tooltip="Online"
                        ></span>
                      )}{" "}
                      <Link href={`/player/${entry.name}`} style={{ textDecoration: "none" }}>
                        <FactionColoredName name={entry.name} factionId={entry.factionId} />
                      </Link>
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
      </section>


    </div >
  );
}
