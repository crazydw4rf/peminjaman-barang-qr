import { prisma } from "../app/utils/db.server";

async function main() {
  console.log("🌱 Seeding database...");

  // Create default categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: "Elektronik" },
      update: {},
      create: {
        name: "Elektronik",
        description: "Perangkat elektronik seperti laptop, proyektor, kamera",
      },
    }),
    prisma.category.upsert({
      where: { name: "Alat Tulis" },
      update: {},
      create: {
        name: "Alat Tulis",
        description: "Alat tulis kantor dan perlengkapan menulis",
      },
    }),
    prisma.category.upsert({
      where: { name: "Peralatan Lab" },
      update: {},
      create: {
        name: "Peralatan Lab",
        description: "Peralatan laboratorium dan alat ukur",
      },
    }),
    prisma.category.upsert({
      where: { name: "Furniture" },
      update: {},
      create: {
        name: "Furniture",
        description: "Meja, kursi, dan perlengkapan ruangan",
      },
    }),
    prisma.category.upsert({
      where: { name: "Alat Olahraga" },
      update: {},
      create: {
        name: "Alat Olahraga",
        description: "Peralatan olahraga dan kebugaran",
      },
    }),
    prisma.category.upsert({
      where: { name: "Lainnya" },
      update: {},
      create: {
        name: "Lainnya",
        description: "Barang-barang lain yang tidak termasuk kategori di atas",
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create admin user (will need to register through Supabase Auth first)
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@example.com",
      name: "Administrator",
      role: "ADMIN",
    },
  });

  console.log(`✅ Admin user created: ${adminUser.email}`);

  // Create normal user (will need to register through Supabase Auth first)
  const normalUser = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: { role: "USER" },
    create: {
      email: "user@example.com",
      name: "Normal User",
      role: "USER",
    },
  });

  console.log(`✅ Normal user created: ${normalUser.email}`);

  // Create some sample items
  const items = await Promise.all([
    prisma.item.upsert({
      where: { code: "ELK-001" },
      update: { photoUrl: "https://picsum.photos/seed/laptop/400/300" },
      create: {
        name: "Laptop ASUS VivoBook",
        code: "ELK-001",
        description: "Laptop ASUS VivoBook 14 inch, RAM 8GB, SSD 256GB",
        photoUrl: "https://picsum.photos/seed/laptop/400/300",
        categoryId: categories[0]!.id,
        status: "TERSEDIA",
      },
    }),
    prisma.item.upsert({
      where: { code: "ELK-002" },
      update: { photoUrl: "https://picsum.photos/seed/projector/400/300" },
      create: {
        name: "Proyektor Epson",
        code: "ELK-002",
        description: "Proyektor Epson EB-X51, 3800 lumens",
        photoUrl: "https://picsum.photos/seed/projector/400/300",
        categoryId: categories[0]!.id,
        status: "TERSEDIA",
      },
    }),
    prisma.item.upsert({
      where: { code: "LAB-001" },
      update: { photoUrl: "https://picsum.photos/seed/multimeter/400/300" },
      create: {
        name: "Multimeter Digital",
        code: "LAB-001",
        description: "Multimeter digital untuk pengukuran listrik",
        photoUrl: "https://picsum.photos/seed/multimeter/400/300",
        categoryId: categories[2]!.id,
        status: "TERSEDIA",
      },
    }),
    prisma.item.upsert({
      where: { code: "OLR-001" },
      update: { photoUrl: "https://picsum.photos/seed/basketball/400/300" },
      create: {
        name: "Bola Basket Molten",
        code: "OLR-001",
        description: "Bola basket Molten GG7X official size",
        photoUrl: "https://picsum.photos/seed/basketball/400/300",
        categoryId: categories[4]!.id,
        status: "TERSEDIA",
      },
    }),
  ]);

  console.log(`✅ Created ${items.length} sample items`);
  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
