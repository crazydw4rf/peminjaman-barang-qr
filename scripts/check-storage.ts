import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error("Error listing buckets:", error);
    return;
  }
  console.log("Buckets:", data.map(b => b.name));

  if (!data.find(b => b.name === "items")) {
    console.log("Creating 'items' bucket...");
    const { data: createData, error: createError } = await supabase.storage.createBucket("items", {
      public: true,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
    if (createError) {
      console.error("Error creating bucket:", createError);
    } else {
      console.log("Bucket created:", createData);
    }
  } else {
    console.log("Bucket 'items' already exists. Making sure it is public...");
    await supabase.storage.updateBucket("items", { public: true });
  }
}

main();
