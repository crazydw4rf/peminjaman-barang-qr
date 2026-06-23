import { prisma } from "./db.server";
import { createSSRClient } from "./supabase.server";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export async function getAuthUser(req: Request): Promise<AuthUser | null> {
  try {
    const { supabase } = createSSRClient(req);

    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !supabaseUser?.email) {
      console.error("Auth: Supabase getUser failed:", error);
      return null;
    }

    // Look up the user in Prisma to get their role
    const dbUser = await prisma.user.findUnique({
      where: { email: supabaseUser.email },
    });

    if (!dbUser) {
      console.error("Auth: User not found in Prisma DB for email:", supabaseUser.email);
      return null;
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
    };
  } catch (error) {
    console.error("Auth middleware error:", error);
    return null;
  }
}
