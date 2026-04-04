import { createSuccessResponse } from "@/lib/utils/api";
import { checkEnv } from "../../../../scripts/check-env";

export function GET() {
  checkEnv();
  return createSuccessResponse(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    200,
    { "Cache-Control": "no-store" },
  );
}
