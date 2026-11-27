import { Skeleton } from "@/components/ui/skeleton";

export function PageHeroSkeleton() {
  return (
    <div className="w-full bg-gradient-to-br from-[#1D5C1B] via-[#287524] to-[#1D5C1B] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
        <Skeleton className="h-6 w-40 rounded-full bg-white/20" />
        <Skeleton className="h-10 w-72 sm:w-96 rounded-xl bg-white/25" />
        <Skeleton className="h-4 w-full max-w-xl rounded-lg bg-white/15" />
      </div>
    </div>
  );
}

export function FilterBarSkeleton({ columns = 3 }: { columns?: number }) {
  const gridCols =
    columns >= 5
      ? "sm:grid-cols-2 xl:grid-cols-5"
      : columns === 4
        ? "sm:grid-cols-2 xl:grid-cols-4"
        : columns === 2
          ? "sm:grid-cols-2"
          : "sm:grid-cols-2 xl:grid-cols-3";

  return (
    <div className="sticky top-16 z-30 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        <div className={`grid w-full flex-1 grid-cols-1 ${gridCols} gap-3`}>
          {Array.from({ length: columns }).map((_, idx) => (
            <Skeleton key={idx} className="h-10 w-full rounded-lg bg-[#EAF4E9]" />
          ))}
        </div>
        <Skeleton className="h-8 w-28 rounded-full bg-[#EAF4E9] shrink-0" />
      </div>
    </div>
  );
}

export function StandardCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="relative aspect-[16/10] w-full bg-[#EAF4E9]/80 overflow-hidden">
        <Skeleton className="h-full w-full rounded-none bg-[#EAF4E9]" />
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
          <Skeleton className="h-5 w-20 rounded-full bg-white/70" />
          <Skeleton className="h-5 w-16 rounded-full bg-white/70" />
        </div>
        <div className="absolute bottom-2.5 left-2.5">
          <Skeleton className="h-5 w-28 rounded-full bg-white/70" />
        </div>
      </div>
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
        <div className="space-y-2">
          <Skeleton className="h-5 w-4/5 rounded-md bg-slate-200/80" />
          <Skeleton className="h-3.5 w-full rounded bg-[#EAF4E9]" />
          <Skeleton className="h-3.5 w-2/3 rounded bg-[#EAF4E9]" />
        </div>
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <Skeleton className="h-3.5 w-20 rounded bg-[#EAF4E9]" />
          <Skeleton className="h-3.5 w-24 rounded bg-[#EAF4E9]" />
        </div>
      </div>
    </div>
  );
}

export function StandardCardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando itens"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <StandardCardSkeleton key={idx} />
      ))}
    </div>
  );
}

export function CarouselSectionSkeleton({ titleWidth = "w-56" }: { titleWidth?: string }) {
  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-36 rounded-full bg-[#EAF4E9]" />
          <Skeleton className={`h-8 ${titleWidth} rounded-lg bg-slate-200/80`} />
          <Skeleton className="h-4 w-72 rounded bg-[#EAF4E9]" />
        </div>
        <Skeleton className="h-5 w-36 rounded bg-[#EAF4E9]" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, idx) => (
          <StandardCardSkeleton key={idx} />
        ))}
      </div>
    </div>
  );
}

export function CatalogPageSkeleton({
  filterColumns = 3,
  cardCount = 8,
}: {
  filterColumns?: number;
  cardCount?: number;
}) {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <PageHeroSkeleton />
      <FilterBarSkeleton columns={filterColumns} />
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10 flex-1 space-y-8">
        <StandardCardGridSkeleton count={cardCount} />
      </section>
    </main>
  );
}

export function MapPageSkeleton() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <PageHeroSkeleton />
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-24 rounded-2xl bg-white border border-slate-200" />
          ))}
        </div>
        <Skeleton className="h-[520px] w-full rounded-3xl bg-[#EAF4E9] border border-slate-200" />
      </section>
    </main>
  );
}

export function DetailPageSkeleton() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <PageHeroSkeleton />
      <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Skeleton className="h-72 sm:h-96 w-full rounded-3xl bg-[#EAF4E9]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-8 w-2/3 rounded-lg bg-slate-200/80" />
            <Skeleton className="h-4 w-full rounded bg-[#EAF4E9]" />
            <Skeleton className="h-4 w-full rounded bg-[#EAF4E9]" />
            <Skeleton className="h-4 w-3/4 rounded bg-[#EAF4E9]" />
          </div>
          <Skeleton className="h-56 w-full rounded-2xl bg-white border border-slate-200" />
        </div>
      </section>
    </main>
  );
}

export function DashboardPageSkeleton() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <PageHeroSkeleton />
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-28 rounded-2xl bg-white border border-slate-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl bg-white border border-slate-200" />
          <Skeleton className="h-80 rounded-2xl bg-white border border-slate-200" />
        </div>
      </section>
    </main>
  );
}

export function AdminPortalSkeleton() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <PageHeroSkeleton />
      <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Skeleton className="h-28 w-full rounded-2xl bg-[#1D5C1B]/20" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-10 w-36 rounded-xl bg-white border border-slate-200" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96 rounded-2xl bg-white border border-slate-200" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-24 rounded-2xl bg-white border border-slate-200" />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
