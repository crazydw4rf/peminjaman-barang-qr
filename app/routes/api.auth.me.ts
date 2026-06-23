import { handleGetMe } from "../utils/api-handlers/auth";
import type { Route } from "./+types/api.auth.me";

export async function loader({ request }: Route.LoaderArgs) {
  return handleGetMe(request);
}
