import { prisma } from "../db.server";
import type { Prisma } from "@prisma/client";

export async function handleGetItems(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const categoryId = url.searchParams.get("categoryId");
    const search = url.searchParams.get("search");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.ItemWhereInput = {};

    if (status) {
      where.status = status as Prisma.EnumItemStatusFilter["equals"];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: { category: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.item.count({ where }),
    ]);

    return Response.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GetItems error:", error);
    return Response.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

export async function handleGetItem(id: string): Promise<Response> {
  try {
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        category: true,
        borrowings: {
          orderBy: { borrowedAt: "desc" },
          take: 10,
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!item) {
      return Response.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    return Response.json({ item });
  } catch (error) {
    console.error("GetItem error:", error);
    return Response.json(
      { error: "Failed to fetch item" },
      { status: 500 }
    );
  }
}

export async function handleCreateItem(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { name, code, description, categoryId, photoUrl } = body as {
      name?: string;
      code?: string;
      description?: string;
      categoryId?: string;
      photoUrl?: string;
    };

    if (!name || !code || !categoryId) {
      return Response.json(
        { error: "Name, code, and categoryId are required" },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return Response.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check for duplicate code
    const existingItem = await prisma.item.findUnique({
      where: { code },
    });

    if (existingItem) {
      return Response.json(
        { error: "An item with this code already exists" },
        { status: 409 }
      );
    }

    const item = await prisma.item.create({
      data: {
        name,
        code,
        description: description || null,
        categoryId,
        photoUrl: photoUrl || null,
        qrCodeData: crypto.randomUUID(),
      },
      include: { category: true },
    });

    return Response.json(
      { message: "Item created successfully", item },
      { status: 201 }
    );
  } catch (error) {
    console.error("CreateItem error:", error);
    return Response.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}

export async function handleUpdateItem(
  id: string,
  req: Request
): Promise<Response> {
  try {
    const existing = await prisma.item.findUnique({ where: { id } });
    if (!existing) {
      return Response.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, code, description, categoryId, photoUrl, status } = body as {
      name?: string;
      code?: string;
      description?: string;
      categoryId?: string;
      photoUrl?: string;
      status?: string;
    };

    // If changing code, check for duplicates
    if (code && code !== existing.code) {
      const duplicate = await prisma.item.findUnique({ where: { code } });
      if (duplicate) {
        return Response.json(
          { error: "An item with this code already exists" },
          { status: 409 }
        );
      }
    }

    // If changing category, verify it exists
    if (categoryId && categoryId !== existing.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        return Response.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
    }

    const updateData: Prisma.ItemUpdateInput = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (categoryId !== undefined)
      updateData.category = { connect: { id: categoryId } };
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
    if (status !== undefined)
      updateData.status = status as Prisma.EnumItemStatusFieldUpdateOperationsInput["set"];

    const item = await prisma.item.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    return Response.json({ message: "Item updated successfully", item });
  } catch (error) {
    console.error("UpdateItem error:", error);
    return Response.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

export async function handleDeleteItem(id: string): Promise<Response> {
  try {
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return Response.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // Check for active borrowings
    const activeBorrowing = await prisma.borrowing.findFirst({
      where: {
        itemId: id,
        status: "DIPINJAM",
      },
    });

    if (activeBorrowing) {
      return Response.json(
        { error: "Cannot delete item with active borrowings" },
        { status: 409 }
      );
    }

    await prisma.item.delete({ where: { id } });

    return Response.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("DeleteItem error:", error);
    return Response.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
