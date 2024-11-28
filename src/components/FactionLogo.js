import React from "react";
import factions from "@/utils/factions";

const FactionLogo = ({ factionId }) => {
  const faction = factions[factionId];

  if (!faction) {
    return <p>Faction not found</p>;
  }

  return (
    <div style={{ textAlign: "center" }}>
      <img
        src={faction.image} // Path to the SVG file
        alt={faction.name} // Accessible name for the image
        aria-label={faction.name}
        title={faction.name}
        style={{ width: "100px", height: "100px" }} // Style the image
      />
      <p>{faction.name}</p>
    </div>
  );
};

export default FactionLogo;
