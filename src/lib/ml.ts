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
  // Simple heuristic for now - a real implementation would use a specialized model
  // We can use a small NER or just extract nouns/keywords
  const commonSkills = [
    'React', 'TypeScript', 'JavaScript', 'Python', 'Node.js', 'Express',
    'PostgreSQL', 'MongoDB', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
    'Rust', 'Go', 'Java', 'C++', 'Swift', 'Kotlin', 'Tailwind', 'CSS', 'HTML'
  ];
  
  const skills = commonSkills.filter(skill => 
    new RegExp(`\\b${skill}\\b`, 'i').test(text)
  );
  
  return skills;
}
