import { createHash } from "crypto";
import { ApiError } from "./http";
import { EIA_RESPONDENTS } from "./respondents";
import type { Observation } from "./types";

type EiaRow = {
  period?: string;
  value?: number | string | null;
  "respondent-name"?: string;
  "value-units"?: string;
};

export async function pullEiaDemand(respondent: string): Promise<{ region: string; rows: Observation[]; hash: string }> {
  const apiKey = process.env.EIA_API_KEY;
  if (!apiKey) throw new ApiError(400, "Set EIA_API_KEY on the server before pulling public demand.");
  if (!EIA_RESPONDENTS.some(([code]) => code === respondent)) {
    throw new ApiError(400, "Choose a listed EIA respondent.");
  }

  const url = new URL("https://api.eia.gov/v2/electricity/rto/region-data/data/");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("frequency", "hourly");
  url.searchParams.append("data[]", "value");
  url.searchParams.append("facets[respondent][]", respondent);
  url.searchParams.append("facets[type][]", "D");
  url.searchParams.set("sort[0][column]", "period");
  url.searchParams.set("sort[0][direction]", "desc");
  url.searchParams.set("length", "240");

  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json()) as {
    error?: string;
    response?: { data?: EiaRow[] };
  };
  if (!response.ok) {
    throw new ApiError(502, payload.error || "EIA did not return the requested series.");
  }
  const data = payload.response?.data ?? [];
  const named = EIA_RESPONDENTS.find(([code]) => code === respondent)?.[1] ?? respondent;
  const region = data.find((row) => row["respondent-name"])?.["respondent-name"] || named;
  const source = `EIA-${respondent}-${Date.now().toString(36)}`;
  const rows = data
    .map((row) => {
      const load = typeof row.value === "number" ? row.value : Number(row.value);
      const period = row.period ?? "";
      const time = period.length === 13 ? `${period}:00:00.000Z` : "";
      return { period, time, load };
    })
    .filter((row) => row.time && Number.isFinite(row.load) && row.load >= 0)
    .sort((a, b) => a.time.localeCompare(b.time))
    .map((row) => ({
      region,
      time: row.time,
      load: row.load,
      capacity: null,
      source,
      licensingClass: "public-api-key" as const,
      spatialResolution: "balancing-authority" as const,
    }));

  if (rows.length < 48) throw new ApiError(502, "EIA returned too few hourly demand rows to file.");
  const hash = createHash("sha256")
    .update(JSON.stringify(rows.map((row) => [row.time, row.load])))
    .digest("hex")
    .slice(0, 16);
  return { region, rows, hash };
}
