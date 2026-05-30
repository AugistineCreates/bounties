import { authClient } from "@/lib/auth-client";

/**
 * Hook to get the current user's role from the session.
 * Returns "sponsor", "contributor", or undefined if not authenticated.
 */
export function useUserRole(): "sponsor" | "contributor" | undefined {
  const { data: session } = authClient.useSession();
  return (session?.user as { role?: string } | undefined)?.role as
    | "sponsor"
    | "contributor"
    | undefined;
}
