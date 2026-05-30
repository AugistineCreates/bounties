"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useUserRole } from "@/hooks/use-user-role";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function CreateBountyPage() {
  const router = useRouter();
  const { isPending } = authClient.useSession();
  const userRole = useUserRole();

  useEffect(() => {
    // Redirect to /bounty if the user is not a sponsor
    if (!isPending && userRole !== "sponsor") {
      router.push("/bounty");
    }
  }, [userRole, isPending, router]);

  // Show nothing while checking auth or redirecting
  if (isPending || userRole !== "sponsor") {
    return null;
  }

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-8">Create a Bounty</h1>
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-amber-900">Coming Soon</CardTitle>
          </div>
          <CardDescription className="text-amber-800">
            The bounty creation form is under development
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-amber-900">
          We&apos;re building a powerful form to help you create bounties. Check
          back soon!
        </CardContent>
      </Card>
    </div>
  );
}
