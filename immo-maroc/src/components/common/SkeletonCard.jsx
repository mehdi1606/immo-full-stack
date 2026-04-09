export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-100 animate-pulse">
      {/* Image */}
      <div className="h-52 bg-neutral-200" />
      <div className="p-4 space-y-3">
        {/* Badges */}
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-neutral-200 rounded-full" />
          <div className="h-5 w-20 bg-neutral-200 rounded-full" />
        </div>
        {/* Title */}
        <div className="h-4 bg-neutral-200 rounded w-3/4" />
        <div className="h-4 bg-neutral-200 rounded w-1/2" />
        {/* Location */}
        <div className="h-3 bg-neutral-100 rounded w-2/5" />
        {/* Stats */}
        <div className="flex gap-3 pt-1">
          <div className="h-3 w-10 bg-neutral-100 rounded" />
          <div className="h-3 w-10 bg-neutral-100 rounded" />
          <div className="h-3 w-12 bg-neutral-100 rounded" />
        </div>
        {/* Price row */}
        <div className="flex justify-between items-center pt-2 border-t border-neutral-50">
          <div className="h-5 w-28 bg-neutral-200 rounded" />
          <div className="h-8 w-20 bg-neutral-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
