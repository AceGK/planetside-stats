//api/character/friends/[characterId]/route.js

import { NextResponse } from "next/server";

const SERVICE_ID = process.env.SERVICE_ID;

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

const getFriendDetails = async (friendIds) => {
  const baseUrl = `https://census.daybreakgames.com/s:${SERVICE_ID}/get/ps2:v2`;
  const urls = friendIds.map(
    (id) =>
      `${baseUrl}/character?character_id=${id}&c:resolve=outfit&c:show=character_id,name.first,faction_id,battle_rank.value,prestige_level,outfit.alias,outfit.name`
  );

  try {
    const results = await fetchWithRateLimit(urls, 10);
    return results
      .map((result) => result.character_list?.[0])
      .filter(Boolean);
  } catch (error) {
    console.error("Error fetching friend details:", error);
    return [];
  }
};

const getCharacterFriends = async (characterId) => {
  const baseUrl = `https://census.daybreakgames.com/s:${SERVICE_ID}/get/ps2:v2`;
  const endpoint = `${baseUrl}/characters_friend?character_id=${characterId}`;

  const res = await fetch(endpoint);
  if (!res.ok) {
    throw new Error("Failed to fetch character friends");
  }

  const data = await res.json();
  const characterFriendData = data.characters_friend_list?.[0];
  const friendList = characterFriendData?.friend_list || [];

  const friendIds = friendList.map((friend) => friend.character_id);
  if (friendIds.length === 0) return [];

  const friendDetails = await getFriendDetails(friendIds);

  return friendList
    .map((friend) => {
      const friendDetail = friendDetails.find(
        (fd) => fd.character_id === friend.character_id
      );
      return {
        ...friend,
        name: friendDetail?.name?.first || "Unknown",
        faction_id: friendDetail?.faction_id || null,
        battle_rank: friendDetail?.battle_rank?.value || "N/A",
        prestige_level: friendDetail?.prestige_level || 0,
        outfit: friendDetail?.outfit || "n/a",
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
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
    const friends = await getCharacterFriends(characterId);
    return NextResponse.json(friends);
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "Failed to fetch character friends" },
      { status: 500 }
    );
  }
}
