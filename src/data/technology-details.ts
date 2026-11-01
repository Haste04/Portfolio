import type { TechnologyId } from './technologies';

// Neutral technical definitions; official documentation is linked per entry.
export const technologyDetails = {
  "javascript": {
    "description": "A programming language used to add behavior to web pages and build applications.",
    "documentation": "https://tc39.es/ecma262/"
  },
  "typescript": {
    "description": "A language that extends JavaScript with a type system and compiles to JavaScript.",
    "documentation": "https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html"
  },
  "python": {
    "description": "A general-purpose programming language with dynamic typing and a standard library.",
    "documentation": "https://docs.python.org/3/tutorial/"
  },
  "go": {
    "description": "A compiled programming language with garbage collection and built-in concurrency features.",
    "documentation": "https://go.dev/doc/faq"
  },
  "php": {
    "description": "A scripting language used to generate web content on a server.",
    "documentation": "https://www.php.net/manual/en/introduction.php"
  },
  "sql": {
    "description": "A database language for defining data structures and querying and modifying stored data.",
    "documentation": "https://www.iso.org/standard/76583.html"
  },
  "csharp": {
    "description": "A programming language for building applications on the .NET platform.",
    "documentation": "https://learn.microsoft.com/en-us/dotnet/csharp/tour-of-csharp/overview"
  },
  "c": {
    "description": "A programming language with functions, pointers, and explicit memory management.",
    "documentation": "https://www.open-std.org/jtc1/sc22/wg14/"
  },
  "java": {
    "description": "A programming language and platform for applications that run on the Java Virtual Machine.",
    "documentation": "https://dev.java/learn/"
  },
  "astro": {
    "description": "A web framework that renders content on the server and supports optional client-side components.",
    "documentation": "https://docs.astro.build/en/concepts/why-astro/"
  },
  "react": {
    "description": "A library for building user interfaces from reusable components.",
    "documentation": "https://react.dev/"
  },
  "react-native": {
    "description": "A framework for building native applications using React and platform UI components.",
    "documentation": "https://reactnative.dev/docs/getting-started"
  },
  "nextjs": {
    "description": "A React framework that adds routing, rendering, and server features for web applications.",
    "documentation": "https://nextjs.org/docs"
  },
  "tailwind": {
    "description": "A CSS framework that provides utility classes for styling interfaces.",
    "documentation": "https://tailwindcss.com/docs/styling-with-utility-classes"
  },
  "fastapi": {
    "description": "A Python framework for building web APIs using standard Python type hints.",
    "documentation": "https://fastapi.tiangolo.com/"
  },
  "mysql": {
    "description": "A relational database management system that stores and queries data using SQL.",
    "documentation": "https://dev.mysql.com/doc/refman/8.4/en/what-is-mysql.html"
  },
  "sqlite": {
    "description": "An embedded SQL database engine that reads and writes database files without a separate server.",
    "documentation": "https://www.sqlite.org/about.html"
  },
  "upstash": {
    "description": "A managed Redis-compatible database service with Redis protocol and HTTP API access.",
    "documentation": "https://upstash.com/docs/redis/overall/getstarted"
  },
  "gemini": {
    "description": "An API for using Google generative models to process inputs and generate content.",
    "documentation": "https://ai.google.dev/gemini-api/docs"
  },
  "nextauth": {
    "description": "An authentication library for Next.js applications with sign-in providers and session handling.",
    "documentation": "https://next-auth.js.org/getting-started/introduction"
  },
  "git": {
    "description": "A distributed version control system for tracking changes to files and source code.",
    "documentation": "https://git-scm.com/docs/git"
  },
  "github": {
    "description": "A platform for hosting Git repositories and collaborating through issues and pull requests.",
    "documentation": "https://docs.github.com/en/get-started/start-your-journey/what-is-github"
  },
  "vercel": {
    "description": "A platform for deploying web applications with hosting, delivery, and server functions.",
    "documentation": "https://vercel.com/docs"
  },
  "powerbi": {
    "description": "A business analytics platform for connecting data sources and creating reports and visualizations.",
    "documentation": "https://learn.microsoft.com/en-us/power-bi/fundamentals/power-bi-overview"
  }
} satisfies Record<TechnologyId, { description: string; documentation: string }>;
