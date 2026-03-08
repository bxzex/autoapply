import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  const { query, location } = request.query;

  if (!query) {
    return response.status(200).json([]);
  }

  // Use current Node timestamp for unique IDs
  const ts = Date.now();

  const sources = [
    { name: 'Provider A', url: `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=45759795&app_key=943e061849f50e8081f9a1240e340c23&what=${encodeURIComponent(query as string)}&where=${encodeURIComponent((location as string) || '')}&results_per_page=10&content-type=application/json` },
    { name: 'Provider B', url: `https://jobicy.com/jobs-rss-feed?query=${encodeURIComponent(query as string)}`, type: 'xml' },
    { name: 'Provider C', url: `https://okjob.io/api/job-listings?keyword=${encodeURIComponent(query as string)}&location=${encodeURIComponent((location as string) || '')}` }
  ];

  const results = await Promise.all(sources.map(async (s) => {
    try {
      console.log(`Fetching from ${s.name}...`);
      const res = await fetch(s.url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }).catch(() => null);
      
      if (!res || !res.ok) {
        console.error(`${s.name} failed with status ${res?.status}`);
        return [];
      }

      if (s.type === 'xml') {
        const text = await res.text();
        const items = text.match(/<item>([\s\S]*?)<\/item>/g) || [];
        return items.slice(0, 10).map((item, i) => {
          const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "";
          const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "#";
          const desc = item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || "";
          return {
            id: `xml-${i}-${ts}`,
            title: title.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<\/?[^>]+(>|$)/g, "").trim(),
            company: "Remote Verified",
            location: "Remote",
            salary: "Market Rate",
            description: desc.replace(/<!\[CDATA\[|\]\]>|<\/?[^>]+(>|$)/g, "").trim(),
            url: link.trim(),
            source: s.name
          };
        });
      }

      const d = await res.json();
      if (s.name === 'Provider A') return (d.results || []).map((j: any) => ({
        id: `adz-${j.id}-${ts}`,
        title: j.title.replace(/<\/?[^>]+(>|$)/g, ""),
        company: j.company.display_name,
        location: j.location.display_name,
        salary: j.salary_min ? `$${Math.round(j.salary_min/1000)}k+` : "Market Rate",
        description: j.description.replace(/<\/?[^>]+(>|$)/g, "").trim(),
        url: j.redirect_url,
        source: s.name
      }));
      
      if (s.name === 'Provider C') return (d.job_listings || d || []).map((j: any, i: number) => ({
        id: `okj-${j.job_id || i}-${ts}`,
        title: j.title || j.job_title,
        company: j.company || "Hiring Partner",
        location: j.location || "Remote",
        salary: j.salary || "Market Rate",
        description: j.description || j.job_description || "",
        url: `https://okjob.io/jobs/${j.job_id}`,
        source: s.name,
        canAutoApply: true
      }));

      return [];
    } catch (err) {
      console.error(`Error processing ${s.name}:`, err);
      return [];
    }
  }));

  return response.status(200).json(results.flat());
}
