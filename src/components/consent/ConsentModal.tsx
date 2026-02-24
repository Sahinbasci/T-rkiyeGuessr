"use client";

import { useCallback, useEffect, useState } from "react";
import { getConsent, setConsent, type ConsentState } from "@/utils/consent";

interface Props {
  onClose: () => void;
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  color: string;
}

function ToggleRow({ label, description, checked, disabled, onChange, color }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-gray-800 last:border-0">
      <div className="flex-1">
        <p className="text-gray-200 font-medium text-sm flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
          {label}
          {disabled && (
            <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
              Her Zaman Aktif
            </span>
          )}
        </p>
        <p className="text-gray-500 text-xs mt-1 leading-relaxed">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative shrink-0 w-11 h-6 rounded-full transition-colors
          ${checked ? "bg-red-600" : "bg-gray-700"}
          ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <span
          className={`
            absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform
            ${checked ? "translate-x-5" : "translate-x-0"}
          `}
        />
      </button>
    </div>
  );
}

export function ConsentModal({ onClose }: Props) {
  const [state, setState] = useState<ConsentState>(() => {
    const saved = getConsent();
    return saved ?? { necessary: true, analytics: false, marketing: false };
  });

  // Close on ESC
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    // Prevent background scroll
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const handleSave = () => {
    setConsent(state);
    onClose();
  };

  const handleAcceptAll = () => {
    setConsent({ necessary: true, analytics: true, marketing: true });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Cerez tercihleri"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-100">Cerez Tercihleri</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-2">
          <p className="text-gray-400 text-sm leading-relaxed py-3">
            Asagidaki kategorilerden hangi cerezlere izin vermek istediginizi
            secebilirsiniz. Zorunlu cerezler sitenin calismasi icin gereklidir
            ve kapatilamaz.
          </p>

          <ToggleRow
            label="Zorunlu Cerezler"
            description="Oturum yonetimi, Firebase kimlik dogrulama ve temel site islevleri icin gereklidir."
            checked={true}
            disabled={true}
            onChange={() => {}}
            color="bg-green-400"
          />

          <ToggleRow
            label="Analitik Cerezler"
            description="Site kullanimini anlamamiza yardimci olur. Hangi sayfalarin ziyaret edildigini ve teknik hatalari olcmek icin kullanilir."
            checked={state.analytics}
            onChange={(v) => setState((s) => ({ ...s, analytics: v }))}
            color="bg-blue-400"
          />

          <ToggleRow
            label="Reklam / Pazarlama Cerezleri"
            description="Google AdSense araciligiyla ilgi alaniniza uygun reklamlar gostermek icin kullanilir."
            checked={state.marketing}
            onChange={(v) => setState((s) => ({ ...s, marketing: v }))}
            color="bg-yellow-400"
          />
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 px-6 py-4 flex flex-col sm:flex-row gap-2 z-10">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-gray-600 text-gray-200 hover:bg-gray-800 transition-colors font-medium"
          >
            Secimlerimi Kaydet
          </button>
          <button
            type="button"
            onClick={handleAcceptAll}
            className="flex-1 px-4 py-2.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
          >
            Tumunu Kabul Et
          </button>
        </div>
      </div>
    </div>
  );
}
