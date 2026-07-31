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
};