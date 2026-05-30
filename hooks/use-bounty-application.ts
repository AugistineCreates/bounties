"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { bountyKeys } from "@/lib/query/query-keys";
import { MOCK_MODEL4_MILESTONES } from "@/lib/mock/model4";
import type { BountyQuery } from "@/lib/graphql/generated";
import type { ContributorProgress, Bounty, Milestone } from "@/types/bounty";

// ---------------------------------------------------------------------------
// Contract client shape (resolved from globalThis.__applicationContracts)
// ---------------------------------------------------------------------------

type ApplicationContractClient = {
  apply: (params: {
    applicant: string;
    bountyId: bigint;
    proposal: string;
  }) => Promise<{ txHash: string }>;
  selectApplicant: (params: {
    creator: string;
    bountyId: bigint;
    applicant: string;
  }) => Promise<{ txHash: string }>;
  submitWork: (params: {
    contributor: string;
    bountyId: bigint;
    workCid: string;
  }) => Promise<{ txHash: string }>;
  approveSubmission: (params: {
    creator: string;
    bountyId: bigint;
    points: number;
  }) => Promise<{ txHash: string }>;
  applyForSlot: (params: {
    applicant: string;
    bountyId: bigint;
  }) => Promise<{ txHash: string }>;
};

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export type ApplicationErrorCode =
  | "missing_contract_bindings"
  | "already_applied"
  | "tx_failed";

export class ApplicationError extends Error {
  code: ApplicationErrorCode;
  constructor(code: ApplicationErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toBountyIdBigInt(id: string): bigint {
  if (/^\d+$/.test(id)) return BigInt(id);
  const hex = id.replace(/-/g, "");
  if (/^[0-9a-f]+$/i.test(hex)) return BigInt(`0x${hex}`);
  throw new ApplicationError("tx_failed", `Invalid bounty ID: "${id}"`);
}

function resolveApplicationClient(): ApplicationContractClient {
  const client = (
    globalThis as { __applicationContracts?: ApplicationContractClient }
  ).__applicationContracts;
  if (!client) {
    throw new ApplicationError(
      "missing_contract_bindings",
      "Application contract bindings unavailable. Ensure bindings are loaded.",
    );
  }
  return client;
}

// ---------------------------------------------------------------------------
// Hook: apply (BountyRegistry.apply)
// ---------------------------------------------------------------------------

export function useApplyToBounty() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bountyId,
      applicantAddress,
      proposal,
    }: {
      bountyId: string;
      applicantAddress: string;
      proposal: string;
    }) => {
      const client = resolveApplicationClient();
      return client.apply({
        applicant: applicantAddress,
        bountyId: toBountyIdBigInt(bountyId),
        proposal,
      });
    },
    onSettled: (_r, _e, v) => {
      qc.invalidateQueries({ queryKey: bountyKeys.detail(v.bountyId) });
    },
  });
}

// ---------------------------------------------------------------------------
// Hook: select applicant (BountyRegistry.select_applicant)
// ---------------------------------------------------------------------------

export function useSelectApplicant() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bountyId,
      creatorAddress,
      applicantAddress,
    }: {
      bountyId: string;
      creatorAddress: string;
      applicantAddress: string;
    }) => {
      const client = resolveApplicationClient();
      return client.selectApplicant({
        creator: creatorAddress,
        bountyId: toBountyIdBigInt(bountyId),
        applicant: applicantAddress,
      });
    },
    onMutate: async ({ bountyId }) => {
      await qc.cancelQueries({ queryKey: bountyKeys.detail(bountyId) });
      const prev = qc.getQueryData<BountyQuery>(bountyKeys.detail(bountyId));
      if (prev?.bounty) {
        qc.setQueryData<BountyQuery>(bountyKeys.detail(bountyId), {
          ...prev,
          bounty: {
            ...prev.bounty,
            status: "IN_PROGRESS",
            updatedAt: new Date().toISOString(),
          },
        });
      }
      return { prev, bountyId };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(bountyKeys.detail(ctx.bountyId), ctx.prev);
    },
    onSettled: (_r, _e, v) => {
      qc.invalidateQueries({ queryKey: bountyKeys.detail(v.bountyId) });
      qc.invalidateQueries({ queryKey: bountyKeys.lists() });
    },
  });
}

// ---------------------------------------------------------------------------
// Hook: submit work (BountyRegistry.submit_work)
// ---------------------------------------------------------------------------

