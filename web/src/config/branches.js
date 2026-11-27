export function resolveRuntimeApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL || '';
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocalHost = host === 'localhost' || host === '127.0.0.1';
    if (!isLocalHost) {
      // On Vercel production (https://victorio-abc-ph.vercel.app), never use localhost URLs
      if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
        return '/api/v1';
      }
      return envUrl;
    }
  }
  if (import.meta.env.PROD && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
    return '/api/v1';
  }
  return envUrl || '/api/v1';
}

const DEFAULT_API_BASE_URL = resolveRuntimeApiBaseUrl();

/**
 * Formats an 11-digit Philippine mobile number (e.g. "09454378284") into
 * human-readable "0945 437 8284" spacing while preserving raw digits for tel: links.
 */
export function formatPhoneDisplay(phone = '') {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('09')) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 12 && digits.startsWith('639')) {
    return `0${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return String(phone).trim();
}

/**
 * Builds an exact Google Maps search link from a branch's verified address / Plus Code query.
 */
export function buildMapsUrl(mapsQuery = '') {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;
}

/**
 * Single source of truth for the 7 official Victorio Animal Bite Center branches.
 * - `id` & `slug` both equal the canonical branch slug ('santa-maria', 'baliwag', etc.)
 *   matching `public.branches.id` (TEXT PK) and `public.profiles.branch_id` in Supabase.
 */
const BRANCH_DEFINITIONS = [
  {
    id: 'baliwag',
    slug: 'baliwag',
    legacyUuid: '11111111-1111-1111-1111-111111111101',
    name: 'Victorio ABC — Baliwag, Bulacan',
    shortName: 'Baliwag, Bulacan',
    socialLabel: 'Baliwag, Bulacan',
    area: 'Baliwag',
    barangay: 'Benigno S. Aquino Ave',
    municipality: 'Baliwag, Bulacan',
    address: '347 Benigno S. Aquino Avenue, Baliwag, Bulacan',
    mapsQuery: '347 Benigno S. Aquino Avenue, Baliwag, Bulacan',
    phone: '09933269641',
    contactNumber: '09933269641',
    contact_number: '09933269641',
    displayPhone: '0993 326 9641',
    facebookUrl:
      'https://www.facebook.com/profile.php?id=61582587141902&rdid=89OXyQxga66nD5lM&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1M9ZCsfajc#',
    lat: 14.9556,
    lng: 120.9009,
    serverTenantId: 'tenant-baliwag',
  },
  {
    id: 'santa-maria',
    slug: 'santa-maria',
    legacyUuid: '11111111-1111-1111-1111-111111111102',
    name: 'Victorio ABC — Santa Maria, Bulacan',
    shortName: 'Santa Maria, Bulacan',
    socialLabel: 'Santa Maria, Bulacan',
    area: 'Santa Maria',
    barangay: 'Santa Maria Bypass Rd',
    municipality: 'Santa Maria, Bulacan',
    address: 'Santa Maria Bypass Rd, Santa Maria, Bulacan',
    mapsQuery: 'RXF3+GR7, Santa Maria Bypass Rd, Santa Maria, Bulacan',
    phone: '09454378284',
    contactNumber: '09454378284',
    contact_number: '09454378284',
    displayPhone: '0945 437 8284',
    facebookUrl:
      'https://www.facebook.com/profile.php?id=61590283871799&locale=lv_LV#',
    lat: 14.8238,
    lng: 120.9545,
    serverTenantId: 'tenant-santa-maria',
  },
  {
    id: 'pandi',
    slug: 'pandi',
    legacyUuid: '11111111-1111-1111-1111-111111111103',
    name: 'Victorio ABC — Mapulang Lupa, Pandi',
    shortName: 'Mapulang Lupa, Pandi',
    socialLabel: 'Mapulang Lupa, Pandi',
    area: 'Pandi',
    barangay: 'Mapulang Lupa',
    municipality: 'Pandi, Bulacan',
    address: '98 Pandi Angat Rd, Mapulang Lupa, Pandi, Bulacan',
    mapsQuery: '98 Pandi Angat Rd, Pandi, Bulacan',
    phone: '09101909050',
    contactNumber: '09101909050',
    contact_number: '09101909050',
    displayPhone: '0910 190 9050',
    facebookUrl:
      'https://www.facebook.com/profile.php?id=61590157694633&rdid=8awejxsn6SLd4vRy&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1CkxMvjm6G#',
    lat: 14.8777,
    lng: 120.9619,
    serverTenantId: 'tenant-pandi',
  },
  {
    id: 'drt',
    slug: 'drt',
    legacyUuid: '11111111-1111-1111-1111-111111111104',
    name: 'Victorio ABC — DRT, Bulacan',
    shortName: 'DRT, Bulacan',
    socialLabel: 'DRT, Bulacan',
    area: 'DRT',
    barangay: 'Pulong Sampalok',
    municipality: 'Doña Remedios Trinidad, Bulacan',
    address: '201 M. Valte Road, Pulong Sampalok, Doña Remedios Trinidad, Bulacan',
    mapsQuery: '201 M. Valte Road, Pulong Sampalok, Doña Remedios Trinidad, Bulacan',
    phone: '09751861541',
    contactNumber: '09751861541',
    contact_number: '09751861541',
    displayPhone: '0975 186 1541',
    facebookUrl:
      'https://www.facebook.com/p/Victorio-Animal-Bite-Center-DRT-Bulacan-61580980903304/',
    lat: 14.9964,
    lng: 121.0853,
    serverTenantId: 'tenant-drt',
  },
  {
    id: 'meycauayan-camalig',
    slug: 'meycauayan-camalig',
    legacyUuid: '11111111-1111-1111-1111-111111111105',
    name: 'Victorio ABC — Meycauayan, Bulacan (Camalig)',
    shortName: 'Meycauayan, Bulacan (Camalig)',
    socialLabel: 'Meycauayan, Bulacan',
    area: 'Meycauayan',
    barangay: 'Camalig',
    municipality: 'Meycauayan, Bulacan',
    address: 'Blk 63 Lot 9 El Camino Real, Camalig, Meycauayan, Bulacan',
    mapsQuery: 'Blk 63 Lot 9 El Camino Real, Camalig, Meycauayan, Bulacan',
    phone: '09517734066',
    contactNumber: '09517734066',
    contact_number: '09517734066',
    displayPhone: '0951 773 4066',
    facebookUrl:
      'https://www.facebook.com/p/Victorio-Animal-Bite-Center-Meycauayan-Bulacan-61587535684921/',
    lat: 14.7664,
    lng: 120.9994,
    serverTenantId: 'tenant-meycauayan-camalig',
  },
  {
    id: 'meycauayan-poblacion',
    slug: 'meycauayan-poblacion',
    legacyUuid: '11111111-1111-1111-1111-111111111106',
    name: 'Victorio ABC — Poblacion / Calvario, Meycauayan',
    shortName: 'Poblacion / Calvario, Meycauayan',
    socialLabel: 'Poblacion, Meycauayan',
    area: 'Meycauayan',
    barangay: 'Calvario / Poblacion',
    municipality: 'Meycauayan, Bulacan',
    address: '009 Pacheco Street, Calvario, Meycauayan, 3020 Bulacan',
    mapsQuery: '009 Pacheco Street, Calvario, Meycauayan, 3020 Bulacan',
    phone: '09101909050',
    contactNumber: '09101909050',
    contact_number: '09101909050',
    displayPhone: '0910 190 9050',
    facebookUrl:
      'https://www.facebook.com/p/VICTORIO-Animal-Bite-Center-POBLACION-MEYCAUAYAN-61572101825058/',
    lat: 14.7369,
    lng: 120.9606,
    serverTenantId: 'tenant-meycauayan-poblacion',
  },
  {
    id: 'cefels-caloocan',
    slug: 'cefels-caloocan',
    legacyUuid: '11111111-1111-1111-1111-111111111107',
    name: 'Victorio ABC — Cefels, Caloocan',
    shortName: 'Cefels, Caloocan',
    socialLabel: 'Cefels, Caloocan',
    area: 'Caloocan',
    barangay: 'Cefels',
    municipality: 'Caloocan, Metro Manila',
    address: 'Flojems Building Second Floor, Cefels, Caloocan, 1427 Metro Manila',
    mapsQuery: 'Flojems Building Second Floor, Cefels, Caloocan, 1427 Metro Manila',
    phone: '09453311310',
    contactNumber: '09453311310',
    contact_number: '09453311310',
    displayPhone: '0945 331 1310',
    facebookUrl:
      'https://www.facebook.com/p/Victorio-Animal-Bite-Center-Cefels-Caloocan-61591528577336/',
    lat: 14.7566,
    lng: 121.0445,
    serverTenantId: 'tenant-cefels-caloocan',
  },
];

/**
 * Formats a concise "… Branch" label for display directly beneath the Victorio ABC logo
 * (e.g. "Santa Maria Branch", "Baliwag Branch", "Cefels, Caloocan Branch").
 */
export function formatBranchLabel(branch) {
  if (!branch) return 'Santa Maria Branch';
  const map = {
    baliwag: 'Baliwag Branch',
    'santa-maria': 'Santa Maria Branch',
    pandi: 'Mapulang Lupa, Pandi Branch',
    drt: 'DRT Branch',
    'meycauayan-camalig': 'Camalig, Meycauayan Branch',
    'meycauayan-poblacion': 'Calvario, Meycauayan Branch',
    'cefels-caloocan': 'Cefels, Caloocan Branch',
  };
  return map[branch.slug] || `${branch.area || branch.shortName} Branch`;
}

export const OFFICIAL_BRANCHES = BRANCH_DEFINITIONS.map((branch) => ({
  ...branch,
  branchLabel: formatBranchLabel(branch),
  mapsUrl: buildMapsUrl(branch.mapsQuery),
  hours: 'Open Daily • Walk-In & Follow-Up PEP Doses',
  apiBaseUrl: DEFAULT_API_BASE_URL,
  is_active: true,
  status: 'active',
}));

export const DEFAULT_BRANCH_SLUG = 'santa-maria';
export const BRANCH_STORAGE_KEY = 'victorio_abc_active_branch_slug';
export const BRANCH_MANUAL_OVERRIDE_KEY = 'victorio_abc_manual_branch_selected';

export function getBranchBySlug(slugOrId) {
  const fallback =
    OFFICIAL_BRANCHES.find((b) => b.slug === DEFAULT_BRANCH_SLUG) ||
    OFFICIAL_BRANCHES[0];
  if (!slugOrId) return fallback;
  const normalized = String(slugOrId).trim().toLowerCase();
  return (
    OFFICIAL_BRANCHES.find(
      (b) =>
        b.slug === normalized ||
        b.id === normalized ||
        b.legacyUuid === normalized
    ) || fallback
  );
}

/**
 * Computes the great-circle Haversine distance in kilometers between two coordinates.
 */
export function calculateHaversineDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Given device latitude & longitude, calculates Haversine distances to all 7 official branches
 * and returns the closest branch along with a map of distances (rounded to 1 decimal place).
 */
export function findNearestOfficialBranch(latitude, longitude) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null;
  }

  let nearestBranch = OFFICIAL_BRANCHES[0];
  let minDistance = Infinity;
  const distancesBySlug = {};

  for (const branch of OFFICIAL_BRANCHES) {
    const dist = calculateHaversineDistanceKm(latitude, longitude, branch.lat, branch.lng);
    distancesBySlug[branch.slug] = Math.round(dist * 10) / 10;
    if (dist < minDistance) {
      minDistance = dist;
      nearestBranch = branch;
    }
  }

  return {
    branch: nearestBranch,
    distanceKm: Math.round(minDistance * 10) / 10,
    distancesBySlug,
  };
}
