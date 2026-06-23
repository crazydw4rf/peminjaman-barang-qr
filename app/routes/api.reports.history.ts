import { handleGetHistory } from "../utils/api-handlers/reports";
import type { Route } from "./+types/api.reports.history";

export async function loader({ request }: Route.LoaderArgs) {
  return handleGetHistory(request);
}
