import { NextResponse } from "next/server";

const SERVICE_ID = process.env.SERVICE_ID;

// Fetch the full stat history
async function fetchCharacterStatHistory(characterId) {
  const baseUrl = `https://census.daybreakgames.com/s:${SERVICE_ID}/get/ps2`;
  const endpoint = `${baseUrl}/characters_stat_history?character_id=${characterId}&c:limit=100`;

  const res = await fetch(endpoint);

  if (!res.ok) {
    throw new Error("Failed to fetch character stat history");
  }

  const data = await res.json();

  // Log for debugging purposes
  console.log("Fetched Data:", data);

  // Return all stat history records or an empty array
  return data.characters_stat_history_list || [];
}

export async function GET(req, context) {
  const { characterId } = context.params;

  if (!characterId) {
    return NextResponse.json(
      { error: "Character ID is required" },
      { status: 400 }
    );
  }

  try {
    const statHistory = await fetchCharacterStatHistory(characterId);

    if (!statHistory.length) {
      return NextResponse.json(
        { error: "No stats found for the given character ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({ stat_history: statHistory });
  } catch (error) {
    console.error("Error fetching character stat history:", error);
    return NextResponse.json(
      { error: "Failed to fetch character stat history" },
      { status: 500 }
    );
  }
}
