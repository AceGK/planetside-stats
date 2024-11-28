// utils/world.js

// Map of world IDs to names
export const worldNames = {
  1: "Connery",
  10: "Miller",
  13: "Cobalt",
  17: "Emerald",
  19: "SolTech",
  25: "Jaeger",
};

// Fetch character world data
export async function getCharacterWorldData(characterId) {
  const baseUrl = `https://census.daybreakgames.com/s:${process.env.SERVICE_ID}/get/ps2`;
  const endpoint = `${baseUrl}/characters_world?character_id=${characterId}`;

  const res = await fetch(endpoint);

  if (!res.ok) {
    throw new Error("Failed to fetch character world data");
  }

  const data = await res.json();
  return data.characters_world_list?.[0]?.world_id || null;
}
