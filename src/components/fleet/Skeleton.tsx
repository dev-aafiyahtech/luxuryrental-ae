import clsx from "clsx";

// Fallbacks for the fleet routes while `params` resolve on a client navigation. Direct visits
// get the fully prerendered page (every param is listed in generateStaticParams), so these are
// only seen briefly in the browser. Static under reduced motion.

const block = "rounded-[16px] bg-card motion-safe:animate-pulse";

export function FleetSkeleton({ variant }: { variant: "car" | "list" }) {
  return (
    <div className="container-site pb-36" aria-busy="true">
      <div className="pt-8 md:pt-10">
        <div className={clsx(block, "h-4 w-48 rounded-full")} />
      </div>
      {variant === "car" ? (
        <div className="mt-6 grid gap-x-10 gap-y-10 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="grid content-start gap-6">
            <div className={clsx(block, "aspect-video w-full rounded-[24px]")} />
            <div className={clsx(block, "h-10 w-3/4")} />
            <div className={clsx(block, "h-6 w-1/2")} />
            <div className={clsx(block, "h-20 w-full")} />
          </div>
          <div className={clsx(block, "h-[420px] rounded-[24px]")} />
        </div>
      ) : (
        <div className="mt-8 grid gap-8">
          <div className="grid gap-4">
            <div className={clsx(block, "h-12 w-2/3")} />
            <div className={clsx(block, "h-5 w-full max-w-[60ch]")} />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className={clsx(block, "aspect-[4/3]")} />
            <div className={clsx(block, "aspect-[4/3]")} />
          </div>
        </div>
      )}
    </div>
  );
}
