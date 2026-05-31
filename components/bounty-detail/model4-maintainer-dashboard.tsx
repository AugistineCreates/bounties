"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Milestone, ContributorProgress } from "@/types/bounty";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  useReleasePayment,
  useAdvanceContributor,
  useRemoveContributor,
  useSendMessage,
} from "@/hooks/use-bounty-application";
import {
  ChevronRight,
  UserMinus,
  Loader2,
  MessageSquare,
  Coins,
  ArrowRight,
  Trophy,
} from "lucide-react";

interface Model4MaintainerDashboardProps {
  bountyId: string;
  milestones: Milestone[];
  contributors: ContributorProgress[];
  maxSlots?: number;
  className?: string;
}

export function Model4MaintainerDashboard({
  bountyId,
  milestones,
  contributors: initialContributors,
  maxSlots = 5,
  className,
}: Model4MaintainerDashboardProps) {
  const releasePayment = useReleasePayment(bountyId);
  const advanceContributor = useAdvanceContributor(bountyId);
  const removeContributor = useRemoveContributor(bountyId);
  const sendMessage = useSendMessage(bountyId);

  const [selectedContributor, setSelectedContributor] =
    React.useState<ContributorProgress | null>(null);
  const [isSubmissionsOpen, setIsSubmissionsOpen] = React.useState(false);
  const [isMessageOpen, setIsMessageOpen] = React.useState(false);
  const [messageText, setMessageText] = React.useState("");

  const handleReleasePayment = (contributor: ContributorProgress) => {
    releasePayment.mutate(
      {
        contributorId: contributor.userId,
        milestoneId: contributor.currentMilestoneId,
      },
      {
        onSuccess: () =>
          toast.success(`Payment released for ${contributor.userName}`),
      },
    );
  };

  const handleAdvance = (contributor: ContributorProgress) => {
    advanceContributor.mutate(
      { contributorId: contributor.userId },
      {
        onSuccess: () =>
          toast.success(`${contributor.userName} advanced to next milestone`),
      },
    );
  };

  const handleRemove = (contributor: ContributorProgress) => {
    removeContributor.mutate(
      { contributorId: contributor.userId },
      {
        onSuccess: () =>
          toast.success(`${contributor.userName} removed from bounty`),
      },
    );
  };

  const handleOpenSubmissions = (contributor: ContributorProgress) => {
    setSelectedContributor(contributor);
    setIsSubmissionsOpen(true);
  };

  const handleOpenMessage = (contributor: ContributorProgress) => {
    setSelectedContributor(contributor);
    setMessageText("");
    setIsMessageOpen(true);
  };

  const handleSendMessage = () => {
    if (!selectedContributor || !messageText.trim()) return;
    sendMessage.mutate(
      { contributorId: selectedContributor.userId, message: messageText },
      {
        onSuccess: () => {
          toast.success(`Message sent to ${selectedContributor.userName}`);
          setIsMessageOpen(false);
        },
      },
    );
  };

  return (
    <Card
      className={cn(
        "border-gray-800 bg-background-card/50 backdrop-blur-sm",
        className,
      )}
    >
      <CardHeader className="border-b border-gray-800/50 pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          Maintainer Dashboard
          <span className="text-xs font-normal text-muted-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            Model 4 Management
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-800/50">
          {initialContributors.map((contributor) => {
            const currentMilestone = milestones.find(
              (m) => m.id === contributor.currentMilestoneId,
            );
            const currentMilestoneIndex = milestones.findIndex(
              (m) => m.id === contributor.currentMilestoneId,
            );
            const progressPercentage =
              milestones.length === 0
                ? 0
                : Math.max(
                    0,
                    Math.min(
                      100,
                      ((currentMilestoneIndex + 1) / milestones.length) * 100,
                    ),
                  );

            return (
              <div
                key={contributor.userId}
                className="p-4 hover:bg-white/[0.02] transition-colors group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Contributor Info */}
                  <div className="flex items-center gap-4 min-w-0">
                    <Avatar className="size-10 border border-gray-700">
                      <AvatarImage src={contributor.userAvatarUrl} />
                      <AvatarFallback>
                        {contributor.userName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h5 className="text-sm font-bold text-gray-100 truncate">
                        {contributor.userName}
                      </h5>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-500 uppercase font-semibold">
                          Current:
                        </span>
                        <span className="text-xs text-primary font-medium">
                          {currentMilestone?.title}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Stats */}
                  <div className="flex-1 max-w-xs hidden lg:block">
                    <div className="flex items-center justify-between text-[10px] mb-1.5">
                      <span className="text-gray-500 font-bold uppercase tracking-tighter">
                        Progress
                      </span>
                      <span className="text-gray-300">
                        {Math.round(progressPercentage)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary shadow-[0_0_5px_rgba(167,249,80,0.2)] transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-gray-400 hover:text-white"
                            onClick={() => handleOpenMessage(contributor)}
                          >
                            <MessageSquare className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Send Message</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs border-gray-700 hover:bg-gray-800"
                            onClick={() => handleOpenSubmissions(contributor)}
                          >
                            View Submissions
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Review work</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 font-bold"
                            onClick={() => handleReleasePayment(contributor)}
                            disabled={
                              releasePayment.isPending &&
                              releasePayment.variables?.contributorId ===
                                contributor.userId
                            }
                          >
                            {releasePayment.isPending &&
                            releasePayment.variables?.contributorId ===
                              contributor.userId ? (
                              <Loader2 className="size-3 mr-1.5 animate-spin" />
                            ) : (
                              <Coins className="size-3 mr-1.5" />
                            )}
                            Release Payment
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Pay for milestone</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 text-xs font-bold"
                            onClick={() => handleAdvance(contributor)}
                            disabled={
                              advanceContributor.isPending &&
                              advanceContributor.variables?.contributorId ===
                                contributor.userId
                            }
                          >
                            {advanceContributor.isPending &&
                            advanceContributor.variables?.contributorId ===
                              contributor.userId ? (
                              <Loader2 className="size-3 mr-1.5 animate-spin" />
                            ) : (
                              <>
                                Advance <ArrowRight className="size-3 ml-1.5" />
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Move to next milestone</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-red-400/50 hover:text-red-400 hover:bg-red-400/10"
                            onClick={() => handleRemove(contributor)}
                            disabled={
                              removeContributor.isPending &&
                              removeContributor.variables?.contributorId ===
                                contributor.userId
                            }
                          >
                            {removeContributor.isPending &&
                            removeContributor.variables?.contributorId ===
                              contributor.userId ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <UserMinus className="size-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remove from slot</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-primary/5 border-t border-gray-800/50 flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
            <Trophy className="size-3 text-yellow-500" />
            <span>
              Total Winners Allowed: {initialContributors.length} / {maxSlots}
            </span>
          </div>
          <div className="h-3 w-px bg-gray-800" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="link"
                    className="text-[10px] h-auto p-0 text-primary"
                    disabled
                  >
                    View All Applications [Coming soon]{" "}
                    <ChevronRight className="size-3" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Coming soon</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Modals */}
        <Dialog open={isSubmissionsOpen} onOpenChange={setIsSubmissionsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Submissions for {selectedContributor?.userName}
              </DialogTitle>
              <DialogDescription>
                Review the submitted work from this contributor.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 text-center text-gray-400">
              No submissions found for this contributor.
            </div>
            <DialogFooter>
              <Button onClick={() => setIsSubmissionsOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Message {selectedContributor?.userName}</DialogTitle>
              <DialogDescription>
                Send a message directly to this contributor regarding their
                application.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="Type your message here..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMessageOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={sendMessage.isPending || !messageText.trim()}
              >
                {sendMessage.isPending && (
                  <Loader2 className="size-3 mr-1.5 animate-spin" />
                )}
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
