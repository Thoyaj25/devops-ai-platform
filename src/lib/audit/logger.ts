import { auditService } from "@/services/audit/auditService";

import type { AuditAction } from "./actions";
import type { AuditResource } from "./resources";


export async function createAuditLog(input:{
  action: AuditAction;
  resource: AuditResource;
  userId:string;
  metadata?: Record<string, unknown>;
}){

  try {

    await auditService.log(input);

  } catch(error){

    console.error(
      "Audit logging failed",
      error
    );

  }

}