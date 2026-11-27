import { CatalogPageSkeleton } from "@/components/LoadingSkeletons";

export default function SelosLoading() {
  return <CatalogPageSkeleton filterColumns={2} cardCount={8} />;
}
