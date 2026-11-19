import type { SourceRow, Workspace } from "./types";

export function listSources(workspace: Workspace, capabilities: { eia: boolean; groq: boolean }): SourceRow[] {
  const hasPublic = workspace.snapshots.some((snapshot) => snapshot.mode === "PUBLIC");
  const hasSynthetic = workspace.snapshots.some((snapshot) => snapshot.mode === "SYNTHETIC");
  return [
    {
      id: "eia",
      name: "EIA API v2",
      use: "Hourly demand for one balancing authority",
      access: "Server API key. Regional aggregate, not asset health.",
      state: hasPublic ? "Snapshot on file" : capabilities.eia ? "Key on server" : "Key not set",
      href: "https://www.eia.gov/opendata/documentation.php",
    },
    {
      id: "nws",
      name: "NOAA NWS",
      use: "Weather context beside a demand series",
      access: "Public API. User-agent and rate rules.",
      state: "Later slice",
      href: "https://www.weather.gov/documentation/services-web-api",
    },
    {
      id: "nlr",
      name: "NLR solar data",
      use: "Resource potential as a scenario input",
      access: "API key and coverage limits.",
      state: "Later slice",
      href: "https://developer.nlr.gov/docs/solar/",
    },
    {
      id: "pjm",
      name: "PJM Data Miner 2",
      use: "Market load and prices",
      access: "Account. Redistribution is restricted.",
      state: "Held",
      href: "https://www.pjm.com/markets-and-operations/etools/data-miner-2/",
    },
    {
      id: "ercot",
      name: "ERCOT public API",
      use: "Texas public reports",
      access: "Registration. Separate from the EIA ERCOT series.",
      state: "Held",
      href: "https://www.ercot.com/services/mdt/data-portal",
    },
    {
      id: "ferc",
      name: "FERC and NERC",
      use: "Standards and assessment context for briefs",
      access: "Public reports. Not an operational feed.",
      state: "Citation library",
      href: "https://www.ferc.gov/industries-data/electric",
    },
    {
      id: "synthetic",
      name: "Synthetic case series",
      use: "Labeled research observations and the JSON importer",
      access: "Local. Must stay marked synthetic.",
      state: hasSynthetic ? "On file" : "Empty",
      href: "",
    },
    {
      id: "groq",
      name: "Groq",
      use: "Explain a stored run without inventing numbers",
      access: "Server key. Read-only payload.",
      state: capabilities.groq ? "Key on server" : "Local explanation",
      href: "https://console.groq.com/docs/structured-outputs",
    },
  ];
}
