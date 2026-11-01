export const technologies = [
  { id: 'javascript', name: 'JavaScript', category: 'Programming Languages' },
  { id: 'typescript', name: 'TypeScript', category: 'Programming Languages' },
  { id: 'python', name: 'Python', category: 'Programming Languages' },
  { id: 'go', name: 'Go', category: 'Programming Languages' },
  { id: 'php', name: 'PHP', category: 'Programming Languages' },
  { id: 'sql', name: 'SQL', category: 'Programming Languages' },
  { id: 'csharp', name: 'C#', category: 'Programming Languages' },
  { id: 'c', name: 'C', category: 'Programming Languages' },
  { id: 'java', name: 'Java', category: 'Programming Languages' },
  { id: 'astro', name: 'Astro', category: 'Frontend Development' },
  { id: 'react', name: 'React', category: 'Frontend Development' },
  { id: 'react-native', name: 'React Native', category: 'Frontend Development' },
  { id: 'nextjs', name: 'Next.js', category: 'Frontend Development' },
  { id: 'tailwind', name: 'Tailwind CSS', category: 'Frontend Development' },
  { id: 'fastapi', name: 'FastAPI', category: 'Backend and Databases' },
  { id: 'mysql', name: 'MySQL', category: 'Backend and Databases' },
  { id: 'sqlite', name: 'SQLite', category: 'Backend and Databases' },
  { id: 'upstash', name: 'Upstash Redis', category: 'Backend and Databases' },
  { id: 'gemini', name: 'Gemini API', category: 'Backend and Databases' },
  { id: 'nextauth', name: 'NextAuth', category: 'Backend and Databases' },
  { id: 'git', name: 'Git', category: 'Developer Tools' },
  { id: 'github', name: 'GitHub', category: 'Developer Tools' },
  { id: 'vercel', name: 'Vercel', category: 'Developer Tools' },
  { id: 'powerbi', name: 'Power BI', category: 'Developer Tools' },
] as const;

export type TechnologyId = typeof technologies[number]['id'];
export const categories = ['Programming Languages', 'Frontend Development', 'Backend and Databases', 'Developer Tools'] as const;
export const constellationNodes = [
  { id: 'typescript', short: 'TS', x: 242, y: 112 },
  { id: 'nextjs', short: 'Next.js', x: 380, y: 210 },
  { id: 'react', short: 'React', x: 343, y: 375 },
  { id: 'gemini', short: 'Gemini', x: 148, y: 403 },
  { id: 'tailwind', short: 'Tailwind', x: 74, y: 259 },
  { id: 'astro', short: 'Astro', x: 124, y: 111 },
] as const;

export function technologyName(id: TechnologyId): string {
  return technologies.find((technology) => technology.id === id)?.name ?? id;
}