export function useSubmitApplicationWork() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bountyId,
      contributorAddress,
      workCid,
    }: {
      bountyId: string;
      contributorAddress: string;
      workCid: string;
    }) => {
      const client = resolveApplicationClient();
      return client.submitWork({
        contributor: contributorAddress,
        bountyId: toBountyIdBigInt(bountyId),
        workCid,
      });
    },
    onMutate: async ({ bountyId }) => {
      await qc.cancelQueries({ queryKey: bountyKeys.detail(bountyId) });
      const prev = qc.getQueryData<BountyQuery>(bountyKeys.detail(bountyId));
      if (prev?.bounty) {
        qc.setQueryData<BountyQuery>(bountyKeys.detail(bountyId), {
          ...prev,
          bounty: {
            ...prev.bounty,
            status: "UNDER_REVIEW",
            updatedAt: new Date().toISOString(),
          },
        });
      }
      return { prev, bountyId };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(bountyKeys.detail(ctx.bountyId), ctx.prev);
    },
    onSettled: (_r, _e, v) => {
      qc.invalidateQueries({ queryKey: bountyKeys.detail(v.bountyId) });
      qc.invalidateQueries({ queryKey: bountyKeys.lists() });
    },
  });
}

// ---------------------------------------------------------------------------
// Hook: approve submission (BountyRegistry.approve_submission)
// ---------------------------------------------------------------------------

export function useApproveApplicationSubmission() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bountyId,
      creatorAddress,
      points,
    }: {
      bountyId: string;
      creatorAddress: string;
      points: number;
    }) => {
      const client = resolveApplicationClient();
      return client.approveSubmission({
        creator: creatorAddress,
        bountyId: toBountyIdBigInt(bountyId),
        points,
      });
    },
    onMutate: async ({ bountyId }) => {
      await qc.cancelQueries({ queryKey: bountyKeys.detail(bountyId) });
      const prev = qc.getQueryData<BountyQuery>(bountyKeys.detail(bountyId));
      if (prev?.bounty) {
        qc.setQueryData<BountyQuery>(bountyKeys.detail(bountyId), {
          ...prev,
          bounty: {
            ...prev.bounty,
            status: "COMPLETED",
            updatedAt: new Date().toISOString(),
          },
        });
      }
      return { prev, bountyId };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(bountyKeys.detail(ctx.bountyId), ctx.prev);
    },
    onSettled: (_r, _e, v) => {
      qc.invalidateQueries({ queryKey: bountyKeys.detail(v.bountyId) });
      qc.invalidateQueries({ queryKey: bountyKeys.lists() });
    },
  });
}

// ---------------------------------------------------------------------------
// Hook: apply for slot (BountyRegistry.apply_for_slot)
// ---------------------------------------------------------------------------

