import { NextResponse } from "next/server";

const SERVICE_ID = process.env.SERVICE_ID;
const baseUrl = `https://census.daybreakgames.com/s:${SERVICE_ID}/get/ps2:v2`;

const fetchWithRateLimit = async (urls, limit = 5) => {
  const results = [];
  for (let i = 0; i < urls.length; i += limit) {
    const batch = urls.slice(i, i + limit).map((url) =>
      fetch(url).then((res) => (res.ok ? res.json() : Promise.reject(res)))
    );
    results.push(...(await Promise.all(batch)));
  }
  return results;
};

const getCharacterDetails = async (characterIds) => {
  const urls = characterIds.map(
    (id) =>
      `${baseUrl}/character?character_id=${id}&c:resolve=outfit&c:show=character_id,name.first,faction_id,battle_rank.value,prestige_level,outfit.alias,outfit.name`
  );

  try {
    const results = await fetchWithRateLimit(urls, 10);
    return results
      .map((result) => result.character_list?.[0])
      .filter(Boolean);
  } catch (error) {
    console.error("Error fetching character details:", error);
    return [];
  }
};

export async function GET(req, context) {
  // Dynamically access params asynchronously
  const params = await context.params;
  const characterId = params?.characterId;

  if (!characterId) {
    return NextResponse.json(
      { error: "Character ID is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch raw deathboard data
    const deathboardEndpoint = `${baseUrl}/characters_event_grouped/?character_id=${characterId}&type=DEATH&c:groupBy=attacker_character_id&c:limit=110&c:sort=count:-1`;
    const deathboardRes = await fetch(deathboardEndpoint, { cache: "no-store" });

    if (!deathboardRes.ok) {
      throw new Error("Failed to fetch deathboard data");
    }

    const deathboardData = await deathboardRes.json();
    const deathEvents = deathboardData.characters_event_grouped_list || [];

    // Get attacker IDs and fetch details
    const attackerIds = deathEvents.map((event) => event.character_id);
    const attackerDetails = await getCharacterDetails(attackerIds);

    // Fetch online status for all attacker IDs
    const onlineStatusEndpoint = `${baseUrl}/characters_online_status?character_id=${attackerIds.join(",")}`;
    const onlineStatusRes = await fetch(onlineStatusEndpoint, { cache: "no-store" });

    if (!onlineStatusRes.ok) {
      throw new Error("Failed to fetch online status data");
    }

    const onlineStatusData = await onlineStatusRes.json();
    const onlineStatuses = onlineStatusData.characters_online_status_list.reduce((acc, status) => {
      acc[status.character_id] = status.online_status === "1"; // 1 = online, 0 = offline
      return acc;
    }, {});

    // Enrich deathboard data
    const enrichedDeathEvents = deathEvents.map((event) => {
      const attacker = attackerDetails.find((char) => char.character_id === event.character_id) || {};
      const outfit = attacker.outfit || {};

      return {
        name: attacker.name?.first || "Unknown",
        factionId: attacker.faction_id || null,
        battleRank: attacker.battle_rank?.value || "N/A",
        prestigeLevel: attacker.prestige_level || 0,
        deaths: parseInt(event.count, 10),
        characterId: event.character_id,
        isOnline: onlineStatuses[event.character_id] || false,
        outfit: {
          alias: outfit.alias || null,
          name: outfit.name || null,
        },
      };
    });

    // Filter and limit results
    const filteredDeathEvents = enrichedDeathEvents
      .filter(
        (entry) =>
          entry && // Exclude null entries
          entry.characterId !== characterId && // Exclude current character ID
          entry.name !== "Unknown" // Exclude entries with unknown names
      )
      .slice(0, 100); // Limit to the first 100 entries

    return NextResponse.json(filteredDeathEvents);
  } catch (error) {
    console.error("Deathboard API error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
