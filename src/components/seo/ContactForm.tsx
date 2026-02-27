"use client";

import { useState } from "react";

const CATEGORIES = [
  { value: "soru", label: "Genel Soru" },
  { value: "hata", label: "Hata Bildirimi" },
  { value: "oneri", label: "Öneri" },
  { value: "isbirligi", label: "İş Birliği" },
  { value: "kvkk", label: "KVKK Talebi" },
  { value: "diger", label: "Diğer" },
];

export function ContactForm() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = data.get("name") as string;
    const category = data.get("category") as string;
    const message = data.get("message") as string;

    const categoryLabel = CATEGORIES.find((c) => c.value === category)?.label ?? category;
    const subject = encodeURIComponent(`[${categoryLabel}] TürkiyeGuessr İletişim — ${name}`);
    const body = encodeURIComponent(`Gönderen: ${name}\nKategori: ${categoryLabel}\n\n${message}`);

    window.location.href = `mailto:sahinbasci2002@gmail.com?subject=${subject}&body=${body}`;
    setSent(true);
  }

  if (sent) {
    return (
      <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-6 text-center">
        <p className="text-green-400 font-medium">E-posta uygulamanız açıldı!</p>
        <p className="text-gray-400 text-sm mt-2">
          E-posta uygulamanız açılmadıysa doğrudan{" "}
          <a href="mailto:sahinbasci2002@gmail.com" className="text-red-400 hover:underline">
            sahinbasci2002@gmail.com
          </a>{" "}
          adresine e-posta gönderebilirsiniz.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-4 text-sm text-gray-500 hover:text-white underline transition-colors"
        >
          Yeni mesaj gönder
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium text-gray-300 mb-1">
          Adınız <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="contact-name"
          name="name"
          required
          maxLength={100}
          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-colors"
          placeholder="Adınızı girin"
        />
      </div>

      <div>
        <label htmlFor="contact-category" className="block text-sm font-medium text-gray-300 mb-1">
          Konu <span className="text-red-400">*</span>
        </label>
        <select
          id="contact-category"
          name="category"
          required
          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors"
        >
          <option value="">Konu seçin</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-gray-300 mb-1">
          Mesajınız <span className="text-red-400">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          maxLength={2000}
          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-colors resize-y"
          placeholder="Mesajınızı yazın..."
        />
      </div>

      <button
        type="submit"
        className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
      >
        Gönder
      </button>

      <p className="text-gray-600 text-xs">
        Bu form e-posta uygulamanızı açar. Bilgileriniz doğrudan bize ulaşır, herhangi bir üçüncü taraf sunucuya gönderilmez.
      </p>
    </form>
  );
}
