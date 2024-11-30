import React from "react";
import Link from "next/link"; // Import Link from Next.js
import styles from "./styles.module.scss";
import FactionLogo from "@/components/FactionLogo";
import getOnlineStatus from "@/utils/getOnlineStatus";
import { FactionColoredName } from "@/utils/factions";

async function fetchOutfitData(outfitName) {
  const baseUrl = `https://census.daybreakgames.com/s:${process.env.SERVICE_ID}/get/ps2:v2`;
  
  // Ensure outfitName is lowercase
  const outfitEndpoint = `${baseUrl}/outfit?name_lower=${outfitName.toLowerCase()}&c:resolve=member`;

  const res = await fetch(outfitEndpoint);

  if (!res.ok) {
    throw new Error("Failed to fetch outfit data");
  }

  const data = await res.json();
  const outfit = data.outfit_list?.[0] || null;

  if (!outfit) {
    console.error("No outfit found for:", outfitName);
    return null;
  }

  // Process outfit members and other details
  outfit.members = Array.isArray(outfit.members) ? outfit.members : [];

  const membersWithRanks = outfit.members.map((member) => ({
    character_id: member.character_id,
    rank: member.rank,
    rank_ordinal: member.rank_ordinal,
  }));

  const memberIds = membersWithRanks.map((member) => member.character_id);
  const detailedMembers = await fetchMemberDetails(memberIds);

  const onlineStatuses = await getOnlineStatus(memberIds);

  outfit.members = detailedMembers.map((member) => {
    const memberRankInfo = membersWithRanks.find((m) => m.character_id === member.character_id);
    return {
      ...member,
      rank: memberRankInfo?.rank || "Unknown",
      rank_ordinal: parseInt(memberRankInfo?.rank_ordinal) || Number.MAX_SAFE_INTEGER,
      isOnline: onlineStatuses[member.character_id] || false,
    };
  });

  const factionCounts = outfit.members.reduce((acc, member) => {
    if (["1", "2", "3"].includes(member.faction_id)) {
      acc[member.faction_id] = (acc[member.faction_id] || 0) + 1;
    }
    return acc;
  }, {});

  outfit.faction_id = Object.entries(factionCounts).reduce((mostCommonFaction, [factionId, count]) => {
    if (!mostCommonFaction || count > factionCounts[mostCommonFaction]) {
      return factionId;
    }
    return mostCommonFaction;
  }, null);

  outfit.members.sort((a, b) => a.rank_ordinal - b.rank_ordinal);

  return outfit;
}


async function fetchMemberDetails(memberIds) {
  const baseUrl = `https://census.daybreakgames.com/s:${process.env.SERVICE_ID}/get/ps2:v2`;
  const idsQuery = memberIds.join(",");
  const endpoint = `${baseUrl}/character?character_id=${idsQuery}&c:show=character_id,name.first,faction_id,battle_rank.value,prestige_level`;

  const res = await fetch(endpoint);

  if (!res.ok) {
    throw new Error("Failed to fetch member details");
  }

  const data = await res.json();
  return data.character_list || [];
}

export default async function OutfitPage({ params: asyncParams }) {
  const params = await asyncParams;
  
  // Convert hyphens back to spaces and ensure lowercase
  const outfitName = params.outfitName.replace(/-/g, " ").toLowerCase();

  const outfitData = await fetchOutfitData(outfitName);

  if (!outfitData) {
    return (
      <div className={styles.errorContainer}>
        <h1>Outfit Not Found</h1>
        <p>We couldn&apos;t find an outfit named &rdquo;{outfitName}&rdquo;.</p>
      </div>
    );
  }

  const { name, alias, members, faction_id } = outfitData;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>
          {name} [{alias}]
        </h1>

        {faction_id && <FactionLogo factionId={faction_id} className={styles.factionLogo} />}
      </header>

      <section className={styles.section}>
        <h2>
          Members{" "}
          <span className={styles.membersCount}>
            {members.length > 0 ? `(${members.length})` : "(0)"}
          </span>
        </h2>
        {members.length > 0 ? (
          <div className="tableContainer outfit-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>BR ~ Prestige</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.character_id}>
                    <td>{member?.rank || "Unknown"}</td>
                    <td>
                      <span
                        className={`statusDot ${member.isOnline ? "online" : "offline"}`}
                        data-tooltip={member.isOnline ? "Online" : "Offline"}
                      ></span>{" "}
                      <Link href={`/player/${member?.name?.first}`} passHref>
                        <FactionColoredName
                          name={member?.name?.first || "Unknown"}
                          factionId={member?.faction_id}
                        />
                      </Link>
                    </td>
                    <td>
                      {member?.battle_rank?.value || "N/A"} ~ {member?.prestige_level || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No members found in this outfit.</p>
        )}
      </section>
    </div>
  );
}


