import { handleGetCategories, handleCreateCategory } from "../utils/api-handlers/categories";
import type { Route } from "./+types/api.categories";

export async function loader({ request }: Route.LoaderArgs) {
  return handleGetCategories();
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method === "POST") return handleCreateCategory(request);
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
