async function getOnlineStatus(characterIds) {
  const baseUrl = `https://census.daybreakgames.com/s:${process.env.SERVICE_ID}/get/ps2:v2`;
  const endpoint = `${baseUrl}/characters_online_status?character_id=${characterIds.join(",")}`;

  const res = await fetch(endpoint);

  if (!res.ok) {
    throw new Error("Failed to fetch online statuses");
  }

  const data = await res.json();
  const statusList = data.characters_online_status_list || [];
  return statusList.reduce((acc, status) => {
    acc[status.character_id] = status.online_status === "1"; // 1 = online, 0 = offline
    return acc;
  }, {});
}

export default getOnlineStatus;