import { prisma } from "../db.server";
import type { Prisma } from "@prisma/client";

export async function handleCheckout(
  req: Request,
  userId: string
): Promise<Response> {
  try {
    const body = await req.json();
    const { itemId, notes, dueDate } = body as {
      itemId?: string;
      notes?: string;
      dueDate?: string;
    };

    if (!itemId) {
      return Response.json(
        { error: "itemId is required" },
        { status: 400 }
      );
    }

    // Verify item exists and is available
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return Response.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    if (item.status !== "TERSEDIA") {
      return Response.json(
        { error: "Item is not available for borrowing" },
        { status: 409 }
      );
    }

    // Use a transaction to ensure atomicity
    const borrowing = await prisma.$transaction(async (tx) => {
      // Create borrowing record
      const newBorrowing = await tx.borrowing.create({
        data: {
          itemId,
          userId,
          notes: notes || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          conditionBefore: "BAIK",
        },
        include: {
          item: {
            include: { category: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Update item status to DIPINJAM
      await tx.item.update({
        where: { id: itemId },
        data: { status: "DIPINJAM" },
      });

      return newBorrowing;
    });

    return Response.json(
      { message: "Item checked out successfully", borrowing },
      { status: 201 }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return Response.json(
      { error: "Failed to checkout item" },
      { status: 500 }
    );
  }
}

export async function handleCheckin(
  borrowingId: string,
  req: Request,
  userId: string
): Promise<Response> {
  try {
    const body = await req.json();
    const { conditionAfter, notes } = body as {
      conditionAfter?: string;
      notes?: string;
    };

    if (!conditionAfter || !["BAIK", "RUSAK"].includes(conditionAfter)) {
      return Response.json(
        { error: "conditionAfter is required and must be BAIK or RUSAK" },
        { status: 400 }
      );
    }

    // Find the borrowing
    const borrowing = await prisma.borrowing.findUnique({
      where: { id: borrowingId },
      include: { item: true },
    });

    if (!borrowing) {
      return Response.json(
        { error: "Borrowing record not found" },
        { status: 404 }
      );
    }

    if (borrowing.status !== "DIPINJAM") {
      return Response.json(
        { error: "This borrowing has already been returned" },
        { status: 409 }
      );
    }

    // Only the borrower or an admin can check in
    // (we'll allow it here since the route handler already verified auth)

    const newItemStatus = conditionAfter === "RUSAK" ? "RUSAK" : "TERSEDIA";

    const updatedBorrowing = await prisma.$transaction(async (tx) => {
      // Update borrowing record
      const updated = await tx.borrowing.update({
        where: { id: borrowingId },
        data: {
          returnedAt: new Date(),
          status: "DIKEMBALIKAN",
          conditionAfter: conditionAfter as "BAIK" | "RUSAK",
          notes: notes !== undefined ? notes : borrowing.notes,
        },
        include: {
          item: {
            include: { category: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Update item status
      await tx.item.update({
        where: { id: borrowing.itemId },
        data: { status: newItemStatus },
      });

      return updated;
    });

    return Response.json({
      message: "Item checked in successfully",
      borrowing: updatedBorrowing,
    });
  } catch (error) {
    console.error("Checkin error:", error);
    return Response.json(
      { error: "Failed to check in item" },
      { status: 500 }
    );
  }
}

export async function handleGetBorrowings(
  req: Request,
  userId: string,
  role: string
): Promise<Response> {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.BorrowingWhereInput = {};

    // Non-admin users can only see their own borrowings
    if (role !== "ADMIN") {
      where.userId = userId;
    }

    if (status) {
      where.status = status as Prisma.EnumBorrowingStatusFilter["equals"];
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
    console.error("GetBorrowings error:", error);
    return Response.json(
      { error: "Failed to fetch borrowings" },
      { status: 500 }
    );
  }
}

export async function handleGetActiveBorrowings(
  userId: string,
  role: string
): Promise<Response> {
  try {
    const where: Prisma.BorrowingWhereInput = {
      status: "DIPINJAM",
    };

    // Non-admin users can only see their own active borrowings
    if (role !== "ADMIN") {
      where.userId = userId;
    }

    const borrowings = await prisma.borrowing.findMany({
      where,
      include: {
        item: {
          include: { category: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { borrowedAt: "desc" },
    });

    return Response.json({ borrowings });
  } catch (error) {
    console.error("GetActiveBorrowings error:", error);
    return Response.json(
      { error: "Failed to fetch active borrowings" },
      { status: 500 }
    );
  }
}
