import { prisma } from "../db.server";
import type { Prisma } from "@prisma/client";

export async function handleGetSummary(): Promise<Response> {
  try {
    const [
      totalItems,
      availableItems,
      borrowedItems,
      damagedItems,
      totalBorrowings,
      activeBorrowings,
    ] = await Promise.all([
      prisma.item.count(),
      prisma.item.count({ where: { status: "TERSEDIA" } }),
      prisma.item.count({ where: { status: "DIPINJAM" } }),
      prisma.item.count({ where: { status: "RUSAK" } }),
      prisma.borrowing.count(),
      prisma.borrowing.count({ where: { status: "DIPINJAM" } }),
    ]);

    return Response.json({
      summary: {
        totalItems,
        availableItems,
        borrowedItems,
        damagedItems,
        totalBorrowings,
        activeBorrowings,
      },
    });
  } catch (error) {
    console.error("GetSummary error:", error);
    return Response.json(
      { error: "Failed to fetch summary" },
      { status: 500 }
    );
  }
}

export async function handleGetHistory(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.BorrowingWhereInput = {};

    if (from || to) {
      where.borrowedAt = {};
      if (from) {
        where.borrowedAt.gte = new Date(from);
      }
      if (to) {
        where.borrowedAt.lte = new Date(to);
      }
    }

    const [borrowings, total] = await Promise.all([
      prisma.borrowing.findMany({
        where,
        include: {
          item: {
            include: { category: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        skip,
        take: limit,
        orderBy: { borrowedAt: "desc" },
      }),
      prisma.borrowing.count({ where }),
    ]);

    return Response.json({
      borrowings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GetHistory error:", error);
    return Response.json(
      { error: "Failed to fetch borrowing history" },
      { status: 500 }
    );
  }
}
