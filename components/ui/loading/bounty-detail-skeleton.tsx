import { Skeleton } from "@/components/ui/skeleton";

export function BountyDetailSkeleton() {
  return (
    <div className="min-h-screen text-foreground pb-20 relative overflow-hidden">
      <div className="fixed top-0 left-0 w-full h-125 bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />
      <div className="container mx-auto px-4 py-10 relative z-10">
        <Skeleton className="h-4 w-36 mb-8" />
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 space-y-6">
            <div className="p-6 rounded-xl border border-gray-800 bg-background-card space-y-5">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-11 w-56 rounded-lg" />
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    className={`h-5 ${i % 3 === 0 ? "w-2/3" : "w-full"}`}
                  />
                ))}
              </div>
            </div>
            <div className="p-6 rounded-xl border border-gray-800 bg-background-card space-y-3">
              <Skeleton className="h-3 w-20 mb-5" />
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton
                  key={i}
                  className={i % 3 === 0 ? "h-4 w-2/3" : "h-4 w-full"}
                />
              ))}
            </div>
          </div>
          <div className="w-full lg:w-72 shrink-0">
            <div className="p-5 rounded-xl border border-gray-800 bg-background-card space-y-5">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-8 w-20" />
              </div>
              <Skeleton className="h-px" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
              <Skeleton className="h-px" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
