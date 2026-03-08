import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // Use modern WHATWG URL API instead of relying on legacy request.query
  // In Vercel, request.url is the path + query. We need a base to use the URL constructor.
  const host = request.headers.host || 'localhost';
  const url = new URL(request.url || '', `http://${host}`);
  const query = url.searchParams.get('query');
  const location = url.searchParams.get('location') || '';

  if (!query) {
    return response.status(200).json([]);
  }

  const ts = Date.now();

  const results = await Promise.all([
    // Source 1: Adzuna
    (async () => {
      try {
        const target = new URL('https://api.adzuna.com/v1/api/jobs/us/search/1');
        target.searchParams.set('app_id', '45759795');
        target.searchParams.set('app_key', '943e061849f50e8081f9a1240e340c23');
        target.searchParams.set('what', query);
        if (location) target.searchParams.set('where', location);
        target.searchParams.set('results_per_page', '15');
        target.searchParams.set('content-type', 'application/json');

        const res = await fetch(target.toString(), { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(6000) });
        if (!res.ok) return [];
        const d = await res.json();
        return (d.results || []).map((j: any) => ({
          id: `adz-${j.id}-${ts}`,
          title: j.title.replace(/<\/?[^>]+(>|$)/g, ""),
          company: j.company.display_name,
          location: j.location.display_name,
          salary: j.salary_min ? `$${Math.round(j.salary_min/1000)}k+` : "Market Rate",
          description: j.description.replace(/<\/?[^>]+(>|$)/g, "").trim(),
          url: j.redirect_url,
          source: 'Adzuna Network'
        }));
      } catch { return []; }
    })(),

    // Source 2: Arbeitnow (Reliable Public API)
    (async () => {
      try {
        const res = await fetch(`https://www.arbeitnow.com/api/job-board-api`, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) return [];
        const d = await res.json();
        const filtered = d.data.filter((j: any) => {
          const mQuery = j.title.toLowerCase().includes(query.toLowerCase()) || j.description.toLowerCase().includes(query.toLowerCase());
          const mLocation = location ? (j.location.toLowerCase().includes(location.toLowerCase()) || j.location.toLowerCase().includes('remote')) : true;
          return mQuery && mLocation;
        });
        return filtered.slice(0, 15).map((j: any, i: number) => ({
          id: `arb-${i}-${ts}`,
          title: j.title,
          company: j.company_name,
          location: j.location,
          salary: "Market Rate",
          description: j.description.replace(/<\/?[^>]+(>|$)/g, "").trim(),
          url: j.url,
          source: 'Arbeitnow'
        }));
      } catch { return []; }
    })(),

    // Source 3: The Muse
    (async () => {
      try {
        const target = new URL('https://www.themuse.com/api/public/jobs');
        target.searchParams.set('category', query);
        if (location && location.length > 2) target.searchParams.set('location', location);
        target.searchParams.set('page', '0');

        const res = await fetch(target.toString(), { signal: AbortSignal.timeout(6000) });
        if (!res.ok) return [];
        const d = await res.json();
        return (d.results || []).map((j: any) => ({
          id: `muse-${j.id}-${ts}`,
          title: j.name,
          company: j.company.name,
          location: j.locations?.[0]?.name || "Remote",
          salary: "Market Rate",
          description: j.contents.replace(/<\/?[^>]+(>|$)/g, "").trim(),
          url: j.refs.landing_page,
          source: 'The Muse'
        }));
      } catch { return []; }
    })(),

    // Source 4: Jobicy (API v2)
    (async () => {
      try {
        const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?count=20`, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) return [];
        const d = await res.json();
        const filtered = (d.jobs || []).filter((j: any) => {
          const mQuery = j.jobTitle.toLowerCase().includes(query.toLowerCase()) || j.jobDescription.toLowerCase().includes(query.toLowerCase());
          const mLocation = location ? (j.jobGeo.toLowerCase().includes(location.toLowerCase()) || j.jobGeo.toLowerCase().includes('remote')) : true;
          return mQuery && mLocation;
        });
        return filtered.map((j: any) => ({
          id: `jby-${j.id}-${ts}`,
          title: j.jobTitle,
          company: j.companyName,
          location: j.jobGeo,
          salary: j.annualSalaryMin ? `$${j.annualSalaryMin}` : "Market Rate",
          description: j.jobDescription.replace(/<\/?[^>]+(>|$)/g, "").trim(),
          url: j.url,
          source: 'Jobicy'
        }));
      } catch { return []; }
    })()
  ]);

  return response.status(200).json(results.flat());
}
