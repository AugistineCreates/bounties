"use client";

import { useState } from "react";
import {
  Upload,
  Link as LinkIcon,
  Send,
  MessageSquareWarning,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSubmitApplicationWork } from "@/hooks/use-bounty-application";

interface ApplicationSubmitWorkPanelProps {
  bountyId: string;
  contributorAddress: string;
  revisionFeedback?: string;
}

export function ApplicationSubmitWorkPanel({
  bountyId,
  contributorAddress,
  revisionFeedback,
}: ApplicationSubmitWorkPanelProps) {
  const [workCid, setWorkCid] = useState("");

  const { mutate: submitWork, isPending } = useSubmitApplicationWork();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workCid.trim()) return;

    submitWork({
      bountyId,
      contributorAddress,
      workCid,
    });
  };

  return (
    <Card className="border-primary/20 bg-primary/5 backdrop-blur-sm">
      <CardHeader className="border-b border-primary/10 pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Upload className="size-5 text-primary" />
          Submit Your Work
        </CardTitle>
        <CardDescription>
          Provide the deliverables for this bounty. This will move the bounty to
          &quot;In Review&quot; status.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {revisionFeedback && (
          <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <MessageSquareWarning className="size-5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-300 mb-1">
                  Revision Requested
                </p>
                <p className="text-sm text-amber-200/80 whitespace-pre-wrap leading-relaxed">
                  {revisionFeedback}
                </p>
              </div>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="work-cid">
              Deliverable IPFS CID or Link{" "}
              <span className="text-red-400">*</span>
            </Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                id="work-cid"
                placeholder="Qm..."
                value={workCid}
                onChange={(e) => setWorkCid(e.target.value)}
                className="pl-9 bg-background-card"
                required
              />
            </div>
            <p className="text-xs text-gray-500">
              Please provide the IPFS Content Identifier (CID) for your
              deliverable bundle.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!workCid.trim() || isPending}
          >
            <Send className="size-4 mr-2" />
            {isPending ? "Submitting..." : "Submit Deliverable"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
