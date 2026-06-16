"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const PRODUCTS = [
  { label: "Zbliżeniowa Kontrola Trzeźwości (Alkomaty)", href: "/produkty/alkomaty" },
  { label: "YMS – Awizacje Dockowe", href: "/produkty/yms" },
  { label: "System LPR (Odczyt Tablic Rejestracyjnych)", href: "/produkty/lpr" },
  { label: "Rejestracja Czasu Pracy", href: "/produkty/rcp" },
  { label: "Zbliżeniowa Kontrola Temperatury Ciała", href: "/produkty/temperatura" },
  { label: "Kioski Samoobsługowe Dla Kierowców", href: "/produkty/kioski" },
  { label: "Terminale Wjazdowo-Wyjazdowe", href: "/produkty/terminale" },
  { label: "Zliczanie Osób (Countingpeople)", href: "/produkty/countingpeople" },
  { label: "Portal Samo Awizacji", href: "/produkty/portal-awizacji" },
  { label: "System ERP (VTools)", href: "/produkty/vtools", highlight: true },
  { label: "Kamera Odczytu Kodów Kreskowych", href: "/produkty/kamera-kodow" },
  { label: "Wagi Samochodowe", href: "/produkty/wagi" },
];

const NAV_LINKS = [
  { label: "PRODUKTY", href: "/produkty", dropdown: true },
  { label: "OFERTA", href: "/oferta", dropdown: false },
  { label: "DLA KOGO", href: "/dla-kogo", dropdown: false },
  { label: "O NAS", href: "/o-nas", dropdown: false },
  { label: "KONTAKT", href: "/kontakt", dropdown: false },
];

function Logo() {
  return (
    <Link href="/" className="shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/VCN%20logo%201.0%20RGB%20uproszczone.svg"
        alt="VCN"
        className="h-14 w-auto"
        loading="eager"
      />
    </Link>
  );
}

function IconPhone() {
  return (
    <svg className="w-3.5 h-3.5 text-vcn-red shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg className="w-3.5 h-3.5 text-vcn-red shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg className="w-3.5 h-3.5 text-vcn-red shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  );
}

function IconYouTube() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.54C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
    </svg>
  );
}

function IconLinkedIn() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* ── Top bar ── */}
      <div className="hidden md:block bg-gray-950 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-5 text-xs text-gray-400">
            <a href="tel:+48616229492" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <IconPhone />
              (+48) 61 622 94 92
            </a>
            <a href="mailto:biuro@vcn.pl" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <IconMail />
              biuro@vcn.pl
            </a>
            <span className="flex items-center gap-1.5">
              <IconClock />
              Pon–Pt: 8:00–15:00
            </span>
          </div>

          <div className="flex items-center gap-3 text-gray-400">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-white transition-colors">
              <IconFacebook />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-white transition-colors">
              <IconYouTube />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-white transition-colors">
              <IconLinkedIn />
            </a>

            <span className="w-px h-4 bg-gray-700 mx-1" />

            <a
              href="/newsletter"
              className="bg-vcn-red hover:bg-vcn-red-dark transition-colors text-white text-xs font-bold px-3 py-1 rounded tracking-widest"
            >
              NEWSLETTER
            </a>

            <div className="flex items-center gap-1 text-xs cursor-pointer hover:text-white transition-colors select-none">
              <span>🇵🇱</span>
              <span>Polski</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main nav ── */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Logo />

          {/* Desktop links */}
          <ul className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.map((link) =>
              link.dropdown ? (
                <li key={link.label} ref={dropdownRef} className="relative">
                  <button
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-700 hover:text-vcn-red transition-colors rounded-md hover:bg-gray-50"
                  >
                    {link.label}
                    <IconChevron open={dropdownOpen} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute top-full left-0 mt-0.5 bg-white shadow-2xl border border-gray-100 rounded-b-lg w-80 z-50 py-1.5 overflow-hidden">
                      {PRODUCTS.map((product) => (
                        <Link
                          key={product.href}
                          href={product.href}
                          onClick={() => setDropdownOpen(false)}
                          className={`block px-4 py-2.5 text-sm transition-colors leading-snug ${
                            product.highlight
                              ? "bg-vcn-red text-white hover:bg-vcn-red-dark font-medium"
                              : "text-gray-700 hover:bg-gray-50 hover:text-vcn-red"
                          }`}
                        >
                          {product.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              ) : (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="block px-4 py-2 text-sm font-semibold text-gray-700 hover:text-vcn-red transition-colors rounded-md hover:bg-gray-50"
                  >
                    {link.label}
                  </Link>
                </li>
              )
            )}
          </ul>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Zamknij menu" : "Otwórz menu"}
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>

        {/* ── Mobile drawer ── */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white max-h-screen overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              {/* Contact (mobile) */}
              <div className="flex flex-col gap-2 pb-3 mb-1 border-b border-gray-100 text-sm text-gray-600">
                <a href="tel:+48616229492" className="flex items-center gap-2 hover:text-vcn-red transition-colors">
                  <IconPhone />
                  (+48) 61 622 94 92
                </a>
                <a href="mailto:biuro@vcn.pl" className="flex items-center gap-2 hover:text-vcn-red transition-colors">
                  <IconMail />
                  biuro@vcn.pl
                </a>
              </div>

              {/* Produkty accordion */}
              <button
                onClick={() => setMobileProductsOpen((v) => !v)}
                className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-md"
              >
                PRODUKTY
                <IconChevron open={mobileProductsOpen} />
              </button>
              {mobileProductsOpen && (
                <div className="pl-3 flex flex-col gap-0.5 mb-1">
                  {PRODUCTS.map((p) => (
                    <Link
                      key={p.href}
                      href={p.href}
                      onClick={() => setMobileOpen(false)}
                      className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                        p.highlight
                          ? "bg-vcn-red text-white font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-vcn-red"
                      }`}
                    >
                      {p.label}
                    </Link>
                  ))}
                </div>
              )}

              {NAV_LINKS.filter((l) => !l.dropdown).map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-vcn-red transition-colors rounded-md"
                >
                  {link.label}
                </Link>
              ))}

              <a
                href="/newsletter"
                className="mt-3 bg-vcn-red hover:bg-vcn-red-dark transition-colors text-white text-sm font-bold px-4 py-2.5 rounded text-center tracking-widest"
              >
                NEWSLETTER
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
