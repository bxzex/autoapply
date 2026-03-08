import { pipeline, env } from '@xenova/transformers'

// Allow usage of WebGPU
env.allowLocalModels = false;
env.useBrowserCache = true;

let embeddingPipeline: any = null;

export async function getEmbedding(text: string): Promise<number[]> {
  if (!embeddingPipeline) {
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  
  const output = await embeddingPipeline(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data) as number[];
}

export function cosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    mA += vecA[i] * vecA[i];
    mB += vecB[i] * vecB[i];
  }
  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  return dotProduct / (mA * mB);
}

export async function extractSkills(text: string) {
  const categories = {
    frontend: ['React', 'Next.js', 'Vue', 'Angular', 'Svelte', 'Tailwind', 'CSS', 'HTML', 'JavaScript', 'TypeScript', 'Redux', 'Zustand', 'Vite', 'Webpack', 'Three.js'],
    backend: ['Node.js', 'Express', 'NestJS', 'Go', 'Golang', 'Rust', 'Python', 'Django', 'Flask', 'FastAPI', 'Java', 'Spring Boot', 'PHP', 'Laravel', 'Ruby on Rails', 'C#', 'ASP.NET', 'C++'],
    database: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Supabase', 'Firebase', 'Prisma', 'Drizzle', 'Elasticsearch', 'DynamoDB', 'Cassandra'],
    cloud: ['AWS', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Lambda', 'EC2', 'S3', 'Vercel', 'Netlify', 'Cloudflare'],
    tools: ['Git', 'GitHub', 'GitLab', 'CI/CD', 'Jenkins', 'Jira', 'Figma', 'Agile', 'Scrum', 'Linux', 'Bash', 'Prompt Engineering', 'LLM', 'LangChain'],
    mobile: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Android', 'iOS', 'Expo']
  };

  const allSkills = Object.values(categories).flat();
  const lowerText = text.toLowerCase();
  
  const found = allSkills.filter(skill => {
    const s = skill.toLowerCase();
    if (s.includes('+') || s.includes('.')) return lowerText.includes(s);
    const regex = new RegExp(`\\b${s}\\b`, 'i');
    return regex.test(lowerText);
  });

  // Remove duplicates and return unique list
  return Array.from(new Set(found));
}
