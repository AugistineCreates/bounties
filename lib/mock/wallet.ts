import { WalletInfo, WalletAsset, WalletActivity } from "@/types/wallet";

export function makeMockWalletInfo(
  overrides: Partial<WalletInfo> = {},
): WalletInfo {
  return {
    address: "GC64SVY3XSYEE7MYADTEQNO3ACCWJ6NLWNNJLPO2FGS4I2PCNBPVNZOP",
    displayName: "John Doe",
    balance: 0,
    balanceCurrency: "USD",
    assets: [],
    recentActivity: [],
    has2FA: false,
    isConnected: true,
    ...overrides,
  };
}

export function makeMockWalletAsset(
  overrides: Partial<WalletAsset> = {},
): WalletAsset {
  return {
    id: "mock-asset-id",
    tokenSymbol: "XLM",
    tokenName: "Stellar Lumens",
    amount: 1000,
    usdValue: 100,
    ...overrides,
  };
}

export function makeMockWalletActivity(
  overrides: Partial<WalletActivity> = {},
): WalletActivity {
  return {
    id: "mock-activity-id",
    type: "earning",
    amount: 500,
    currency: "USDC",
    date: new Date().toISOString(),
    status: "completed",
    description: "Mock activity",
    ...overrides,
  };
}

export function makeMockWalletWithAssets(
  overrides: Partial<WalletInfo> = {},
): WalletInfo {
  return {
    address: "GC64SVY3XSYEE7MYADTEQNO3ACCWJ6NLWNNJLPO2FGS4I2PCNBPVNZOP",
    displayName: "Jane Smith",
    balance: 1250.5,
    balanceCurrency: "USD",
    assets: [
      makeMockWalletAsset({
        id: "1",
        tokenSymbol: "XLM",
        tokenName: "Stellar Lumens",
        amount: 5000,
        usdValue: 625.0,
      }),
      makeMockWalletAsset({
        id: "2",
        tokenSymbol: "USDC",
        tokenName: "USD Coin",
        amount: 625.5,
        usdValue: 625.5,
      }),
    ],
    recentActivity: [
      makeMockWalletActivity({
        id: "1",
        type: "earning",
        amount: 500,
        currency: "USDC",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: "completed",
        description: "Bounty reward - Feature Implementation",
      }),
      makeMockWalletActivity({
        id: "2",
        type: "earning",
        amount: 250,
        currency: "XLM",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: "completed",
        description: "Bounty reward - Bug Fix",
      }),
      makeMockWalletActivity({
        id: "3",
        type: "withdrawal",
        amount: 100,
        currency: "USDC",
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "completed",
        description: "Withdrawal to external wallet",
      }),
    ],
    has2FA: true,
    isConnected: true,
    ...overrides,
  };
}

export const mockWalletInfo = makeMockWalletInfo();
export const mockWalletWithAssets = makeMockWalletWithAssets();

export function truncateStellarAddress(address: string): string {
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
