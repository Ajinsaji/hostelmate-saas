import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PageHeader({
  title,
  backTo,
  onBack,
  breadcrumbs = [],
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof onBack === "function") return onBack();
    if (typeof backTo === "number") return navigate(backTo);
    if (typeof backTo === "string") return navigate(backTo);

    // default: go back in history
    navigate(-1);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mt-4 mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          {breadcrumbs?.length ? (
            <div className="flex flex-wrap items-center gap-2 text-sm text-white/60">
              {breadcrumbs.map((b, idx) => (
                <span key={`${b.label}-${idx}`} className="truncate">
                  <span className={idx === breadcrumbs.length - 1 ? "text-white/80" : "text-white/60"}>
                    {b.label}
                  </span>
                  {idx < breadcrumbs.length - 1 && <span className="mx-2">/</span>}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-2 flex items-center gap-3">
            {backTo !== undefined || typeof onBack === "function" ? (
              <button
                type="button"
                aria-label="Back"
                onClick={handleBack}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-2 text-white/90 hover:bg-white/10 transition"
              >
                <ChevronLeft size={18} />
              </button>
            ) : null}

            <h1 className="text-2xl font-bold text-white truncate">{title}</h1>
          </div>
        </div>
      </div>
    </div>
  );
}

