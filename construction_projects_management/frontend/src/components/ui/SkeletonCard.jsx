import Skeleton from "./Skeleton";

export default function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border">
      <Skeleton className="w-20 h-5 mb-4" />
      <Skeleton className="w-32 h-10 mb-2" />
      <Skeleton className="w-24 h-4" />
    </div>
  );
}
