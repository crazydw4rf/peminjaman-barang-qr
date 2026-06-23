import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";

export function createSupabaseServerClient(request: Request) {
  const headers = new Headers();

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get("Cookie") ?? "");
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            headers.append("Set-Cookie", serializeCookieHeader(name, value, options))
          );
        },
      },
    }
  );

  return { supabase, headers };
}

export async function requireUser(request: Request, requireAdmin = false) {
  const { supabase } = createSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  // To check admin, we need our Prisma user
  const { prisma } = await import("./db.server");
  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  
  if (!dbUser) {
    throw new Response("User not found", { status: 401 });
  }

  if (requireAdmin && dbUser.role !== "ADMIN") {
    throw new Response("Forbidden", { status: 403 });
  }

  return { supabaseUser: user, dbUser };
}
