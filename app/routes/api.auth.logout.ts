import type { Route } from "./+types/api.auth.logout";

export async function action({ request }: Route.ActionArgs) {
  return Response.json({ success: true });
}
