import { createClient } from "@supabase/supabase-js";
import { prisma } from "../app/utils/db.server";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const users = [
    { email: "admin@example.com", password: "password123", name: "Administrator", role: "ADMIN" },
    { email: "user@example.com", password: "password123", name: "Normal User", role: "USER" },
  ];

  for (const u of users) {
    // 1. Try to create in Supabase
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { name: u.name },
    });

    let userId = "";
    if (authError) {
      if (authError.message.includes("already registered")) {
        console.log(`User ${u.email} already exists in Supabase. Fetching...`);
        // List users to find the ID
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existing = listData.users.find(x => x.email === u.email);
        if (existing) {
          userId = existing.id;
          // Update password just in case
          await supabase.auth.admin.updateUserById(userId, { password: u.password });
        }
      } else {
        console.error(`Supabase error for ${u.email}:`, authError);
        continue;
      }
    } else {
      userId = authData.user.id;
      console.log(`Created ${u.email} in Supabase with ID ${userId}`);
    }

    if (!userId) continue;

    // 2. Upsert in Prisma with the exact same ID
    await prisma.user.upsert({
      where: { email: u.email },
      update: { id: userId, role: u.role as any },
      create: {
        id: userId,
        email: u.email,
        name: u.name,
        role: u.role as any,
      },
    });
    console.log(`Upserted ${u.email} in Prisma database with matching ID.`);
  }
}

main().catch(console.error).finally(() => process.exit(0));
