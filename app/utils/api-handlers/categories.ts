import { prisma } from "../db.server";

export async function handleGetCategories(): Promise<Response> {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return Response.json({ categories });
  } catch (error) {
    console.error("GetCategories error:", error);
    return Response.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function handleCreateCategory(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { name, description } = body as {
      name?: string;
      description?: string;
    };

    if (!name) {
      return Response.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await prisma.category.findUnique({
      where: { name },
    });

    if (existing) {
      return Response.json(
        { error: "A category with this name already exists" },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        description: description || null,
      },
    });

    return Response.json(
      { message: "Category created successfully", category },
      { status: 201 }
    );
  } catch (error) {
    console.error("CreateCategory error:", error);
    return Response.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

export async function handleUpdateCategory(
  id: string,
  req: Request
): Promise<Response> {
  try {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return Response.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, description } = body as {
      name?: string;
      description?: string;
    };

    // If changing name, check for duplicates
    if (name && name !== existing.name) {
      const duplicate = await prisma.category.findUnique({
        where: { name },
      });
      if (duplicate) {
        return Response.json(
          { error: "A category with this name already exists" },
          { status: 409 }
        );
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      },
    });

    return Response.json({
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("UpdateCategory error:", error);
    return Response.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function handleDeleteCategory(id: string): Promise<Response> {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { items: true } } },
    });

    if (!category) {
      return Response.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    if (category._count.items > 0) {
      return Response.json(
        {
          error: `Cannot delete category with ${category._count.items} item(s). Remove or reassign items first.`,
        },
        { status: 409 }
      );
    }

    await prisma.category.delete({ where: { id } });

    return Response.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("DeleteCategory error:", error);
    return Response.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
