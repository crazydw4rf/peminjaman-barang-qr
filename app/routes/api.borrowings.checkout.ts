import { handleCheckout } from "../utils/api-handlers/borrowings";
import { getAuthUser } from "../utils/middleware";
import type { Route } from "./+types/api.borrowings.checkout";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return handleCheckout(request, user.id);
}