export function useApplyForSlot() {
  const qc = useQueryClient();
  const { data: session } = authClient.useSession();

  return useMutation({
    mutationFn: async ({
      bountyId,
      applicantAddress,
    }: {
      bountyId: string;
      applicantAddress: string;
    }) => {
      const client = resolveApplicationClient();
      return client.applyForSlot({
        applicant: applicantAddress,
        bountyId: toBountyIdBigInt(bountyId),
      });
    },
    onMutate: async ({ bountyId }) => {
      await qc.cancelQueries({ queryKey: bountyKeys.detail(bountyId) });
      const prev = qc.getQueryData<BountyQuery & { bounty?: Partial<Bounty> }>(
        bountyKeys.detail(bountyId),
      );
      if (prev?.bounty) {
        const milestones = prev.bounty.milestones ?? MOCK_MODEL4_MILESTONES;
        const firstMilestoneId = milestones[0]?.id ?? "m1";
        const newProgress: ContributorProgress = {
          userId: session?.user?.id ?? "unknown-user",
          userName: session?.user?.name ?? "Contributor",
          userAvatarUrl:
            session?.user?.image ?? "https://github.com/shadcn.png",
          currentMilestoneId: firstMilestoneId,
        };
        const prevProgress = prev.bounty.contributorProgress ?? [];
        const updatedProgress = [...prevProgress, newProgress];
        const occupied = (prev.bounty.totalSlotsOccupied ?? 0) + 1;

        qc.setQueryData<BountyQuery & { bounty?: Partial<Bounty> }>(
          bountyKeys.detail(bountyId),
          {
            ...prev,
            bounty: {
              ...prev.bounty,
              totalSlotsOccupied: occupied,
              contributorProgress: updatedProgress,
            },
          },
        );
      }
      return { prev, bountyId };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(bountyKeys.detail(ctx.bountyId), ctx.prev);
    },
    onSettled: (_r, _e, variables) => {
      if (variables?.bountyId) {
        qc.invalidateQueries({
          queryKey: bountyKeys.detail(variables.bountyId),
        });
      }
      qc.invalidateQueries({ queryKey: bountyKeys.lists() });
    },
  });
}
type ExtendedBountyQuery = Omit<BountyQuery, "bounty"> & {
  bounty?: BountyQuery["bounty"] & Partial<Bounty>;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useBountyApplication(bountyId: string) {
  const queryClient = useQueryClient();

  const releasePayment = useMutation({
    mutationFn: async ({
      contributorId,
      milestoneId,
    }: {
      contributorId: string;
      milestoneId: string;
    }) => {
      await delay(1000);
      return { contributorId, milestoneId };
    },
    onSuccess: () => {
      // Optimistically invalidate to trigger a refresh of the escrow/bounty data
      queryClient.invalidateQueries({ queryKey: bountyKeys.detail(bountyId) });
    },
  });

  const advanceContributor = useMutation({
    mutationFn: async ({ contributorId }: { contributorId: string }) => {
      await delay(1000);
      return { contributorId };
    },
    onMutate: async ({ contributorId }) => {
      await queryClient.cancelQueries({
        queryKey: bountyKeys.detail(bountyId),
      });
      const previous = queryClient.getQueryData<ExtendedBountyQuery>(
        bountyKeys.detail(bountyId),
      );

      if (previous?.bounty) {
        const contributorProgress: ContributorProgress[] =
          previous.bounty.contributorProgress || [];
        const contributorIndex = contributorProgress.findIndex(
          (c) => c.userId === contributorId,
        );

        if (contributorIndex >= 0) {
          const milestones: Milestone[] = previous.bounty.milestones || [];
          const currentMilestoneId =
            contributorProgress[contributorIndex].currentMilestoneId;
          const milestoneIndex = milestones.findIndex(
            (m) => m.id === currentMilestoneId,
          );

          if (milestoneIndex >= 0 && milestoneIndex < milestones.length - 1) {
            const nextMilestone = milestones[milestoneIndex + 1];
            const newProgress = [...contributorProgress];
            newProgress[contributorIndex] = {
              ...newProgress[contributorIndex],
              currentMilestoneId: nextMilestone.id,
            };

            queryClient.setQueryData<ExtendedBountyQuery>(
              bountyKeys.detail(bountyId),
              {
                ...previous,
                bounty: {
                  ...previous.bounty,
                  contributorProgress: newProgress,
                },
              },
            );
          }
        }
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(bountyKeys.detail(bountyId), context.previous);
      }
    },
  });

  const removeContributor = useMutation({
    mutationFn: async ({ contributorId }: { contributorId: string }) => {
      await delay(1000);
      return { contributorId };
    },
    onMutate: async ({ contributorId }) => {
      await queryClient.cancelQueries({
        queryKey: bountyKeys.detail(bountyId),
      });
      const previous = queryClient.getQueryData<ExtendedBountyQuery>(
        bountyKeys.detail(bountyId),
      );

      if (previous?.bounty) {
        const contributorProgress: ContributorProgress[] =
          previous.bounty.contributorProgress || [];

        queryClient.setQueryData<ExtendedBountyQuery>(
          bountyKeys.detail(bountyId),
          {
            ...previous,
            bounty: {
              ...previous.bounty,
              contributorProgress: contributorProgress.filter(
                (c) => c.userId !== contributorId,
              ),
              // totalSlotsOccupied isn't explicitly in the standard schema but we'd decrement it if it exists.
            },
          },
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(bountyKeys.detail(bountyId), context.previous);
      }
    },
  });

  const sendMessage = useMutation({
    mutationFn: async ({
      contributorId,
      message,
    }: {
      contributorId: string;
      message: string;
    }) => {
      await delay(1000);
      return { contributorId, message };
    },
    // Mock success - in a real implementation we would invalidate message queries or optimistically add the message
  });

  return {
    releasePayment,
    advanceContributor,
    removeContributor,
    sendMessage,
  };
}
