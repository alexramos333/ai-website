import { createClient } from "@/lib/supabase/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Portfolio fetch error:", error.message);
    return createErrorResponse("Failed to fetch portfolio items.", 500);
  }

  return createSuccessResponse(data);
}
