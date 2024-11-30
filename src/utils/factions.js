const faction = {
  1: {
    name: "Vanu Sovereignty",
    image: "/factions/vanu-sovereignty.svg",
    color: "#9139d0",
  },
  2: {
    name: "New Conglomerate",
    image: "/factions/new-conglomerate.svg",
    color: "#007dc3",
  },
  3: {
    name: "Terran Republic",
    image: "/factions/terran-republic.svg",
    color: "#e61f23",
  },
  4: {
    name: "NS Operatives",
    image: "/factions/ns-operatives.svg",
    color: "#b7b7b7",
  },
};

export const getFactionColor = (factionId) => faction[factionId]?.color || "var(--clr-default)";

export const FactionColoredName = ({ name, factionId, className = "" }) => (
  <span
    style={{ color: getFactionColor(factionId), fontWeight: "bold" }}
    className={className}
  >
    {name}
  </span>
);

export default faction;