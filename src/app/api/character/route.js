import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const characterName = searchParams.get("characterName");

  if (!characterName) {
    return NextResponse.json({ error: "Character name is required" }, { status: 400 });
  }

  try {
    const baseUrl = `https://census.daybreakgames.com/s:${process.env.SERVICE_ID}/get/ps2:v2`;
    const endpoint = `${baseUrl}/character?name.first_lower=${characterName.toLowerCase()}&c:resolve=outfit,online_status,title_id&c:show=character_id,name,faction_id,battle_rank,certs,prestige_level,times,title_id`;

    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`Planetside 2 API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const character = data.character_list?.[0];

    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    // Explicitly return only the fields you want
    const filteredCharacter = {
      character_id: character.character_id,
      name: character.name,
      faction_id: character.faction_id,
      battle_rank: character.battle_rank,
      certs: character.certs,
      prestige_level: character.prestige_level,
      times: character.times,
      outfit: character.outfit, // Include only if outfit info is needed
      title_id: character.title_id,
      online_status: character.online_status,
    };

    return NextResponse.json(filteredCharacter);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
