import { Card, CardContent, CardHeader } from "@/components/ui/card";

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

export function PortfolioSkeleton() {
  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <SkeletonBlock className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <SkeletonBlock className="h-8 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <SkeletonBlock className="h-5 w-24" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </>
  );
}
