//api/character/world/[characterId]/route.js

import { NextResponse } from "next/server";

const SERVICE_ID = process.env.SERVICE_ID;

// Map of world IDs to names
const worldNames = {
  1: "Connery",
  10: "Miller",
  13: "Cobalt",
  17: "Emerald",
  19: "SolTech",
  25: "Jaeger",
};

// Fetch character world data
async function fetchCharacterWorldData(characterId) {
  const baseUrl = `https://census.daybreakgames.com/s:${SERVICE_ID}/get/ps2`;
  const endpoint = `${baseUrl}/characters_world?character_id=${characterId}`;

  const res = await fetch(endpoint);
  if (!res.ok) {
    throw new Error("Failed to fetch character world data");
  }

  const data = await res.json();
  return data.characters_world_list?.[0]?.world_id || null;
}

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
    const worldId = await fetchCharacterWorldData(characterId);
    const serverName = worldNames[worldId] || "Unknown";
    return NextResponse.json({ worldId, serverName });
  } catch (error) {
    console.error("Error fetching world data:", error);
    return NextResponse.json(
      { error: "Failed to fetch character world data" },
      { status: 500 }
    );
  }
}
