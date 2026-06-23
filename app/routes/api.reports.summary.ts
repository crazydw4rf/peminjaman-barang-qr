import { handleGetSummary } from "../utils/api-handlers/reports";
import type { Route } from "./+types/api.reports.summary";

export async function loader() {
  return handleGetSummary();
}
