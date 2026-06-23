import { supabase } from "../supabase";
import { prisma } from "../db.server";
import { getAuthUser } from "../middleware";

export async function handleRegister(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { email, name, password } = body as {
      email?: string;
      name?: string;
      password?: string;
    };

    if (!email || !name || !password) {
      return Response.json(
        { error: "Email, name, and password are required" },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      return Response.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // Create matching user in Prisma database
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        email,
        name,
      },
    });

    return Response.json(
      {
        message: "User registered successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return Response.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}

export async function handleLogin(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { email, password } = body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 401 }
      );
    }

    // Get user info from Prisma for role
    const dbUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!dbUser) {
      return Response.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    return Response.json({
      message: "Login successful",
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
      },
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      { error: "Failed to login" },
      { status: 500 }
    );
  }
}

export async function handleGetMe(req: Request): Promise<Response> {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return Response.json({ user });
  } catch (error) {
    console.error("GetMe error:", error);
    return Response.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}
