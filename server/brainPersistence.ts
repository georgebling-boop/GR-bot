/**
 * Brain Persistence Service
 * Saves and loads the AI brain state to/from the database
 * Ensures the AI continues learning across server restarts
 */

import { getDb } from "./db";
import { aiBrainState } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import {
  exportBrainState,
  importBrainState,
  getLearningStats,
  getBrainState,
} from "./continuousLearningAI";

// Auto-save interval (every 5 minutes)
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000;
let autoSaveTimer: NodeJS.Timeout | null = null;
let lastSaveTime: Date | null = null;
let saveCount = 0;

/**
 * Save the current brain state to the database
 */
export async function saveBrainToDatabase(): Promise<{
  success: boolean;
  message: string;
  savedAt?: Date;
}> {
  try {
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        message: "Database not available",
      };
    }

    const brainData = exportBrainState();
    const stats = getLearningStats();
    const brain = getBrainState();

    // Check if we have an existing brain state
    const existing = await db
      .select()
      .from(aiBrainState)
      .orderBy(desc(aiBrainState.id))
      .limit(1);

    if (existing.length > 0) {
      // Update existing record
      await db
        .update(aiBrainState)
        .set({
          version: brain.version,
          brainData,
          totalCycles: stats.totalCycles,
          totalTrades: stats.totalTrades,
          winRate: Math.round(stats.winRate * 100),
          patternsLearned: stats.patternsLearned,
        })
        .where(eq(aiBrainState.id, existing[0].id));
    } else {
      // Insert new record
      await db.insert(aiBrainState).values({
        version: brain.version,
        brainData,
        totalCycles: stats.totalCycles,
        totalTrades: stats.totalTrades,
        winRate: Math.round(stats.winRate * 100),
        patternsLearned: stats.patternsLearned,
      });
    }

    lastSaveTime = new Date();
    saveCount++;

    return {
      success: true,
      message: `Brain state saved successfully (save #${saveCount})`,
      savedAt: lastSaveTime,
    };
  } catch (error) {
    console.error("Failed to save brain to database:", error);
    return {
      success: false,
      message: `Failed to save brain: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Load the brain state from the database
 */
export async function loadBrainFromDatabase(): Promise<{
  success: boolean;
  message: string;
  stats?: ReturnType<typeof getLearningStats>;
}> {
  try {
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        message: "Database not available",
      };
    }

    const existing = await db
      .select()
      .from(aiBrainState)
      .orderBy(desc(aiBrainState.id))
      .limit(1);

    if (existing.length === 0) {
      return {
        success: false,
        message: "No saved brain state found in database",
      };
    }

    const record = existing[0];
    const success = importBrainState(record.brainData);

    if (success) {
      const stats = getLearningStats();
      return {
        success: true,
        message: `Brain state loaded successfully (${stats.totalCycles} cycles, ${stats.patternsLearned} patterns)`,
        stats,
      };
    } else {
      return {
        success: false,
        message: "Failed to import brain state from database",
      };
    }
  } catch (error) {
    console.error("Failed to load brain from database:", error);
    return {
      success: false,
      message: `Failed to load brain: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Start auto-saving the brain state
 */
export function startAutoSave(): void {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
  }

  autoSaveTimer = setInterval(async () => {
    const stats = getLearningStats();
    // Only save if there have been learning cycles
    if (stats.totalCycles > 0) {
      const result = await saveBrainToDatabase();
      if (result.success) {
        console.log(`[BrainPersistence] Auto-saved: ${result.message}`);
      }
    }
  }, AUTO_SAVE_INTERVAL);

  console.log("[BrainPersistence] Auto-save started (every 5 minutes)");
}

/**
 * Stop auto-saving
 */
export function stopAutoSave(): void {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
    console.log("[BrainPersistence] Auto-save stopped");
  }
}

/**
 * Get persistence status
 */
export function getPersistenceStatus(): {
  autoSaveEnabled: boolean;
  lastSaveTime: Date | null;
  saveCount: number;
  nextSaveIn: number | null;
} {
  return {
    autoSaveEnabled: autoSaveTimer !== null,
    lastSaveTime,
    saveCount,
    nextSaveIn: autoSaveTimer ? AUTO_SAVE_INTERVAL : null,
  };
}

/**
 * Initialize brain persistence - load from database on startup
 */
export async function initializeBrainPersistence(): Promise<void> {
  console.log("[BrainPersistence] Initializing...");
  
  // Try to load existing brain state
  const loadResult = await loadBrainFromDatabase();
  if (loadResult.success) {
    console.log(`[BrainPersistence] ${loadResult.message}`);
  } else {
    console.log("[BrainPersistence] Starting with fresh brain state");
  }

  // Start auto-save
  startAutoSave();
}

/**
 * Get brain history from database
 */
export async function getBrainHistory(): Promise<{
  records: Array<{
    id: number;
    version: number;
    totalCycles: number;
    totalTrades: number;
    winRate: number;
    patternsLearned: number;
    updatedAt: Date;
  }>;
}> {
  try {
    const db = await getDb();
    if (!db) {
      return { records: [] };
    }

    const records = await db
      .select({
        id: aiBrainState.id,
        version: aiBrainState.version,
        totalCycles: aiBrainState.totalCycles,
        totalTrades: aiBrainState.totalTrades,
        winRate: aiBrainState.winRate,
        patternsLearned: aiBrainState.patternsLearned,
        updatedAt: aiBrainState.updatedAt,
      })
      .from(aiBrainState)
      .orderBy(desc(aiBrainState.updatedAt))
      .limit(10);

    return { records };
  } catch (error) {
    console.error("Failed to get brain history:", error);
    return { records: [] };
  }
}
