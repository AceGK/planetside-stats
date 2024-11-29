import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const outfitName = searchParams.get("outfitName")?.toLowerCase();

  if (!outfitName) {
    return NextResponse.json(
      { error: "Missing outfitName query parameter" },
      { status: 400 }
    );
  }

  const apiUrl = `https://census.daybreakgames.com/s:${process.env.SERVICE_ID}/get/ps2:v2/outfit?name_lower=${outfitName}&c:resolve=member_character`;

  try {
    const res = await fetch(apiUrl);
    if (!res.ok) {
      throw new Error("Failed to fetch outfit data");
    }

    const data = await res.json();
    const outfit = data.outfit_list?.[0] || null;

    if (!outfit) {
      return NextResponse.json(
        { error: "Outfit not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(outfit);
  } catch (error) {
    return NextResponse.json(
      { error: "An error occurred while fetching outfit data" },
      { status: 500 }
    );
  }
}