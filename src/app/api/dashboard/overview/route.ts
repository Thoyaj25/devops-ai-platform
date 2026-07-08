import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

import { dashboardService } from "@/services/dashboard/dashboardService";

export async function GET() {
  try {
    const data = await dashboardService.getOverview();

    return NextResponse.json(data);
  } catch (error) {
    logger.error(
      { error },
      "Dashboard overview failed"
    );

    return NextResponse.json(
      {
        error: "Failed to load dashboard data",
      },
      {
        status: 500,
      }
    );
  }
}