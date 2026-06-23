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
      console.error("Auth: No bearer token found in header:", authHeader);
      return null;
    }

    const token = authHeader.slice(7);
    if (!token) {
      console.error("Auth: Token is empty");
      return null;
    }

    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser(token);

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
