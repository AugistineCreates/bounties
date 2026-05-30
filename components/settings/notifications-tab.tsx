"use client";

import { Fragment, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import {
  useNotifications,
  type NotificationItem,
  type NotificationType,
} from "@/hooks/use-notifications";
import { authClient } from "@/lib/auth-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NotificationPrefs {
  newBounty: { inApp: boolean; email: boolean };
  applicationUpdate: { inApp: boolean; email: boolean };
  bountyCompleted: { inApp: boolean; email: boolean };
  mentions: { inApp: boolean; email: boolean };
  digestCadence: "off" | "daily" | "weekly";
}

const defaultPrefs: NotificationPrefs = {
  newBounty: { inApp: true, email: false },
  applicationUpdate: { inApp: true, email: true },
  bountyCompleted: { inApp: true, email: true },
  mentions: { inApp: true, email: false },
  digestCadence: "off",
};

const STORAGE_KEY = "notification-prefs";

function loadPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return defaultPrefs;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as NotificationPrefs) : defaultPrefs;
  } catch {
    return defaultPrefs;
  }
}

const eventLabels: Record<
  keyof Omit<NotificationPrefs, "digestCadence">,
  string
> = {
  newBounty: "New bounties posted",
  applicationUpdate: "Application status updates",
  bountyCompleted: "Bounty completed",
  mentions: "Mentions and replies",
};

const TYPE_TO_GROUP: Record<
  NotificationType,
  "newBounty" | "applicationUpdate" | "bountyCompleted" | "mentions" | null
> = {
  "new-application": "applicationUpdate",
  "submission-reviewed": "applicationUpdate",
  "bounty-updated": "newBounty",
  "saved-bounty-updated": "applicationUpdate",
};

function categorizeNotification(item: NotificationItem) {
  return TYPE_TO_GROUP[item.type] ?? null;
}

