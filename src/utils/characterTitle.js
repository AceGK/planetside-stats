export async function characterTitle(titleId) {
  if (!titleId) return null;

  const baseUrl = `https://census.daybreakgames.com/s:${process.env.SERVICE_ID}/get/ps2:v2`;
  const endpoint = `${baseUrl}/title?title_id=${titleId}`;

  const res = await fetch(endpoint);

  if (!res.ok) {
    throw new Error("Failed to fetch title data");
  }

  const data = await res.json();
  const title = data.title_list?.[0]?.name?.en;
  return title || null;
}
