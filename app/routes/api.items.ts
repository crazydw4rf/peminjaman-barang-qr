import { handleGetItems, handleCreateItem } from "../utils/api-handlers/items";
import type { Route } from "./+types/api.items";

export async function loader({ request }: Route.LoaderArgs) {
  return handleGetItems(request);
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method === "POST") return handleCreateItem(request);
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
