// Server function: turns a point on the map into an address, for the address step of
// Wee AI (the owner drops a pin, the governorate, city or village and street fill in).
//
//   GET /api/geocode?lat=33.51&lng=36.29
//     → { governorate, places: [names from the most local up], neighbourhood, road, houseNumber }
//
// Uses OpenStreetMap's free Nominatim service, in Arabic. Its usage policy asks for an identifying
// User-Agent and at most one request a second, so answers are cached by the CDN for a day and
// points are rounded to about 10 m, which makes repeated pins on the same spot one request.

const json = (body: unknown, status = 200, cache = false) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(cache ? { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } : {}),
    },
  });

const coord = (v: string | null, max: number) => {
  const n = Number(v);
  return v && Number.isFinite(n) && Math.abs(n) <= max ? Math.round(n * 10000) / 10000 : null;
};

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
    const url = new URL(request.url);
    const lat = coord(url.searchParams.get('lat'), 90);
    const lng = coord(url.searchParams.get('lng'), 180);
    if (lat === null || lng === null) return json({ error: 'bad_request' }, 400);

    const params = new URLSearchParams({
      format: 'jsonv2',
      lat: String(lat),
      lon: String(lng),
      zoom: '18',
      addressdetails: '1',
      'accept-language': 'ar',
    });
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: { 'User-Agent': 'Weelink/1.0 (https://testweelink.de)' },
    }).catch(() => null);
    if (!res || !res.ok) return json({ error: 'unavailable' }, 502);

    const data: any = await res.json().catch(() => null);
    const a = data?.address;
    if (!a) return json({ error: 'not_found' }, 404, true);

    const places = [a.village, a.hamlet, a.town, a.city, a.municipality, a.city_district, a.county, a.district]
      .filter((p): p is string => typeof p === 'string' && p.trim() !== '');
    return json(
      {
        governorate: a.state || a.province || '',
        places: [...new Set(places)],
        neighbourhood: a.neighbourhood || a.quarter || a.suburb || '',
        road: a.road || a.pedestrian || '',
        houseNumber: a.house_number || '',
      },
      200,
      true
    );
  },
};
