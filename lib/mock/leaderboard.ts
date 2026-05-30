import { LeaderboardContributor, ReputationTier } from "@/types/leaderboard";

function makeMockContributor(
  id: string,
  rank: number,
  tier: ReputationTier,
  score: number,
): LeaderboardContributor {
  return {
    id: `contributor-${id}`,
    userId: `user-${id}`,
    walletAddress: `0x${"0".repeat(40)}`,
    displayName: `Contributor ${id}`,
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
    totalScore: score,
    tier,
    stats: {
      totalCompleted: Math.floor(Math.random() * 50) + 1,
      totalEarnings: Math.floor(Math.random() * 10000) + 100,
      earningsCurrency: "USDC",
      completionRate: 0.85 + Math.random() * 0.15,
      averageCompletionTime: Math.floor(Math.random() * 72) + 24,
      currentStreak: Math.floor(Math.random() * 5),
      longestStreak: Math.floor(Math.random() * 10) + 5,
    },
    topTags: ["DeFi", "Smart Contracts", "Frontend", "Auditing"]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3),
    lastActiveAt: new Date(
      Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000,
    ).toISOString(),
  };
}

export function makeMockLeaderboardData(count = 50): LeaderboardContributor[] {
  const baseList = [
    makeMockContributor("1", 1, ReputationTier.Legend, 15000),
    makeMockContributor("2", 2, ReputationTier.Legend, 14500),
    makeMockContributor("3", 3, ReputationTier.Expert, 12000),
    makeMockContributor("4", 4, ReputationTier.Expert, 11500),
    makeMockContributor("5", 5, ReputationTier.Established, 9000),
    makeMockContributor("6", 6, ReputationTier.Established, 8500),
    makeMockContributor("7", 7, ReputationTier.Contributor, 5000),
    makeMockContributor("8", 8, ReputationTier.Contributor, 4500),
    makeMockContributor("9", 9, ReputationTier.Newcomer, 1000),
    makeMockContributor("10", 10, ReputationTier.Newcomer, 800),
  ];

  const extra = Math.max(0, count - 10);
  if (extra === 0) return baseList;

  return [
    ...baseList,
    ...Array.from({ length: extra }, (_, i) =>
      makeMockContributor(
        `${i + 11}`,
        i + 11,
        ReputationTier.Newcomer,
        500 - i * 10,
      ),
    ),
  ];
}

export const mockLeaderboardData = makeMockLeaderboardData();

export function getMockLeaderboard(
  page: number = 1,
  limit: number = 10,
  filterTier?: ReputationTier,
) {
  const safePage = Math.max(1, Math.floor(Number.isNaN(page) ? 1 : page));
  const safeLimit = Math.max(1, Math.floor(Number.isNaN(limit) ? 10 : limit));

  let filtered = [...mockLeaderboardData];

  if (filterTier) {
    filtered = filtered.filter((c) => c.tier === filterTier);
  }

  const sorted = filtered.sort((a, b) => b.totalScore - a.totalScore);
  const start = (safePage - 1) * safeLimit;
  const paginated = sorted.slice(start, start + safeLimit);

  return {
    data: paginated,
    total: filtered.length,
  };
}

export function getMockUserRank(userId: string) {
  const index = mockLeaderboardData.findIndex((u) => u.userId === userId);
  if (index === -1) return null;
  return {
    rank: index + 1,
    contributor: mockLeaderboardData[index],
  };
}
