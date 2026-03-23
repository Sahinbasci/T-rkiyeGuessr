"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/nasil-oynanir", label: "Nasıl Oynanır" },
  { href: "/bolgeler", label: "Bölgeler" },
  { href: "/sehirler", label: "Şehirler" },
  { href: "/blog", label: "Blog" },
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/iletisim", label: "İletişim" },
];

export function MobileMenuToggle() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-2 text-gray-400 hover:text-white transition-colors"
        aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
        aria-expanded={open}
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>
      {open && (
        <div className="sm:hidden absolute left-0 right-0 top-full bg-[#0a0a0f] border-b border-gray-800 px-4 pb-3 pt-3">
          <div className="flex flex-col gap-2 max-w-5xl mx-auto">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-400 hover:text-white text-sm py-2 px-2 rounded-lg hover:bg-gray-800/50 transition-colors"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
