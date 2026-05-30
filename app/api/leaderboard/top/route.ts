import { NextResponse } from "next/server";
import { getMockLeaderboard } from "@/lib/mock/leaderboard";

function sanitizeCount(count: number, max = 100): number {
  const safeCount = Math.max(
    1,
    Math.min(max, Math.floor(Number.isNaN(count) ? 5 : count)),
  );
  return safeCount;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawCount = parseInt(searchParams.get("count") || "5");
  const count = sanitizeCount(rawCount);

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Get top N contributors
  const { data } = getMockLeaderboard(1, count);

  return NextResponse.json(data);
}
