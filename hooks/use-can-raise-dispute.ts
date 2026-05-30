import { authClient } from "@/lib/auth-client";
import type { BountyFieldsFragment } from "@/lib/graphql/generated";
import type { Bounty } from "@/types/bounty";

type SidebarBounty = BountyFieldsFragment & Partial<Bounty>;

/**
 * Returns whether the current user is eligible to raise a dispute on the given bounty.
 * Eligible users are those who are either the bounty creator or a participant (submitter),
 * and the bounty is in a disputable state (IN_PROGRESS or UNDER_REVIEW).
 */
export function useCanRaiseDispute(bounty: SidebarBounty): boolean {
  const { data: session } = authClient.useSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const isCreator = userId === bounty.createdBy;
  const isParticipant =
    bounty.submissions?.some((s) => s.submittedBy === userId) ?? false;

  return (
    (isParticipant || isCreator) &&
    (bounty.status === "IN_PROGRESS" || bounty.status === "UNDER_REVIEW")
  );
}
