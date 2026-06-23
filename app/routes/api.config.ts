import type { Route } from "./+types/api.config";

export async function loader({ request }: Route.LoaderArgs) {
  return Response.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
  });
}
