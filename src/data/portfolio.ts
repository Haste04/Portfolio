export interface PortfolioSection {
  readonly id: string;
  readonly number: string;
  readonly label: string;
  readonly navigationLabel: string;
  readonly heading: string;
}

export const portfolio = {
  name: 'Haggai Estavilla',
  title: 'Software Developer',
  description: 'The personal portfolio of Haggai Estavilla, a Computer Science student and software developer.',
} as const;

export const sections = [
  { id: 'home', number: '01', label: 'Hero', navigationLabel: 'Home', heading: 'Haggai Estavilla — Software Developer' },
  { id: 'about', number: '02', label: 'About', navigationLabel: 'About', heading: 'MORE THAN JUST CODE' },
  { id: 'education', number: '03', label: 'Education', navigationLabel: 'Education', heading: 'WHERE IT ALL BEGAN' },
  { id: 'projects', number: '04', label: 'Projects', navigationLabel: 'Projects', heading: "THINGS I'VE BUILT" },
  { id: 'tech-stack', number: '05', label: 'Tech Stack', navigationLabel: 'Tech Stack', heading: 'BUILT WITH CURIOSITY' },
  { id: 'experience', number: '06', label: 'Experience', navigationLabel: 'Experience', heading: 'LEARNING BY BUILDING' },
  { id: 'contact', number: '07', label: 'Contact', navigationLabel: 'Contact', heading: "LET'S BUILD SOMETHING GREAT" },
] as const satisfies readonly PortfolioSection[];
