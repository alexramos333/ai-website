// Server-side only — AI blog image generation via fal.ai FLUX.2 Pro.
// Generates a hero image, resizes to 1200x630 WebP, uploads to Supabase Storage.

import { fal } from "@fal-ai/client";
import sharp from "sharp";
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
    console.warn("[IMAGE GEN] FAL_KEY not configured, skipping image generation.");
    return "";
  }

  fal.config({ credentials: falKey });

  try {
    console.log(`[IMAGE GEN] Generating image for slug="${slug}"...`);
    const startTime = Date.now();

    // 1. Generate image via FLUX.2 Pro
    const result = await fal.subscribe("fal-ai/flux-2-pro", {
      input: {
        prompt: imagePrompt,
        image_size: "landscape_16_9" as const,
        output_format: "jpeg",
        safety_tolerance: "2",
      },
    }) as { data: FalImageResult };

    const imageUrl = result.data.images[0]?.url;
    if (!imageUrl) {
      console.warn("[IMAGE GEN] No image URL returned from fal.ai.");
      return "";
    }

    console.log(`[IMAGE GEN] Image generated in ${Date.now() - startTime}ms. Processing...`);

    // 2. Download the generated image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn(`[IMAGE GEN] Failed to download image: HTTP ${response.status}`);
      return "";
    }
    const rawBuffer = Buffer.from(await response.arrayBuffer());

    // 3. Resize to 1200x630 and convert to WebP
    const webpBuffer = await sharp(rawBuffer)
      .resize(IMAGE_WIDTH, IMAGE_HEIGHT, {
        fit: "cover",
        position: "centre",
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    const fileSizeKb = (webpBuffer.length / 1024).toFixed(1);
    console.log(`[IMAGE GEN] Processed to ${IMAGE_WIDTH}x${IMAGE_HEIGHT} WebP (${fileSizeKb} KB).`);

    // 4. Upload to Supabase Storage
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
      console.error(`[IMAGE GEN] Upload failed: ${uploadError.message}`);
      return "";
    }

    // 5. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    const totalTime = Date.now() - startTime;
    console.log(`[IMAGE GEN] Complete: ${publicUrl} (${totalTime}ms)`);

    return publicUrl;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[IMAGE GEN] Failed for slug="${slug}": ${msg}`);
    return "";
  }
}
