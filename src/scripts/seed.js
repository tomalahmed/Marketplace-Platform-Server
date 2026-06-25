require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User.model");
const Prompt = require("../models/Prompt.model");
const seedData = require("../data/seed-data.json");

const DEFAULT_PASSWORD = seedData.meta?.defaultPassword || "Demo@12345";

function toId(value) {
  return new mongoose.Types.ObjectId(value);
}

async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

async function removeStringIdDuplicates(collectionName) {
  const collection = mongoose.connection.db.collection(collectionName);
  const docs = await collection.find({}).toArray();
  let removed = 0;

  for (const doc of docs) {
    if (typeof doc._id !== "string") continue;

    const objectId = toId(doc._id);
    const objectIdDoc = await collection.findOne({ _id: objectId });

    if (objectIdDoc) {
      await collection.deleteOne({ _id: doc._id });
      removed += 1;
    } else {
      const { _id, ...rest } = doc;
      await collection.deleteOne({ _id: doc._id });
      await collection.insertOne({ ...rest, _id: objectId });
      removed += 1;
    }
  }

  return removed;
}

async function seedUsers() {
  const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
  let upserted = 0;

  for (const user of seedData.users) {
    const userId = toId(user._id);

    await User.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          name: user.name,
          email: user.email,
          photoURL: user.photoURL || "",
          role: user.role,
          isPremium: Boolean(user.isPremium),
          promptCount: user.promptCount ?? 0,
        },
        $setOnInsert: {
          _id: userId,
          password: hashedPassword,
          createdAt: user.createdAt ? new Date(user.createdAt) : undefined,
        },
      },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    upserted += 1;
  }

  return upserted;
}

async function seedPrompts() {
  let upserted = 0;

  for (const prompt of seedData.prompts) {
    const promptId = toId(prompt._id);
    const creatorId = toId(prompt.creator);

    await Prompt.findOneAndUpdate(
      { _id: promptId },
      {
        $set: {
          title: prompt.title,
          description: prompt.description,
          content: prompt.content,
          category: prompt.category,
          aiTool: prompt.aiTool,
          tags: prompt.tags || [],
          difficulty: prompt.difficulty,
          visibility: prompt.visibility,
          status: prompt.status,
          featured: Boolean(prompt.featured),
          copyCount: prompt.copyCount ?? 0,
          averageRating: prompt.averageRating ?? 0,
          reviewCount: prompt.reviewCount ?? 0,
          rejectionFeedback: prompt.rejectionFeedback || "",
          creator: creatorId,
          thumbnail: prompt.thumbnail || "",
        },
        $setOnInsert: {
          _id: promptId,
          createdAt: prompt.createdAt ? new Date(prompt.createdAt) : undefined,
        },
      },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    upserted += 1;
  }

  return upserted;
}

async function syncCreatorPromptCounts() {
  for (const user of seedData.users) {
    const count = await Prompt.countDocuments({ creator: toId(user._id) });
    await User.findByIdAndUpdate(toId(user._id), { promptCount: count });
  }
}

async function runSeed() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not defined in .env");
  }

  await mongoose.connect(uri);
  console.log("MongoDB connected");

  const removedUsers = await removeStringIdDuplicates("users");
  const removedPrompts = await removeStringIdDuplicates("prompts");
  if (removedUsers || removedPrompts) {
    console.log(
      `Cleaned string _id duplicates → users: ${removedUsers}, prompts: ${removedPrompts}`
    );
  }

  const userCount = await seedUsers();
  const promptCount = await seedPrompts();
  await syncCreatorPromptCounts();

  console.log(`Seeded ${userCount} users`);
  console.log(`Seeded ${promptCount} prompts`);
  console.log("");
  console.log("Demo login credentials (all seeded users):");
  console.log(`  Password: ${DEFAULT_PASSWORD}`);
  console.log("");
  seedData.users.forEach((user) => {
    console.log(`  ${user.role.padEnd(7)} → ${user.email}`);
  });
  console.log("");
  console.log("Approved public prompts will appear on /prompts and landing featured.");
  console.log("Private premium prompt requires isPremium user to view full content.");
}

runSeed()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Seed failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  });
