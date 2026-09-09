const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

async function nominatimFetch(path) {
  const res = await fetch(`${NOMINATIM_BASE}${path}`, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'fr',
    },
  });
  if (!res.ok) throw new Error('Erreur de géocodage');
  return res.json();
}

export async function searchAddress(query) {
  if (!query || query.trim().length < 3) return [];
  const params = new URLSearchParams({
    q: query.trim(),
    format: 'json',
    countrycodes: 'ma',
    limit: '5',
    addressdetails: '1',
  });
  return nominatimFetch(`/search?${params}`);
}

export async function reverseGeocode(lat, lon) {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: 'json',
  });
  const data = await nominatimFetch(`/reverse?${params}`);
  return data.display_name || '';
}
