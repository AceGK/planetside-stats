import React from "react";
import factions from "@/utils/factions";

export default function FactionLogo({ factionId, className }) {
  const faction = factions[factionId];

  if (!faction) {
    return <p>Faction not found</p>;
  }

  return (
    <img
      src={faction.image}
      alt={faction.name}
      aria-label={faction.name}
      title={faction.name}
      className={className}
    />
  );
}
