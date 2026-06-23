import { supabase } from "../supabase";
import { getAuthUser } from "../middleware";

export async function handleGetPresignedUrl(req: Request): Promise<Response> {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role !== "ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const fileName = url.searchParams.get("fileName");
    const contentType = url.searchParams.get("contentType");

    if (!fileName || !contentType) {
      return Response.json(
        { error: "fileName and contentType are required" },
        { status: 400 }
      );
    }

    // Generate a unique file path
    const extension = fileName.split(".").pop();
    const uniqueFileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = `${uniqueFileName}`;

    // Create signed upload URL
    const { data, error } = await supabase.storage
      .from("items")
      .createSignedUploadUrl(filePath);

    if (error) {
      throw error;
    }

    // Also compute the public URL that it will be available at
    const { data: publicUrlData } = supabase.storage
      .from("items")
      .getPublicUrl(filePath);

    return Response.json({
      signedUrl: data.signedUrl,
      path: data.path,
      token: data.token, // Upload token if needed
      publicUrl: publicUrlData.publicUrl,
    });
  } catch (error) {
    console.error("Presigned URL error:", error);
    return Response.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}
