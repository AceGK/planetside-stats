import { NextResponse } from "next/server";

const SERVICE_ID = process.env.SERVICE_ID;

export async function GET(req, context) {
  // Await the `params` property dynamically
  const params = await context.params;
  const titleId = params?.titleId;

  if (!titleId) {
    return NextResponse.json({ error: "Title ID is required" }, { status: 400 });
  }

  try {
    const baseUrl = `https://census.daybreakgames.com/s:${SERVICE_ID}/get/ps2:v2`;
    const endpoint = `${baseUrl}/title?title_id=${titleId}`;

    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`Failed to fetch title data: ${response.statusText}`);
    }

    const data = await response.json();
    const titleName = data.title_list?.[0]?.name?.en || null;

    return NextResponse.json({ titleName });
  } catch (error) {
    console.error("Error fetching title data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
