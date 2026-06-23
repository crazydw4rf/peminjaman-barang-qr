import { handleRegister } from "../utils/api-handlers/auth";
import type { Route } from "./+types/api.auth.register";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
  return handleRegister(request);
}
