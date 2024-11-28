import React from "react";
import Link from "next/link";
import styles from "./styles.module.scss";
import faction from "@/utils/factions";
import FactionLogo from "@/components/FactionLogo";
import { worldNames, getCharacterWorldData } from "@/utils/world";

const factionColors = {
  "1": "#d90005", // Terran Republic
  "2": "#92009d", // Vanu Sovereignty
  "3": "#17d", // New Conglomerate
  "4": "#f4f4f4", // Nanite Systems Operatives
};

function getFactionColor(factionId) {
  return factionColors[factionId] || "var(--clr-default)";
}

const FactionColoredName = ({ name, factionId }) => (
  <span style={{ color: getFactionColor(factionId), fontWeight: 'bold' }} className={styles.factionName}>
    {name}
  </span>
);

// Main component
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

  return friendList.map((friend) => {
    const friendDetail = friendDetails.find((fd) => fd.character_id === friend.character_id);
    return {
      ...friend,
      name: friendDetail?.name?.first || "Unknown",
      faction_id: friendDetail?.faction_id || null,
      battle_rank: friendDetail?.battle_rank?.value || "N/A",
      prestige_level: friendDetail?.prestige_level || 0,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

async function getKillboardData(characterId) {
  const baseUrl = `https://census.daybreakgames.com/s:${process.env.SERVICE_ID}/get/ps2:v2`;
  const killboardEndpoint = `${baseUrl}/characters_event_grouped/?character_id=${characterId}&type=KILL&c:limit=101&c:sort=count:-1`;

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

  const namesEndpoint = `${baseUrl}/character?character_id=${characterIds.join(",")}&c:show=character_id,name.first,faction_id,battle_rank.value,prestige_level,online_status`;
  const namesRes = await fetch(namesEndpoint);

  if (!namesRes.ok) {
    throw new Error("Failed to fetch character data for names");
  }

  const namesData = await namesRes.json();
  const namesList = namesData.character_list || [];

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
        isOnline: matchedCharacter?.online_status?.status === "online",
      };
    })
    .filter((entry) => entry.characterId !== characterId) // Exclude the current character
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
    online_status,
  } = characterData;

  // Fetch detailed killboard data
  const killboard = await getKillboardData(character_id);

  // Fetch character world data using character_id
  const worldId = await getCharacterWorldData(character_id);
  const serverName = worldNames[worldId] || "Unknown";

  // Fetch friends data
  const friends = await getCharacterFriends(character_id);

  // Determine if the character is online
  const isOnline = online_status?.online_status_list?.[0]?.status === "online";

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>{name.first}</h1>
        <FactionLogo factionId={faction_id} />
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

      {/* friends */}
      <section className={styles.section}>
        <h2>Friends</h2>
        {friends.length > 0 ? (
          <div className={styles.friendsTableContainer}>
            <table className={styles.friendsTable}>
              <thead>
                <tr>
                  <th>Status + Name</th>
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
                      ></span>{" "}
                      <Link href={`/${friend.name}`} style={{ textDecoration: "none" }}>
                        <FactionColoredName name={friend.name} factionId={friend.faction_id} />
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

      {/* kill board */}
      <section className={styles.section}>
        <h2>Killboard</h2>
        {killboard.length > 0 ? (
          <div className={styles.killboardContainer}>
            <table className={styles.killboardTable}>
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
                      <span
                        className={`${styles.statusDot} ${entry.isOnline ? styles.online : styles.offline}`}
                        data-tooltip={entry.isOnline ? "Online" : "Offline"}
                      ></span>{" "}
                      <FactionColoredName name={entry.name} factionId={entry.factionId} />
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






    </div>
  );
}
