import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, hyperliquidConnection, InsertHyperliquidConnection } from "../drizzle/schema";
import { ENV } from './_core/env';
import * as crypto from 'crypto';

// Simple encryption for storing private keys
// In production, use a proper secrets manager
const ENCRYPTION_KEY = process.env.JWT_SECRET?.slice(0, 32).padEnd(32, '0') || 'default-key-32-chars-long-here!';
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Hyperliquid Connection Persistence
export async function saveHyperliquidConnection(
  privateKey: string,
  walletAddress: string,
  useMainnet: boolean
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save Hyperliquid connection: database not available");
    return;
  }

  try {
    const encryptedKey = encrypt(privateKey);
    
    // Deactivate any existing connections
    await db.update(hyperliquidConnection)
      .set({ isActive: 0 })
      .where(eq(hyperliquidConnection.isActive, 1));
    
    // Insert new connection
    await db.insert(hyperliquidConnection).values({
      encryptedPrivateKey: encryptedKey,
      walletAddress,
      useMainnet: useMainnet ? 1 : 0,
      isActive: 1,
    });
    
    console.log("[Database] Hyperliquid connection saved successfully");
  } catch (error) {
    console.error("[Database] Failed to save Hyperliquid connection:", error);
    throw error;
  }
}

export async function getActiveHyperliquidConnection(): Promise<{
  privateKey: string;
  walletAddress: string;
  useMainnet: boolean;
} | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get Hyperliquid connection: database not available");
    return null;
  }

  try {
    const result = await db
      .select()
      .from(hyperliquidConnection)
      .where(eq(hyperliquidConnection.isActive, 1))
      .orderBy(desc(hyperliquidConnection.createdAt))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const conn = result[0];
    return {
      privateKey: decrypt(conn.encryptedPrivateKey),
      walletAddress: conn.walletAddress,
      useMainnet: conn.useMainnet === 1,
    };
  } catch (error) {
    console.error("[Database] Failed to get Hyperliquid connection:", error);
    return null;
  }
}

export async function deactivateHyperliquidConnection(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot deactivate Hyperliquid connection: database not available");
    return;
  }

  try {
    await db.update(hyperliquidConnection)
      .set({ isActive: 0 })
      .where(eq(hyperliquidConnection.isActive, 1));
    
    console.log("[Database] Hyperliquid connection deactivated");
  } catch (error) {
    console.error("[Database] Failed to deactivate Hyperliquid connection:", error);
  }
}

// TODO: add feature queries here as your schema grows.
