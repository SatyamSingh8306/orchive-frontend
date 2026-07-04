import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'sasefied_agent';

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI environment variable inside .env.local');
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

// Collections - These should only be used in API routes
export async function getWorkflowsCollection() {
  const { db } = await connectToDatabase();
  return db.collection('workflows');
}

export async function getToolsCollection() {
  const { db } = await connectToDatabase();
  return db.collection('tools');
}

export async function getConflictsCollection() {
  const { db } = await connectToDatabase();
  return db.collection('conflicts');
}

export async function getWorkflowAdminsCollection() {
  const { db } = await connectToDatabase();
  return db.collection('workflowAdmins');
}

export async function getWorkflowChatsCollection() {
  const { db } = await connectToDatabase();
  return db.collection('workflowChats');
}

// Export Edge for compatibility
export type Edge = {
  id: string;
  from: string;
  to: string;
};

// Workflow presets for agent workflow - server side only
export const workflowPresets: Record<
  string,
  {
    nodes: any[]; // Use any to avoid type conflicts
    edges: any[];
  }
> = {};

// Default export for compatibility
export default workflowPresets;
