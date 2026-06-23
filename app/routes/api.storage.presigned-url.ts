import type { Route } from "./+types/api.storage.presigned-url";
import { handleGetPresignedUrl } from "../utils/api-handlers/storage";

export async function loader({ request }: Route.LoaderArgs) {
  return handleGetPresignedUrl(request);
}
