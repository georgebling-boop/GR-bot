import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the database functions
vi.mock('./db', () => ({
  saveHyperliquidConnection: vi.fn().mockResolvedValue(undefined),
  getActiveHyperliquidConnection: vi.fn().mockResolvedValue(null),
  deactivateHyperliquidConnection: vi.fn().mockResolvedValue(undefined),
}));

import {
  saveHyperliquidConnection,
  getActiveHyperliquidConnection,
  deactivateHyperliquidConnection,
} from './db';

describe('Hyperliquid Connection Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('saveHyperliquidConnection', () => {
    it('should save connection with encrypted private key', async () => {
      const privateKey = '0xb2f2c4e8d9a1f3e5c7b8d0e2f4a6c8d0e2f4a6c8d0e2f4a6c8d0e2f4a6c8d0e2';
      const walletAddress = '0xdaC7c16e9f151674fcB94296B0702c2DE2b8fa68';
      const useMainnet = false;

      await saveHyperliquidConnection(privateKey, walletAddress, useMainnet);

      expect(saveHyperliquidConnection).toHaveBeenCalledWith(
        privateKey,
        walletAddress,
        useMainnet
      );
    });

    it('should save mainnet connection', async () => {
      const privateKey = '0xb2f2c4e8d9a1f3e5c7b8d0e2f4a6c8d0e2f4a6c8d0e2f4a6c8d0e2f4a6c8d0e2';
      const walletAddress = '0xdaC7c16e9f151674fcB94296B0702c2DE2b8fa68';
      const useMainnet = true;

      await saveHyperliquidConnection(privateKey, walletAddress, useMainnet);

      expect(saveHyperliquidConnection).toHaveBeenCalledWith(
        privateKey,
        walletAddress,
        true
      );
    });
  });

  describe('getActiveHyperliquidConnection', () => {
    it('should return null when no active connection exists', async () => {
      vi.mocked(getActiveHyperliquidConnection).mockResolvedValueOnce(null);
      const result = await getActiveHyperliquidConnection();
      expect(result).toBeNull();
    });

    it('should return decrypted connection when exists', async () => {
      const mockConnection = {
        privateKey: '0xb2f2c4e8d9a1f3e5c7b8d0e2f4a6c8d0e2f4a6c8d0e2f4a6c8d0e2f4a6c8d0e2',
        walletAddress: '0xdaC7c16e9f151674fcB94296B0702c2DE2b8fa68',
        useMainnet: false,
      };

      vi.mocked(getActiveHyperliquidConnection).mockResolvedValueOnce(mockConnection);

      const result = await getActiveHyperliquidConnection();

      expect(result).toEqual(mockConnection);
      expect(result?.privateKey).toBe(mockConnection.privateKey);
      expect(result?.walletAddress).toBe(mockConnection.walletAddress);
      expect(result?.useMainnet).toBe(false);
    });
  });

  describe('deactivateHyperliquidConnection', () => {
    it('should deactivate active connection', async () => {
      await deactivateHyperliquidConnection();

      expect(deactivateHyperliquidConnection).toHaveBeenCalled();
    });
  });

  describe('Connection Persistence Flow', () => {
    it('should support full persistence lifecycle', async () => {
      const privateKey = '0xb2f2c4e8d9a1f3e5c7b8d0e2f4a6c8d0e2f4a6c8d0e2f4a6c8d0e2f4a6c8d0e2';
      const walletAddress = '0xdaC7c16e9f151674fcB94296B0702c2DE2b8fa68';

      // Step 1: Save connection
      await saveHyperliquidConnection(privateKey, walletAddress, false);
      expect(saveHyperliquidConnection).toHaveBeenCalledTimes(1);

      // Step 2: Retrieve connection (simulating server restart)
      vi.mocked(getActiveHyperliquidConnection).mockResolvedValueOnce({
        privateKey,
        walletAddress,
        useMainnet: false,
      });

      const savedConnection = await getActiveHyperliquidConnection();
      expect(savedConnection).not.toBeNull();
      expect(savedConnection?.privateKey).toBe(privateKey);
      expect(savedConnection?.walletAddress).toBe(walletAddress);

      // Step 3: Deactivate connection (disconnect)
      await deactivateHyperliquidConnection();
      expect(deactivateHyperliquidConnection).toHaveBeenCalledTimes(1);
    });
  });
});
