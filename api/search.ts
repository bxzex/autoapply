import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // Use modern WHATWG URL API instead of relying on legacy request.query
  const url = new URL(request.url || '', `http://${request.headers.host}`);
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
        target.searchParams.set('where', location);
        target.searchParams.set('results_per_page', '10');
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

    // Source 2: Jobicy (RSS)
    (async () => {
      try {
        const target = new URL('https://jobicy.com/jobs-rss-feed');
        target.searchParams.set('query', query);

        const res = await fetch(target.toString(), { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(6000) });
        if (!res.ok) return [];
        const text = await res.text();
        const items = text.match(/<item>([\s\S]*?)<\/item>/g) || [];
        return items.slice(0, 10).map((item, i) => {
          const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "";
          const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "#";
          const desc = item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || "";
          const clean = (str: string) => str.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<\/?[^>]+(>|$)/g, "").trim();
          return {
            id: `xml-${i}-${ts}`,
            title: clean(title),
            company: "Verified Hiring",
            location: "Remote",
            salary: "Market Rate",
            description: clean(desc),
            url: link.trim(),
            source: 'Remote RSS'
          };
        });
      } catch { return []; }
    })(),

    // Source 3: OkJob
    (async () => {
      try {
        const target = new URL('https://okjob.io/api/job-listings');
        target.searchParams.set('keyword', query);
        target.searchParams.set('location', location);

        const res = await fetch(target.toString(), { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(6000) });
        if (!res.ok) return [];
        const d = await res.json();
        return (d.job_listings || d || []).map((j: any, i: number) => ({
          id: `okj-${j.job_id || i}-${ts}`,
          title: j.title || j.job_title,
          company: j.company || "Hiring Partner",
          location: j.location || "Remote",
          salary: j.salary || "Market Rate",
          description: j.description || j.job_description || "",
          url: `https://okjob.io/jobs/${j.job_id}`,
          source: 'Direct Board',
          canAutoApply: true
        }));
      } catch { return []; }
    })()
  ]);

  return response.status(200).json(results.flat());
}
