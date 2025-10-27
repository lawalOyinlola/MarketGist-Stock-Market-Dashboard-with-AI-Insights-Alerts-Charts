import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="size-12" />
        <p className="text-gray-400 text-sm">Loading watchlist...</p>
      </div>
    </div>
  );
}
