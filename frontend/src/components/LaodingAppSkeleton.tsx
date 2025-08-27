import { Skeleton, Card } from "@heroui/react";

export default function LoadingAppSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        {/* Sidebar skeleton */}
        <aside className="hidden md:block w-64 border-r border-divider p-4 space-y-3">
          <Skeleton className="h-10 w-40 rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-5/6 rounded-lg" />
          <Skeleton className="h-9 w-4/5 rounded-lg" />
        </aside>

        {/* Main area skeleton */}
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <div className="flex gap-3">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>

          <Card className="p-4 space-y-3">
            <Skeleton className="h-6 w-1/3 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-5/6 rounded-lg" />
            <Skeleton className="h-4 w-2/3 rounded-lg" />
          </Card>
        </main>
      </div>
    </div>
  );
}
