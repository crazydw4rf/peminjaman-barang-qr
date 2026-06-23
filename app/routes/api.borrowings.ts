import { handleGetBorrowings } from "../utils/api-handlers/borrowings";
import { getAuthUser } from "../utils/middleware";
import type { Route } from "./+types/api.borrowings";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return handleGetBorrowings(request, user.id, user.role);
}
