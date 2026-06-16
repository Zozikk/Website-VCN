"use client";

import Link from "next/link";

const OFERTA_LINKS = [
  { label: "System awizacyjno-przepustkowy", href: "/oferta/awizacja" },
  { label: "System liczenia osób", href: "/oferta/liczenie-osob" },
  { label: "System sprzedaży zintegrowany z systemem wideo", href: "/oferta/sprzedaz-wideo" },
  {
    label: "System ERP wspomagający pracę mobilnego serwisu, prowadzenia zleceń, obsługi zgłoszeń",
    href: "/oferta/erp",
  },
];

const O_NAS_LINKS = [
  { label: "Aktualności", href: "/o-nas/aktualnosci" },
  { label: "Doświadczenie", href: "/o-nas/doswiadczenie" },
  { label: "Realizacje", href: "/o-nas/realizacje" },
  { label: "Kariera", href: "/o-nas/kariera" },
];

const INFORMACJE_LINKS = [
  { label: "Regulamin serwisu", href: "/informacje/regulamin" },
  { label: "Dotacje unijne", href: "/informacje/dotacje" },
  { label: "Polityka prywatności", href: "/informacje/polityka-prywatnosci" },
  { label: "Ogólne warunki gwarancji", href: "/informacje/gwarancja" },
];

function Logo() {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/vcn-logo-dark.svg"
      alt="VCN"
      className="h-14 w-auto"
      loading="lazy"
    />
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-8 h-8 bg-gray-800 hover:bg-vcn-red transition-colors rounded flex items-center justify-center text-gray-400 hover:text-white"
    >
      {children}
    </a>
  );
}

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* ── Col 1: Company ── */}
          <div>
            <Logo />
            <div className="mt-5 space-y-1.5 text-sm">
              <p className="text-white font-semibold">VNET Sp. z o.o.</p>
              <p>ul. Ścinawska 3, 60-178 Poznań</p>
              <p>NIP: 778-01-17-370</p>
              <p>
                Telefon:{" "}
                <a href="tel:+48616229492" className="hover:text-white transition-colors">
                  +48 (61) 622 94 92
                </a>
              </p>
              <p>Fax: +48 (61) 622 94 95</p>
              <p className="text-xs leading-relaxed">
                Konto bankowe:
                <br />
                PL21 1402 0004 0003 5027 6287 6762
              </p>
              <p>
                E-mail:{" "}
                <a href="mailto:biuro@vcn.pl" className="hover:text-white transition-colors">
                  biuro@vcn.pl
                </a>
              </p>
            </div>

            <div className="flex gap-2.5 mt-5">
              <SocialLink href="https://facebook.com" label="Facebook">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              </SocialLink>
              <SocialLink href="https://youtube.com" label="YouTube">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.54C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
                </svg>
              </SocialLink>
              <SocialLink href="https://linkedin.com" label="LinkedIn">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </SocialLink>
            </div>
          </div>

          {/* ── Col 2: OFERTA ── */}
          <div>
            <h3 className="text-white font-semibold text-xs tracking-widest uppercase mb-5">Oferta</h3>
            <ul className="space-y-3 text-sm">
              {OFERTA_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors leading-snug block">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/serwis"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-vcn-red shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Serwis i utrzymanie
                </Link>
              </li>
            </ul>
          </div>

          {/* ── Col 3: O NAS ── */}
          <div>
            <h3 className="text-white font-semibold text-xs tracking-widest uppercase mb-5">O nas</h3>
            <ul className="space-y-3 text-sm">
              {O_NAS_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors block">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 4: INFORMACJE ── */}
          <div>
            <h3 className="text-white font-semibold text-xs tracking-widest uppercase mb-5">Informacje</h3>
            <ul className="space-y-3 text-sm">
              {INFORMACJE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors block">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-gray-600">© 2026 VCN – Wszelkie prawa zastrzeżone</p>
          <button
            onClick={scrollToTop}
            aria-label="Przewiń do góry"
            className="w-8 h-8 bg-gray-800 hover:bg-vcn-red transition-colors rounded flex items-center justify-center text-gray-400 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
}
