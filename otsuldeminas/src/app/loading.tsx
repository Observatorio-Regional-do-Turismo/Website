import { CarouselSectionSkeleton, PageHeroSkeleton } from "@/components/LoadingSkeletons";

export default function Loading() {
  return (
    <div className="w-full min-h-screen bg-slate-50">
      <PageHeroSkeleton />
      <CarouselSectionSkeleton titleWidth="w-64" />
      <CarouselSectionSkeleton titleWidth="w-56" />
    </div>
  );
}
