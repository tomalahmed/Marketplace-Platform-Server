const User = require("../models/User.model");

const DEMO_EMAILS = [
  "alex.mercer@dev.com",
  "sarah.c@freeuser.io",
  "elena.admin@promptmarket.com",
];

let cachedDemoUserIds = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 60 * 1000;

function isDemoEmail(email) {
  if (!email) return false;
  return DEMO_EMAILS.includes(String(email).trim().toLowerCase());
}

function isDemoViewer(req) {
  return Boolean(req.user && isDemoEmail(req.user.email));
}

async function getDemoUserIds() {
  const now = Date.now();
  if (cachedDemoUserIds && now < cacheExpiresAt) {
    return cachedDemoUserIds;
  }

  const users = await User.find({ email: { $in: DEMO_EMAILS } }).select("_id");
  cachedDemoUserIds = users.map((user) => user._id);
  cacheExpiresAt = now + CACHE_TTL_MS;
  return cachedDemoUserIds;
}

async function applyDemoCreatorFilter(filter, req) {
  if (!isDemoViewer(req)) {
    return filter;
  }

  const demoUserIds = await getDemoUserIds();
  return {
    ...filter,
    creator: { $in: demoUserIds },
  };
}

async function isPromptInDemoScope(prompt) {
  if (!prompt?.creator) return false;
  const demoUserIds = await getDemoUserIds();
  const creatorId = String(prompt.creator._id || prompt.creator);
  return demoUserIds.some((id) => String(id) === creatorId);
}

async function assertPromptVisibleToViewer(req, prompt) {
  if (!isDemoViewer(req)) {
    return true;
  }

  return isPromptInDemoScope(prompt);
}

async function applyDemoUserFilter(filter, req) {
  if (!isDemoViewer(req)) {
    return filter;
  }

  return {
    ...filter,
    email: { $in: DEMO_EMAILS },
  };
}

function clearDemoUserIdCache() {
  cachedDemoUserIds = null;
  cacheExpiresAt = 0;
}

module.exports = {
  DEMO_EMAILS,
  isDemoEmail,
  isDemoViewer,
  getDemoUserIds,
  applyDemoCreatorFilter,
  applyDemoUserFilter,
  isPromptInDemoScope,
  assertPromptVisibleToViewer,
  clearDemoUserIdCache,
};
