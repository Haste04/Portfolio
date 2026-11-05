import type { TechnologyId } from "./technologies";

export interface Project {
  readonly id: string;
  readonly number: string;
  readonly title: string;
  readonly category: string;
  readonly role: string;
  readonly description: string;
  readonly status: string;
  readonly live: string;
  readonly github?: string;
  readonly technologyIds: readonly TechnologyId[];
  readonly evidence: string;
  readonly media: {
    readonly source: string;
    readonly width: number;
    readonly height: number;
    readonly alt: string;
  };
  readonly publication: "public" | "pending";
  readonly context: string;
  readonly contributions: readonly string[];
  readonly reflection: string;
}

export const projects = [
  {
    id: "anthea",
    number: "01",
    title: "Anthea",
    category: "AI-powered plant care",
    role: "Project Manager & Full-Stack Developer",
    status: "Team project",
    description:
      "A plant-care application with Cactea, an interactive AI assistant that helps make caring for plants more approachable.",
    live: "https://anthea-ruby.vercel.app/",
    github: "https://github.com/Haste04/Anthea",
    technologyIds: [
      "nextjs",
      "typescript",
      "react",
      "tailwind",
      "gemini",
      "upstash",
      "git",
      "github",
      "vercel",
    ],
    evidence: "Public package manifest and supplied resume.",
    media: {
      source: "project-assets/anthea/homepage.png",
      width: 1333,
      height: 609,
      alt: "Anthea homepage with its green Cactea assistant and plant-care introduction.",
    },
    publication: "public",
    context:
      "Built collaboratively as an AI-powered plant-care application. Cactea gives the product a character-led interface for exploring plant care.",
    contributions: [
      "Managed the project and coordinated development.",
      "Developed frontend interfaces and backend functionality.",
      "Integrated APIs and configured the credentials needed by the application.",
    ],
    reflection:
      "This project brought product coordination and full-stack implementation together, with a focus on making technical capabilities approachable through the interface.",
  },
  {
    id: "lifevent",
    number: "02",
    title: "Lifevent",
    category: "Enterprise exhibition intelligence",
    role: "Contributor: Login UI/UX & Rate Limiting",
    status: "Collaborative company project",
    description:
      "An enterprise platform for exhibition intelligence. My contribution focused on the login experience and rate limiting.",
    live: "https://phlifevent.vercel.app/",
    technologyIds: ["nextjs", "typescript", "tailwind", "nextauth", "vercel"],
    evidence:
      "Stack listed in the supplied resume; Next.js confirmed in public deployment assets. Contribution scope follows the explicit brief.",
    media: {
      source: "project-assets/lifevent/homepage.png",
      width: 1348,
      height: 614,
      alt: "Lifevent platform homepage introducing its exhibition intelligence offering.",
    },
    publication: "public",
    context:
      "Lifevent is a collaborative company platform. The homepage shown introduces the wider product; my work focused on login UI/UX and rate limiting.",
    contributions: [
      "Improved the login page UI and user experience.",
      "Implemented rate limiting for the login experience.",
    ],
    reflection:
      "The work focused on a clear, usable entry point and more controlled authentication requests. The company repository is private.",
  },
  {
    id: "seek-first-books",
    number: "03",
    title: "Seek First Books",
    category: "Solo commissioned website",
    role: "Independent Web Designer & Frontend Developer",
    status: "Client commission",
    description:
      "An independently designed bookkeeping website, pairing editorial typography with a clear business-oriented layout.",
    live: "https://seek-alpha.vercel.app/",
    github: "https://github.com/Haste04/Bookkeeping-Landing-Page",
    technologyIds: [
      "astro",
      "tailwind",
      "typescript",
      "git",
      "github",
      "vercel",
    ],
    evidence: "Public package manifest and supplied resume.",
    media: {
      source: "project-assets/seek-first-books/homepage.png",
      width: 1333,
      height: 612,
      alt: "Seek First Books homepage with editorial typography, a client portrait and a bookkeeping introduction.",
    },
    publication: "public",
    context:
      "A solo commissioned client website. I independently handled the website design and frontend development.",
    contributions: [
      "Designed the website visual identity and editorial typography.",
      "Built responsive layouts and modular frontend components.",
      "Organized business information into a clear, service-focused experience.",
    ],
    reflection:
      "The commission demonstrates independent client work: connecting visual direction, readable content and responsive implementation.",
  },
  {
    id: "philchan-cebu",
    number: "04",
    title: "PhilCHAN Cebu",
    category: "Community healthcare website",
    role: "Project Manager & Frontend Designer",
    status: "Unreleased Client Project",
    description:
      "A community healthcare client website that reached deployment readiness before its intended launch was cancelled.",
    live: "https://philchan-cebu.vercel.app/",
    github: "https://github.com/Haste04/Philchan-Cebu",
    technologyIds: ["astro", "tailwind", "git", "github", "vercel"],
    evidence:
      "Public package manifest; role and release status confirmed in the explicit brief.",
    media: {
      source: "project-assets/philchan-cebu/homepage.png",
      width: 1327,
      height: 612,
      alt: "Local-only PhilCHAN Cebu website preview with its healthcare introduction and community clinic photograph.",
    },
    publication: "pending",
    context:
      "The website reached deployment readiness and a custom domain had been secured for its intended release. It did not officially launch.",
    contributions: [
      "Managed the project during preparation for release.",
      "Designed the frontend and the presentation of healthcare information.",
    ],
    reflection:
      "The launch was cancelled by the client. This is presented as an unreleased project, without implying client adoption.",
  },
] as const satisfies readonly Project[];
