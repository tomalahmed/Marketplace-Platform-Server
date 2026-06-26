/**
 * Strip or lock prompt content for viewers without premium access.
 */
function getCreatorId(prompt) {
  const creator = prompt.creator;
  if (!creator) return null;
  return String(creator._id || creator);
}

function canViewFullContent(prompt, user) {
  if (!prompt || prompt.visibility !== "private") {
    return true;
  }

  const creatorId = getCreatorId(prompt);
  const isOwner = user && creatorId && String(user.id) === creatorId;
  const isAdmin = user?.role === "admin";

  if (isOwner || isAdmin) return true;
  return Boolean(user?.isPremium);
}

function sanitizePromptForViewer(prompt, user) {
  const doc = prompt.toObject ? prompt.toObject() : { ...prompt };
  const creatorId = getCreatorId(doc);
  const isOwner = user && creatorId && String(user.id) === creatorId;
  const isAdmin = user?.role === "admin";
  const locked = doc.visibility === "private" && !isOwner && !isAdmin && !user?.isPremium;

  doc.isPro = doc.visibility === "private";
  doc.contentLocked = locked;

  if (locked) {
    const source = doc.content || "";
    doc.contentPreview = source.slice(0, 180);
    doc.content = null;
  }

  return doc;
}

function sanitizePromptsForViewer(prompts, user) {
  return prompts.map((prompt) => sanitizePromptForViewer(prompt, user));
}

async function enrichViewerFromRequest(req, User) {
  if (!req.user?.id) return null;

  const user = await User.findById(req.user.id).select("isPremium role");

  if (!user) return null;

  return {
    id: String(user._id),
    role: req.user.role || user.role,
    isPremium: Boolean(user.isPremium),
  };
}

module.exports = {
  canViewFullContent,
  sanitizePromptForViewer,
  sanitizePromptsForViewer,
  enrichViewerFromRequest,
};
