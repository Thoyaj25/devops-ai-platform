import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { logger } from "@/lib/logger";

import { dashboardService } from "@/services/dashboard/dashboardService";

/**
 * Step 1 — Inspect the routes
 * GET /api/dashboard/overview: Fetches overview dashboard data.
 */

/**
 * Step 2 — Standardize GET /api/dashboard/overview
 * Implements authentication. Data is global (Admin Dashboard).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Option 1: Admin Dashboard — Fetch global data without user ID scope
    const data = await dashboardService.getOverview();

    return NextResponse.json(data);
  } catch (error) {
    logger.error(
      { error },
      "Dashboard overview failed"
    );

    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}