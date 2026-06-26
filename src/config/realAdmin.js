/**
 * Real platform admin — configured via .env (not part of demo sandbox).
 *
 * REAL_ADMIN_EMAIL     — admin login email (change anytime, then run npm run seed:admin)
 * REAL_ADMIN_PASSWORD  — admin password (required for seed:admin)
 * REAL_ADMIN_NAME      — display name (optional, default: PromptGrowth Admin)
 */

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getRealAdminConfig({ requireEmail = false, requirePassword = false } = {}) {
  const email = normalizeEmail(process.env.REAL_ADMIN_EMAIL);
  const password = process.env.REAL_ADMIN_PASSWORD || "";
  const name = (process.env.REAL_ADMIN_NAME || "PromptGrowth Admin").trim();

  if (requireEmail && !email) {
    throw new Error(
      "REAL_ADMIN_EMAIL is required. Set it in Marketplace-Platform-Server/.env and re-run."
    );
  }

  if (requirePassword && !password) {
    throw new Error(
      "REAL_ADMIN_PASSWORD is required. Set it in Marketplace-Platform-Server/.env and re-run."
    );
  }

  return {
    email,
    password,
    name,
    isConfigured: Boolean(email && password),
    hasEmail: Boolean(email),
  };
}

module.exports = {
  normalizeEmail,
  getRealAdminConfig,
};
