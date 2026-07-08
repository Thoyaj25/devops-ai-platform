import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { permissions } from "@/lib/auth/permissions";
import { auditService } from "@/services/audit/auditService";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!permissions.canDeleteResource(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const logs = await auditService.getLogs();
    return NextResponse.json(logs);
  } catch (error) {
    logger.error({ error }, "Failed to fetch audit logs");
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}