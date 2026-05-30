import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bountyKeys } from "@/lib/query/query-keys";
import { BountyQuery } from "@/lib/graphql/generated";

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
      const previous = queryClient.getQueryData<BountyQuery>(
        bountyKeys.detail(bountyId),
      );

      if (previous?.bounty) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const contributorProgress =
          (previous.bounty as any).contributorProgress || [];
        const contributorIndex = contributorProgress.findIndex(
          (c) => c.userId === contributorId,
        );

        if (contributorIndex >= 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const milestones = (previous.bounty as any).milestones || [];
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

            queryClient.setQueryData<BountyQuery>(bountyKeys.detail(bountyId), {
              ...previous,
              bounty: {
                ...previous.bounty,
                contributorProgress: newProgress,
              },
            });
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
      const previous = queryClient.getQueryData<BountyQuery>(
        bountyKeys.detail(bountyId),
      );

      if (previous?.bounty) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const contributorProgress =
          (previous.bounty as any).contributorProgress || [];

        queryClient.setQueryData<BountyQuery>(bountyKeys.detail(bountyId), {
          ...previous,
          bounty: {
            ...previous.bounty,
            contributorProgress: contributorProgress.filter(
              (c) => c.userId !== contributorId,
            ),
            // totalSlotsOccupied isn't explicitly in the standard schema but we'd decrement it if it exists.
          },
        });
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
