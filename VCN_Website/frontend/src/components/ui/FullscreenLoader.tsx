interface FullscreenLoaderProps {
  label?: string;
}

export function FullscreenLoader({ label = "Ładowanie..." }: FullscreenLoaderProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-vcn-border border-t-vcn-red" />
        <p className="text-sm text-vcn-text">{label}</p>
      </div>
    </div>
  );
}
