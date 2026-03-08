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
  const commonSkills = [
    'React', 'TypeScript', 'JavaScript', 'Python', 'Node.js', 'Express',
    'PostgreSQL', 'MongoDB', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
    'Rust', 'Go', 'Java', 'C++', 'Swift', 'Kotlin', 'Tailwind', 'CSS', 'HTML'
  ];
  
  // Use a simpler search that doesn't trigger "nothing to repeat" errors
  const lowerText = text.toLowerCase();
  return commonSkills.filter(skill => {
    const s = skill.toLowerCase();
    // Check for exact word or handle special cases like C++
    if (s.includes('+') || s.includes('.')) {
      return lowerText.includes(s);
    }
    const regex = new RegExp(`\\b${s}\\b`, 'i');
    return regex.test(lowerText);
  });
}
