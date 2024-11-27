import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const characterName = searchParams.get("characterName");

  if (!characterName) {
    return NextResponse.json({ error: "Character name is required" }, { status: 400 });
  }

  try {
    // Base URL for Planetside 2 API
    const baseUrl = "https://census.daybreakgames.com/s:example/get/ps2:v2";

    // Endpoint for character data
    const endpoint = `${baseUrl}/character?name.first_lower=${characterName.toLowerCase()}&c:resolve=outfit,stat_history`;

    // Fetch data from Planetside 2 API
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`Planetside 2 API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Return the character data
    if (data.character_list && data.character_list.length > 0) {
      return NextResponse.json(data.character_list[0]);
    } else {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
