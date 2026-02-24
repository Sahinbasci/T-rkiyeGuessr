"use client";

import { useEffect, useState } from "react";
import { hasConsented, acceptAll, rejectOptional } from "@/utils/consent";
import { ConsentModal } from "./ConsentModal";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Small delay so SSR hydration finishes
    const t = setTimeout(() => {
      if (!hasConsented()) setVisible(true);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  // Listen for footer "Çerez Tercihleri" button
  useEffect(() => {
    const handler = () => setShowModal(true);
    const btn = document.getElementById("open-cookie-preferences");
    btn?.addEventListener("click", handler);

    // Also listen for custom event (for programmatic open)
    window.addEventListener("open-consent-modal", handler);

    return () => {
      btn?.removeEventListener("click", handler);
      window.removeEventListener("open-consent-modal", handler);
    };
  }, []);

  const handleAcceptAll = () => {
    acceptAll();
    setVisible(false);
  };

  const handleRejectOptional = () => {
    rejectOptional();
    setVisible(false);
  };

  const handleOpenPreferences = () => {
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    // If consent was set via modal, hide banner too
    if (hasConsented()) setVisible(false);
  };

  return (
    <>
      {/* Banner */}
      {visible && (
        <div
          role="dialog"
          aria-label="Çerez bildirimi"
          className="fixed bottom-0 left-0 right-0 z-[99999] animate-slideUp"
        >
          <div className="bg-gray-900/95 backdrop-blur-md border-t border-gray-700 px-4 py-4 sm:px-6">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <p className="text-gray-300 text-sm leading-relaxed flex-1">
                Sitemizde zorunlu cerezler, analitik ve reklam cerezleri
                kullaniyoruz. Detayli bilgi icin{" "}
                <a
                  href="/cerez-politikasi"
                  className="text-red-400 hover:underline"
                >
                  Cerez Politikamizi
                </a>{" "}
                inceleyebilirsiniz.
              </p>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleOpenPreferences}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  Tercihleri Yonet
                </button>
                <button
                  type="button"
                  onClick={handleRejectOptional}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  Sadece Zorunlu
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
                >
                  Tumunu Kabul Et
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && <ConsentModal onClose={handleModalClose} />}
    </>
  );
}
