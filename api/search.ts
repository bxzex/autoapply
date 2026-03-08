import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  const { query, location } = request.query;

  if (!query) {
    return response.status(200).json([]);
  }

  const sources = [
    { name: 'Adzuna', url: `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=45759795&app_key=943e061849f50e8081f9a1240e340c23&what=${encodeURIComponent(query as string)}&where=${encodeURIComponent((location as string) || '')}&results_per_page=10&content-type=application/json` },
    { name: 'Techmap', url: `https://jobdatafeeds.com/job-api/job-postings/search?job_title=${encodeURIComponent(query as string)}&location=${encodeURIComponent((location as string) || '')}` },
    { name: 'Jobicy', url: `https://jobicy.com/jobs-rss-feed?query=${encodeURIComponent(query as string)}`, type: 'xml' },
    { name: 'OkJob', url: `https://okjob.io/api/job-listings?keyword=${encodeURIComponent(query as string)}&location=${encodeURIComponent((location as string) || '')}` }
  ];

  const fetchResults = await Promise.all(sources.map(async (s) => {
    try {
      const res = await fetch(s.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Vercel Serverless)' },
        signal: AbortSignal.timeout(8000) // 8s timeout
      }).catch(() => null);
      
      if (!res || !res.ok) return [];

      if (s.type === 'xml') {
        const text = await res.text();
        const items = text.match(/<item>([\s\S]*?)<\/item>/g) || [];
        return items.map((item, i) => {
          const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
          const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
          const descMatch = item.match(/<description>([\s\S]*?)<\/description>/);
          
          const clean = (str: string) => str.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<\/?[^>]+(>|$)/g, "").trim();
          
          return {
            id: `src-xml-${i}-${Date.now()}`,
            title: clean(titleMatch?.[1] || "Job Listing"),
            company: "Remote Native",
            location: "Remote",
            salary: "Market Rate",
            description: clean(descMatch?.[1] || ""),
            url: linkMatch?.[1] || "#",
            source: s.name
          };
        });
      }

      const d = await res.json();
      if (s.name === 'Adzuna') return (d.results || []).map((j: any) => ({
        id: `adz-${j.id}`,
        title: j.title.replace(/<\/?[^>]+(>|$)/g, ""),
        company: j.company.display_name,
        location: j.location.display_name,
        salary: j.salary_min ? `$${Math.round(j.salary_min/1000)}k+` : "Market Rate",
        description: j.description.replace(/<\/?[^>]+(>|$)/g, ""),
        url: j.redirect_url,
        source: s.name
      }));
      
      if (s.name === 'OkJob') return (d.job_listings || d || []).map((j: any, i: number) => ({
        id: `okj-${j.job_id || i}-${Date.now()}`,
        title: j.title || j.job_title,
        company: j.company || "Direct Hiring",
        location: j.location || "Remote",
        salary: j.salary || "Market Rate",
        description: j.description || j.job_description || "",
        url: `https://okjob.io/jobs/${j.job_id}`,
        source: s.name,
        canAutoApply: true
      }));

      if (Array.isArray(d)) return d.map((j: any, i: number) => ({
        id: `src-gen-${i}-${Date.now()}`,
        title: j.job_title || j.title,
        company: j.company || "Hiring Partner",
        location: j.location || "Global",
        salary: j.salary || "Market Rate",
        description: j.job_description || j.description || "",
        url: j.url || "#",
        source: s.name
      }));

      return [];
    } catch (err) {
      return [];
    }
  }));

  const flatResults = fetchResults.flat();
  return response.status(200).json(flatResults);
}
