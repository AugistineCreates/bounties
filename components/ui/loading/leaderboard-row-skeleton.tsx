import { Skeleton } from "@/components/ui/skeleton";

export function LeaderboardRowSkeleton() {
  return (
    <div className="flex items-center h-16 px-4 border-b border-border/60">
      <div className="w-[80px] flex justify-center">
        <Skeleton className="h-4 w-6" />
      </div>
      <div className="flex-1 flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex flex-col">
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="w-24 hidden md:block">
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="w-24 text-right">
        <Skeleton className="h-4 w-16 ml-auto" />
      </div>
      <div className="w-24 text-right hidden sm:block">
        <Skeleton className="h-4 w-12 ml-auto" />
      </div>
      <div className="w-24 text-right hidden lg:block">
        <Skeleton className="h-4 w-16 ml-auto" />
      </div>
      <div className="w-20 text-right">
        <Skeleton className="h-4 w-10 ml-auto" />
      </div>
    </div>
  );
}

export function LeaderboardTableSkeleton() {
  return (
    <div className="rounded-md border border-border/50 overflow-hidden bg-background-card">
      <div className="border-b border-border">
        <div className="flex">
          <div className="w-[80px] text-center font-bold text-foreground py-3">
            <Skeleton className="h-3 w-8 mx-auto" />
          </div>
          <div className="flex-1 font-bold text-foreground py-3">
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="w-24 hidden md:block font-bold text-foreground py-3">
            <Skeleton className="h-3 w-8" />
          </div>
          <div className="w-24 text-right font-bold text-foreground py-3">
            <Skeleton className="h-3 w-8 ml-auto" />
          </div>
          <div className="w-24 text-right hidden sm:block font-bold text-foreground py-3">
            <Skeleton className="h-3 w-10 ml-auto" />
          </div>
          <div className="w-24 text-right hidden lg:block font-bold text-foreground py-3">
            <Skeleton className="h-3 w-10 ml-auto" />
          </div>
          <div className="w-20 text-right font-bold text-foreground py-3">
            <Skeleton className="h-3 w-8 ml-auto" />
          </div>
        </div>
      </div>
      {[...Array(5)].map((_, i) => (
        <LeaderboardRowSkeleton key={i} />
      ))}
    </div>
  );
}
