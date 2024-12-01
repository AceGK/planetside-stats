import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const characterName = searchParams.get("characterName");

  if (!characterName) {
    return NextResponse.json({ error: "Character name is required" }, { status: 400 });
  }

  try {
    // Base URL for the Census API
    const baseUrl = `https://census.daybreakgames.com/s:${process.env.SERVICE_ID}/get/ps2:v2`;

    // Fetch only 'character_id' and 'name'
    const endpoint = `${baseUrl}/character?name.first_lower=${characterName.toLowerCase()}&c:show=character_id,name`;

    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`Planetside 2 API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const character = data.character_list?.[0];

    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    // Return only the 'character_id' and 'name'
    return NextResponse.json({
      character_id: character.character_id,
      name: character.name,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
