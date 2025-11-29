import Skeleton from "./Skeleton";

export default function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border">
      <Skeleton className="w-40 h-5 mb-4" />
      <Skeleton className="w-full h-60" />
    </div>
  );
}
