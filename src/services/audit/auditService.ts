import { auditRepository } from "@/repositories/auditRepository";

export const auditService = {
  async log(data: {
    action: string;
    resource: string;
    userId: string;
    metadata?: object;
  }) {
    return auditRepository.create(data);
  },

  async getLogs() {
    return auditRepository.findAll();
  },

  async getUserLogs(userId: string) {
    return auditRepository.findByUser(userId);
  },
};