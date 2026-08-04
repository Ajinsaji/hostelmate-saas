import { Loader2 } from "lucide-react";

export default function PageLoader() {
  return (
    <div className="min-h-screen w-full bg-[#0B1120] flex flex-col items-center justify-center gap-4 text-white font-sans">
      <div className="relative flex items-center justify-center">
        {/* Subtle glowing backdrop pulse */}
        <div className="absolute w-16 h-16 bg-[#16A34A]/20 rounded-full blur-xl animate-pulse" />
        <Loader2 className="h-10 w-10 animate-spin text-[#16A34A] relative z-10" />
      </div>
      <p className="text-[#CBD5E1] text-sm font-medium tracking-wide animate-pulse">
        Verifying session...
      </p>
    </div>
  );
}

export function LoadingSpinner({ size = 20, className = "" }) {
  return (
    <Loader2 
      className={`animate-spin text-[#16A34A] ${className}`} 
      style={{ width: size, height: size }} 
    />
  );
}
