import { NextRequest, NextResponse } from "next/server";
import { rollbackService } from "@/services/deployment/rollbackService";


export async function POST(
  req: NextRequest
) {

  const body = await req.json();


  const {
    deploymentId,
    previousDeploymentId
  } = body;


  await rollbackService.rollback(
    deploymentId,
    previousDeploymentId
  );


  return NextResponse.json({
    success:true
  });

}