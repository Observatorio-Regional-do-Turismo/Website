import { CatalogPageSkeleton } from "@/components/LoadingSkeletons";

export default function EventosLoading() {
  return <CatalogPageSkeleton filterColumns={3} cardCount={8} />;
}
