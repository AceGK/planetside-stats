import React from "react";
import factions from "@/utils/factions";

export default function FactionLogo ({ factionId }) {
  const faction = factions[factionId];

  if (!faction) {
    return <p>Faction not found</p>;
  }

  return (
    <div>
      <img
        src={faction.image} 
        alt={faction.name}
        aria-label={faction.name}
        title={faction.name}
        style={{ width: "100px", height: "100px" }}
      />
      <p>{faction.name}</p>
    </div>
  );
};