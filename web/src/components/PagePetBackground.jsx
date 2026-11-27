import { useLocation } from 'react-router-dom';

/**
 * Route-to-Pattern Version Mapping (3 Rotating Dogs & Cats Background Versions):
 * - Version 1 (/backgrounds/pets-pattern-v1.svg): '/', '/about', '/privacy-policy', '/login', '/mobile-app'
 * - Version 2 (/backgrounds/pets-pattern-v2.svg): '/services', '/protocols', '/faq'
 * - Version 3 (/backgrounds/pets-pattern-v3.svg): '/roadmap', '/triage-guide', '/careers', '/contact'
 */
export function resolvePetBackgroundVersion(pathname = '/') {
  const clean = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  if (['/services', '/protocols', '/faq'].includes(clean)) {
    return 2;
  }
  if (['/roadmap', '/triage-guide', '/careers', '/contact'].includes(clean)) {
    return 3;
  }
  return 1;
}

const PATTERN_CONFIGS = [
  {
    version: 1,
    url: '/backgrounds/pets-pattern-v1.svg',
    size: '340px 340px',
    position: '0 0',
    label: 'Version 1 — Balanced Dogs, Cats & Paw Motif',
  },
  {
    version: 2,
    url: '/backgrounds/pets-pattern-v2.svg',
    size: '380px 380px',
    position: '24px 16px',
    label: 'Version 2 — Shifted Slate Dogs & Curled Cats Motif',
  },
  {
    version: 3,
    url: '/backgrounds/pets-pattern-v3.svg',
    size: '360px 360px',
    position: '12px 28px',
    label: 'Version 3 — Diagonal Dogs & Cats Duo Motif',
  },
];

export function PagePetBackground() {
  const { pathname } = useLocation();
  const activeVersion = resolvePetBackgroundVersion(pathname);

  return (
    <div
      aria-hidden="true"
      data-pet-bg-version={`v${activeVersion}`}
      className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden"
    >
      {PATTERN_CONFIGS.map((cfg) => {
        const isCurrent = cfg.version === activeVersion;
        return (
          <div
            key={cfg.version}
            data-version={`v${cfg.version}`}
            className={`absolute inset-0 bg-repeat transition-opacity duration-500 ease-in-out ${
              isCurrent ? 'opacity-50' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url('${cfg.url}')`,
              backgroundSize: cfg.size,
              backgroundPosition: cfg.position,
            }}
          />
        );
      })}
    </div>
  );
}
