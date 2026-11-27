const DEFAULT_API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api/v1' : 'http://localhost:5000/api/v1');

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
 * Single source of truth for the 7 official Victorio Animal Bite Center branches.
 * Leads with human-friendly street/landmark addresses (no raw Plus Codes in display text)
 * while preserving exact Google Maps coordinates/queries in mapsUrl.
 */
export const OFFICIAL_BRANCHES = [
  {
    id: '11111111-1111-1111-1111-111111111101',
    slug: 'baliwag',
    name: 'Victorio ABC — Baliwag, Bulacan',
    shortName: 'Baliwag, Bulacan',
    socialLabel: 'Baliwag, Bulacan',
    area: 'Baliwag',
    barangay: 'Benigno S. Aquino Ave',
    municipality: 'Baliwag, Bulacan',
    address: 'Benigno S. Aquino Avenue, Baliwag, Bulacan',
    contactNumber: '09933269641',
    contact_number: '09933269641',
    displayPhone: '0993 326 9641',
    facebookUrl:
      'https://www.facebook.com/profile.php?id=61582587141902&rdid=89OXyQxga66nD5lM&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1M9ZCsfajc#',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=XV5X%2BMG7%2C+Benigno+S.+Aquino+Avenue%2C+Baliwag%2C+Bulacan',
    lat: 14.9547,
    lng: 120.8969,
    hours: 'Open Daily • Walk-In & Follow-Up PEP Doses',
    apiBaseUrl: DEFAULT_API_BASE_URL,
    serverTenantId: 'tenant-baliwag',
    status: 'active',
  },
  {
    id: '11111111-1111-1111-1111-111111111102',
    slug: 'santa-maria',
    name: 'Victorio ABC — Santa Maria, Bulacan',
    shortName: 'Santa Maria, Bulacan',
    socialLabel: 'Santa Maria, Bulacan',
    area: 'Santa Maria',
    barangay: 'Santa Maria Bypass Rd',
    municipality: 'Santa Maria, Bulacan',
    address: 'Santa Maria Bypass Rd, Santa Maria, Bulacan',
    contactNumber: '09454378284',
    contact_number: '09454378284',
    displayPhone: '0945 437 8284',
    facebookUrl:
      'https://www.facebook.com/profile.php?id=61590283871799&locale=lv_LV#',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=RXF3%2BGR7%2C+Santa+Maria+Bypass+Rd%2C+Santa+Maria%2C+Bulacan',
    lat: 14.8181,
    lng: 120.9563,
    hours: 'Open Daily • Walk-In & Follow-Up PEP Doses',
    apiBaseUrl: DEFAULT_API_BASE_URL,
    serverTenantId: 'tenant-santa-maria',
    status: 'active',
  },
  {
    id: '11111111-1111-1111-1111-111111111103',
    slug: 'pandi',
    name: 'Victorio ABC — Mapulang Lupa, Pandi',
    shortName: 'Mapulang Lupa, Pandi',
    socialLabel: 'Mapulang Lupa, Pandi',
    area: 'Pandi',
    barangay: 'Mapulang Lupa',
    municipality: 'Pandi, Bulacan',
    address: '98 Pandi-Angat Rd, Brgy. Mapulang Lupa, Pandi, Bulacan',
    contactNumber: '09101909050',
    contact_number: '09101909050',
    displayPhone: '0910 190 9050',
    facebookUrl:
      'https://www.facebook.com/profile.php?id=61590157694633&rdid=8awejxsn6SLd4vRy&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1CkxMvjm6G#',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=98+Pandi+Angat+Rd%2C+Pandi%2C+Bulacan',
    lat: 14.8658,
    lng: 120.9571,
    hours: 'Open Daily • Walk-In & Follow-Up PEP Doses',
    apiBaseUrl: DEFAULT_API_BASE_URL,
    serverTenantId: 'tenant-pandi',
    status: 'active',
  },
  {
    id: '11111111-1111-1111-1111-111111111104',
    slug: 'drt',
    name: 'Victorio ABC — DRT, Bulacan',
    shortName: 'DRT, Bulacan',
    socialLabel: 'DRT, Bulacan',
    area: 'DRT',
    barangay: 'Pulong Sampalok',
    municipality: 'Doña Remedios Trinidad, Bulacan',
    address: '201 M. Valte Road, Brgy. Pulong Sampalok, Doña Remedios Trinidad, Bulacan',
    contactNumber: '09751861541',
    contact_number: '09751861541',
    displayPhone: '0975 186 1541',
    facebookUrl:
      'https://www.facebook.com/p/Victorio-Animal-Bite-Center-DRT-Bulacan-61580980903304/',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=201+M.+Valte+Road%2C+Pulong+Sampalok%2C+Dona+Remedios+Trinidad%2C+Bulacan',
    lat: 14.9964,
    lng: 121.0853,
    hours: 'Open Daily • Walk-In & Follow-Up PEP Doses',
    apiBaseUrl: DEFAULT_API_BASE_URL,
    serverTenantId: 'tenant-drt',
    status: 'active',
  },
  {
    id: '11111111-1111-1111-1111-111111111105',
    slug: 'meycauayan-camalig',
    name: 'Victorio ABC — Meycauayan, Bulacan (Camalig)',
    shortName: 'Meycauayan, Bulacan (Camalig)',
    socialLabel: 'Meycauayan, Bulacan',
    area: 'Meycauayan',
    barangay: 'Camalig',
    municipality: 'Meycauayan, Bulacan',
    address: 'Blk 64 Lot 9 El Camino Real, Brgy. Camalig, Meycauayan, Bulacan',
    contactNumber: '09517734066',
    contact_number: '09517734066',
    displayPhone: '0951 773 4066',
    facebookUrl:
      'https://www.facebook.com/p/Victorio-Animal-Bite-Center-Meycauayan-Bulacan-61587535684921/',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Blk+64+Lot+9+El+Camino+Real+Camalig%2C+Meycauayan%2C+Bulacan',
    lat: 14.7568,
    lng: 120.9942,
    hours: 'Open Daily • Walk-In & Follow-Up PEP Doses',
    apiBaseUrl: DEFAULT_API_BASE_URL,
    serverTenantId: 'tenant-meycauayan-camalig',
    status: 'active',
  },
  {
    id: '11111111-1111-1111-1111-111111111106',
    slug: 'meycauayan-poblacion',
    name: 'Victorio ABC — Poblacion / Calvario, Meycauayan',
    shortName: 'Poblacion / Calvario, Meycauayan',
    socialLabel: 'Poblacion, Meycauayan',
    area: 'Meycauayan',
    barangay: 'Calvario / Poblacion',
    municipality: 'Meycauayan, Bulacan',
    address: '009 Pacheco Street, Brgy. Calvario / Poblacion, Meycauayan, 3020 Bulacan',
    contactNumber: '09101909050',
    contact_number: '09101909050',
    displayPhone: '0910 190 9050',
    facebookUrl:
      'https://www.facebook.com/p/VICTORIO-Animal-Bite-Center-POBLACION-MEYCAUAYAN-61572101825058/',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=009+Pacheco+Street%2C+Calvario%2C+Meycauayan%2C+3020+Bulacan',
    lat: 14.7369,
    lng: 120.9606,
    hours: 'Open Daily • Walk-In & Follow-Up PEP Doses',
    apiBaseUrl: DEFAULT_API_BASE_URL,
    serverTenantId: 'tenant-meycauayan-poblacion',
    status: 'active',
  },
  {
    id: '11111111-1111-1111-1111-111111111107',
    slug: 'cefels-caloocan',
    name: 'Victorio ABC — Cefels, Caloocan',
    shortName: 'Cefels, Caloocan',
    socialLabel: 'Cefels, Caloocan',
    area: 'Caloocan',
    barangay: 'Cefels',
    municipality: 'Caloocan, Metro Manila',
    address: '2nd Floor, Flojems Building, Cefels Subd., Caloocan, 1427 Metro Manila',
    contactNumber: '09453311310',
    contact_number: '09453311310',
    displayPhone: '0945 331 1310',
    facebookUrl:
      'https://www.facebook.com/p/Victorio-Animal-Bite-Center-Cefels-Caloocan-61591528577336/',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Flojems+Building+Second+Floor%2C+Cefeles%2C+Caloocan%2C+1427+Metro+Manila',
    lat: 14.7566,
    lng: 121.0445,
    hours: 'Open Daily • Walk-In & Follow-Up PEP Doses',
    apiBaseUrl: DEFAULT_API_BASE_URL,
    serverTenantId: 'tenant-cefels-caloocan',
    status: 'active',
  },
];

export const DEFAULT_BRANCH_SLUG = OFFICIAL_BRANCHES[0].slug;
export const BRANCH_STORAGE_KEY = 'victorio_abc_active_branch_slug';

export function getBranchBySlug(slug) {
  if (!slug) return OFFICIAL_BRANCHES[0];
  const normalized = String(slug).trim().toLowerCase();
  return (
    OFFICIAL_BRANCHES.find((b) => b.slug === normalized || b.id === normalized) ||
    OFFICIAL_BRANCHES[0]
  );
}
