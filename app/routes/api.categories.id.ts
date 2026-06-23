import { handleUpdateCategory, handleDeleteCategory } from "../utils/api-handlers/categories";
import type { Route } from "./+types/api.categories.id";

export async function action({ request, params }: Route.ActionArgs) {
  if (request.method === "PUT") return handleUpdateCategory(params.id!, request);
  if (request.method === "DELETE") return handleDeleteCategory(params.id!);
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
