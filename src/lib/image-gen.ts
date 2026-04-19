// Server-side only — AI blog image generation via fal.ai FLUX.2 Pro.
// Generates a hero image, resizes to 1200x630 WebP, and uploads to Supabase Storage.
// Uses dynamic imports so that if sharp or fal.ai fail to load, article generation
// continues without an image instead of crashing the entire route.

import { createAdminClient } from "@/lib/supabase/admin";

const STORAGE_BUCKET = "images";
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;
const WEBP_QUALITY = 80;

interface FalImageResult {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  seed: number;
}

/**
 * Generate a blog hero image using FLUX.2 Pro, resize to 1200x630 WebP,
 * and upload to Supabase Storage.
 *
 * Returns the public URL on success, or empty string on failure.
 * Never throws — article generation should continue even if image fails.
 */
export async function generateBlogImage(
  imagePrompt: string,
  slug: string,
): Promise<string> {
  const falKey = process.env.FAL_KEY;
  if (!falKey) {
    console.error("[IMAGE GEN] FAL_KEY not configured, skipping image generation.");
    return "";
  }

  console.log(`[IMAGE GEN] Starting for slug="${slug}" | prompt=${imagePrompt.length} chars | FAL_KEY=${falKey.length} chars`);
  const startTime = Date.now();

  // Step 1: Dynamic imports
  let fal: Awaited<typeof import("@fal-ai/client")>["fal"];
  // Dynamic import types — sharp uses `export =` so needs runtime .default fallback
  type SharpFn = (input: Buffer) => import("sharp").Sharp;
  let sharpFn: SharpFn;

  try {
    const falModule = await import("@fal-ai/client");
    fal = falModule.fal;
    console.log("[IMAGE GEN] Step 1/5: @fal-ai/client loaded OK");
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    console.error(`[IMAGE GEN] Step 1/5 FAILED: Could not load @fal-ai/client: ${msg}`);
    return "";
  }

  try {
    const sharpModule = await import("sharp");
    // With `export = sharp`, the runtime shape depends on the bundler:
    // CJS: module is the function directly. ESM wrapper: function is on .default.
    const fn = typeof sharpModule === "function" ? sharpModule : sharpModule.default;
    sharpFn = fn as unknown as SharpFn;
    console.log("[IMAGE GEN] Step 1/5: sharp loaded OK");
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    console.error(`[IMAGE GEN] Step 1/5 FAILED: Could not load sharp: ${msg}`);
    return "";
  }

  fal.config({ credentials: falKey });

  // Step 2: Generate image via fal.ai
  let imageUrl: string;
  try {
    console.log("[IMAGE GEN] Step 2/5: Calling fal.ai FLUX.2 Pro...");
    const result = await fal.subscribe("fal-ai/flux-2-pro", {
      input: {
        prompt: imagePrompt,
        image_size: "landscape_16_9" as const,
        output_format: "jpeg",
        safety_tolerance: "2",
      },
    }) as { data: FalImageResult; requestId: string };

    console.log(`[IMAGE GEN] Step 2/5: fal.ai responded | requestId=${result.requestId} | images=${result.data?.images?.length ?? 0} | elapsed=${Date.now() - startTime}ms`);

    imageUrl = result.data?.images?.[0]?.url ?? "";
    if (!imageUrl) {
      console.error(`[IMAGE GEN] Step 2/5 FAILED: No image URL in response. Full response keys: ${JSON.stringify(Object.keys(result))} | data keys: ${JSON.stringify(Object.keys(result.data || {}))}`);
      return "";
    }
    console.log(`[IMAGE GEN] Step 2/5: Image URL received (${imageUrl.length} chars)`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    const stack = error instanceof Error ? error.stack?.split("\n").slice(0, 3).join(" | ") : "";
    console.error(`[IMAGE GEN] Step 2/5 FAILED: fal.ai error: ${msg} | ${stack}`);
    return "";
  }

  // Step 3: Download the generated image
  let rawBuffer: Buffer;
  try {
    console.log("[IMAGE GEN] Step 3/5: Downloading generated image...");
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`[IMAGE GEN] Step 3/5 FAILED: Download HTTP ${response.status} ${response.statusText}`);
      return "";
    }
    rawBuffer = Buffer.from(await response.arrayBuffer());
    console.log(`[IMAGE GEN] Step 3/5: Downloaded ${(rawBuffer.length / 1024).toFixed(1)} KB`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    console.error(`[IMAGE GEN] Step 3/5 FAILED: Download error: ${msg}`);
    return "";
  }

  // Step 4: Resize to 1200x630 and convert to WebP
  let webpBuffer: Buffer;
  try {
    console.log("[IMAGE GEN] Step 4/5: Resizing with sharp...");
    webpBuffer = await sharpFn(rawBuffer)
      .resize(IMAGE_WIDTH, IMAGE_HEIGHT, {
        fit: "cover",
        position: "centre",
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    console.log(`[IMAGE GEN] Step 4/5: Resized to ${IMAGE_WIDTH}x${IMAGE_HEIGHT} WebP (${(webpBuffer.length / 1024).toFixed(1)} KB)`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    console.error(`[IMAGE GEN] Step 4/5 FAILED: Sharp resize error: ${msg}`);
    return "";
  }

  // Step 5: Upload to Supabase Storage
  try {
    console.log("[IMAGE GEN] Step 5/5: Uploading to Supabase Storage...");
    const supabase = createAdminClient();
    const filePath = `blog-images/${slug}.webp`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, webpBuffer, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true,
      });

    if (uploadError) {
      console.error(`[IMAGE GEN] Step 5/5 FAILED: Upload error: ${uploadError.message}`);
      return "";
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    const totalTime = Date.now() - startTime;
    console.log(`[IMAGE GEN] SUCCESS: ${publicUrl} | total=${totalTime}ms`);

    return publicUrl;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    console.error(`[IMAGE GEN] Step 5/5 FAILED: Storage error: ${msg}`);
    return "";
  }
}
