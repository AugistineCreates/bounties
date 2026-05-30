import { NextResponse } from "next/server";
import { getMockLeaderboard } from "@/lib/mock/leaderboard";
import { LeaderboardResponse, ReputationTier } from "@/types/leaderboard";

function sanitizePageLimit(
  page: number,
  limit: number,
  maxLimit = 100,
): { page: number; limit: number } {
  const safePage = Math.max(1, Math.floor(Number.isNaN(page) ? 1 : page));
  const safeLimit = Math.max(
    1,
    Math.min(maxLimit, Math.floor(Number.isNaN(limit) ? 10 : limit)),
  );
  return { page: safePage, limit: safeLimit };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawPage = parseInt(searchParams.get("page") || "1");
  const rawLimit = parseInt(searchParams.get("limit") || "10");
  const tier = searchParams.get("tier") as ReputationTier | null;

  const { page, limit } = sanitizePageLimit(rawPage, rawLimit);

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const { data, total } = getMockLeaderboard(page, limit, tier || undefined);

  const response: LeaderboardResponse = {
    entries: data.map((contributor, index) => ({
      rank: (page - 1) * limit + index + 1,
      previousRank: null, // Mock data doesn't track history yet
      rankChange: 0,
      contributor,
    })),
    totalCount: total,
    currentUserRank: null, // Only relevant if user context is provided
    lastUpdatedAt: new Date().toISOString(),
  };

  return NextResponse.json(response);
}
