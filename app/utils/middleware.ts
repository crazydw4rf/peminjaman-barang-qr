import { supabase } from "./supabase";
import { prisma } from "./db.server";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export async function getAuthUser(req: Request): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.slice(7);
    if (!token) {
      return null;
    }

    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !supabaseUser?.email) {
      return null;
    }

    // Look up the user in Prisma to get their role
    const dbUser = await prisma.user.findUnique({
      where: { email: supabaseUser.email },
    });

    if (!dbUser) {
      return null;
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
    };
  } catch {
    return null;
  }
}
