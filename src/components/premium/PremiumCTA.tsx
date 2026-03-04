"use client";

import { PREMIUM_ENABLED } from "@/config/premium";
import { trackPremiumCtaClick } from "@/services/analytics";

interface Props {
  /** Where this CTA is rendered — used in analytics */
  location?: string;
  /** Extra wrapper className */
  className?: string;
}

/**
 * Premium upsell CTA for lobby / game-over screens.
 *
 * Hidden when:
 *  - PREMIUM_ENABLED is true (user already has premium)
 *  - Feature flag not present (pre-launch)
 *
 * Currently shows a teaser banner. No payment flow yet.
 */
export function PremiumCTA({ location = "lobby", className = "" }: Props) {
  // Don't show if user is already premium
  if (PREMIUM_ENABLED) return null;

  const handleClick = () => {
    trackPremiumCtaClick({ location });
  };

  return (
    <div
      className={`rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-4 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0 text-2xl" role="img" aria-label="Premium">
          &#9733;
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-amber-200 font-medium text-sm">
            Reklamsiz Oyna
          </p>
          <p className="text-gray-400 text-xs mt-0.5">
            Premium ile reklamsiz, kesintisiz oyun deneyimi.
          </p>
        </div>
        <button
          type="button"
          onClick={handleClick}
          className="shrink-0 px-4 py-2 text-xs font-medium rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
        >
          Yakinda
        </button>
      </div>
    </div>
  );
}
