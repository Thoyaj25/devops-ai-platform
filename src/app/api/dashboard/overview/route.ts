import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { logger } from "@/lib/logger";

import { dashboardService } from "@/services/dashboard/dashboardService";

/**
 * Step 1 — Inspect the routes
 * GET /api/dashboard: Fetches overview dashboard data for the authenticated user.
 */

/**
 * Step 2 — Standardize GET /api/dashboard
 * Implements authentication and data isolation by user ID.
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

    /**
     * Step 5 — Verify you don't trust client identity
     * Always derive userId from the authenticated server session,
     * never from the request body or parameters.
     */
    const data = await dashboardService.getOverview(session.user.id);

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