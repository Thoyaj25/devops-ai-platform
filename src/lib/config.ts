export const config = {
  deploymentDomain:
    process.env.DEPLOYMENT_DOMAIN ?? "marketsphere.local",

  deploymentTimeouts: {
    checkoutMs: Number(
      process.env.DEPLOYMENT_CHECKOUT_TIMEOUT_MS ?? 300_000
    ),

    buildMs: Number(
      process.env.DEPLOYMENT_BUILD_TIMEOUT_MS ?? 600_000
    ),

    deployMs: Number(
      process.env.DEPLOYMENT_DEPLOY_TIMEOUT_MS ?? 300_000
    ),

    verifyMs: Number(
      process.env.DEPLOYMENT_VERIFY_TIMEOUT_MS ?? 120_000
    ),
  },

  workerHeartbeatSeconds: Number(
    process.env.WORKER_HEARTBEAT_SECONDS ?? 10
  ),

  workerRecoveryTimeoutSeconds: Number(
    process.env.WORKER_RECOVERY_TIMEOUT_SECONDS ?? 60
  ),
};