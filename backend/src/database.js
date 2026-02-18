import mongoose from 'mongoose';

const MAX_BRIEFS = 5;

const briefSchema = new mongoose.Schema({
  summary: { type: String, required: true },
  keyPoints: [
    {
      point: String,
      source: String,
      url: String,
      snippet: String
    }
  ],
  conflicts: [
    {
      claim: String,
      sourceA: String,
      sourceB: String
    }
  ],
  whatToVerify: [String],
  sourcesUsed: [
    {
      url: String,
      title: String,
      contribution: String
    }
  ],
  sources: [
    {
      url: String,
      title: String,
      used: Boolean
    }
  ],
  stats: {
    total: Number,
    successful: Number,
    failed: Number
  },
  createdAt: { type: Date, default: Date.now }
});

const Brief = mongoose.model('Brief', briefSchema);

export async function connect() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI not set in .env');
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
}

export async function saveBrief(data) {
  try {
    const brief = new Brief(data);
    await brief.save();

    // Keep only last 5
    const all = await Brief.find().sort({ createdAt: -1 });
    if (all.length > MAX_BRIEFS) {
      const toDelete = all.slice(MAX_BRIEFS).map(b => b._id);
      await Brief.deleteMany({ _id: { $in: toDelete } });
    }

    console.log('💾 Brief saved\n');
    return brief;
  } catch (error) {
    console.error('❌ Save failed:', error.message);
    throw new Error('Failed to save brief');
  }
}

export async function getRecent() {
  try {
    return await Brief.find()
      .sort({ createdAt: -1 })
      .limit(MAX_BRIEFS)
      .lean();
  } catch (error) {
    console.error('❌ Fetch failed:', error.message);
    throw new Error('Failed to fetch briefs');
  }
}

export function getDbStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState] || 'unknown';
}