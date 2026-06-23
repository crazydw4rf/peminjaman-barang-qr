import { handleGetItem, handleUpdateItem, handleDeleteItem } from "../utils/api-handlers/items";
import type { Route } from "./+types/api.items.id";

export async function loader({ params }: Route.LoaderArgs) {
  return handleGetItem(params.id!);
}

export async function action({ request, params }: Route.ActionArgs) {
  if (request.method === "PUT") return handleUpdateItem(params.id!, request);
  if (request.method === "DELETE") return handleDeleteItem(params.id!);
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
