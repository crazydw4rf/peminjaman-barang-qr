import { handleCheckin } from "../utils/api-handlers/borrowings";
import { getAuthUser } from "../utils/middleware";
import type { Route } from "./+types/api.borrowings.checkin";

export async function action({ request, params }: Route.ActionArgs) {
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return handleCheckin(params.id!, request, user.id);
}