export function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(loadPrefs);
  const [isPending, setIsPending] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data: session } = authClient.useSession();
  const { notifications } = useNotifications();

  const userName = session?.user?.name || "Contributor";
  const userEmail = session?.user?.email || "contributor@example.com";
  const cadenceLabel = prefs.digestCadence === "daily" ? "Daily" : "Weekly";
  const subtitle =
    prefs.digestCadence === "weekly"
      ? "Sent every Monday at 9am"
      : "Sent every morning at 9am";

  const groupedNotifications = {
    newBounty: [] as NotificationItem[],
    applicationUpdate: [] as NotificationItem[],
    bountyCompleted: [] as NotificationItem[],
    mentions: [] as NotificationItem[],
  };

  notifications.forEach((item) => {
    const category = categorizeNotification(item);
    if (category) {
      groupedNotifications[category].push(item);
    }
  });

  const GROUPS = [
    { key: "newBounty", title: "New Bounties" },
    { key: "applicationUpdate", title: "Application Updates" },
    { key: "bountyCompleted", title: "Bounty Completed" },
    { key: "mentions", title: "Mentions" },
  ] as const;

  const hasItems = GROUPS.some(
    (group) => groupedNotifications[group.key].length > 0,
  );

  const toggleChannel = (
    event: keyof Omit<NotificationPrefs, "digestCadence">,
    channel: "inApp" | "email",
  ) => {
    setPrefs((prev) => ({
      ...prev,
      [event]: { ...prev[event], [channel]: !prev[event][channel] },
    }));
  };

  const handleSave = async () => {
    setIsPending(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      toast.success("Notification preferences saved.");
    } catch {
      toast.error("Failed to save notification preferences.");
    } finally {
      setIsPending(false);
    }
  };

  const eventKeys = Object.keys(eventLabels) as Array<keyof typeof eventLabels>;

  return (
    <div className="space-y-6">
      <div>
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 gap-y-4">
          <div />
          <span className="text-sm font-medium text-muted-foreground text-center">
            In-app
          </span>
          <span className="text-sm font-medium text-muted-foreground text-center">
            Email
          </span>

          {eventKeys.map((key) => (
            <Fragment key={key}>
              <Label className="text-sm">{eventLabels[key]}</Label>
              <div className="flex justify-center">
                <Switch
                  checked={prefs[key].inApp}
                  onCheckedChange={() => toggleChannel(key, "inApp")}
                  aria-label={`${eventLabels[key]} in-app notification`}
                />
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={prefs[key].email}
                  onCheckedChange={() => toggleChannel(key, "email")}
                  aria-label={`${eventLabels[key]} email notification`}
                />
              </div>
            </Fragment>
          ))}
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>Email digest</Label>
          <p className="text-sm text-muted-foreground">
            Receive a summary of activity at your chosen cadence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={prefs.digestCadence}
            onValueChange={(value: NotificationPrefs["digestCadence"]) =>
              setPrefs((prev) => ({ ...prev, digestCadence: value }))
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">Off</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={prefs.digestCadence === "off"}
            onClick={() => setIsPreviewOpen(true)}
          >
            Preview
          </Button>
        </div>
      </div>

      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Preferences"
        )}
      </Button>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="pb-2">
            <DialogTitle>Email Digest Preview</DialogTitle>
            <DialogDescription>
              A preview of how your {prefs.digestCadence} activity digest will
              look when delivered to your inbox.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden border rounded-lg bg-card text-card-foreground shadow-sm flex flex-col">
            {/* Email Client Header Chrome */}
            <div className="bg-muted px-4 py-2.5 border-b flex items-center justify-between text-xs text-muted-foreground select-none">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/40" />
              </div>
              <div className="font-medium">digest-preview.eml</div>
              <div className="w-12" /> {/* spacer */}
            </div>

            {/* Email Headers (To, From, Subject) */}
            <div className="p-4 border-b space-y-1.5 text-xs bg-muted/30">
              <div>
                <span className="font-semibold text-muted-foreground mr-1">
                  From:
                </span>{" "}
                <span className="text-foreground">
                  Boundless Bounties &lt;digest@bounties.boundless.fi&gt;
                </span>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground mr-1">
                  To:
                </span>{" "}
                <span className="text-foreground">
                  {userName} &lt;{userEmail}&gt;
                </span>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground mr-1">
                  Subject:
                </span>{" "}
                <span className="font-semibold text-foreground">
                  {cadenceLabel} Activity Digest — boundlessfi/bounties
                </span>
              </div>
            </div>

            {/* Email Body */}
            <div className="p-6 overflow-y-auto space-y-6 bg-background font-sans flex-1 text-sm">
              {/* Brand Header */}
              <div className="flex items-center justify-between border-b pb-4">
                <div className="space-y-1">
                  <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs">
                      B
                    </span>
                    Boundless Bounties
                  </h2>
                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize">
                    {prefs.digestCadence} Digest
                  </span>
                </div>
              </div>

              {/* Greeting */}
              <div className="space-y-1 text-foreground">
                <p className="font-semibold">Hi {userName},</p>
                <p className="text-muted-foreground">
                  Here is your summary of activity for{" "}
                  <strong className="text-foreground">
                    boundlessfi/bounties
                  </strong>
                  .
                </p>
              </div>

              {/* Digest Content Sections */}
              <div className="space-y-6">
                {hasItems ? (
                  GROUPS.map((group) => {
                    const items = groupedNotifications[group.key].slice(0, 3);
                    if (items.length === 0) return null;
                    return (
                      <div key={group.key} className="space-y-3">
                        <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b pb-1">
                          {group.title}
                        </h3>
                        <div className="space-y-2.5">
                          {items.map((item) => {
                            let relativeTime = "";
                            try {
                              relativeTime = formatDistanceToNow(
                                new Date(item.timestamp),
                                { addSuffix: true },
                              );
                            } catch {
                              relativeTime = "";
                            }
                            return (
                              <div
                                key={item.id}
                                className="flex items-start justify-between gap-4 py-1 text-xs"
                              >
                                <p className="text-foreground leading-relaxed flex-1">
                                  {item.message}
                                </p>
                                {relativeTime && (
                                  <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                                    {relativeTime}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-xs text-muted-foreground border border-dashed rounded-lg flex flex-col items-center justify-center gap-2">
                    <span className="font-semibold">No recent activity</span>
                    <span className="text-[10px]">
                      No notifications exist in your cache to populate this
                      preview.
                    </span>
                  </div>
                )}
              </div>

              {/* Email Footer */}
              <div className="border-t pt-4 text-center text-xs text-muted-foreground space-y-1">
                <p>
                  You are receiving this email because you opted in to the{" "}
                  {prefs.digestCadence} digest.
                </p>
                <p className="hover:underline cursor-pointer">
                  Manage notifications in your account settings
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
