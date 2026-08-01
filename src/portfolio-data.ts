export const CV = '/Morteza-Omar-Mohammadi-CV.pdf';
export const EMAIL = 'hi@mortezaom.dev';
export const MAILTO = `mailto:${EMAIL}`;

export const NAV_LINKS = [
  { label: 'Work', href: '#work' },
  { label: 'Experience', href: '#experience' },
  { label: 'About', href: '#about' },
  { label: 'Skills', href: '#skills' },
];

export const EXPERIENCE = [
  {
    start: '2026-01',
    period: 'Jan 2026 — Present',
    role: 'Lead Developer',
    company: 'Pedal24 UG',
    desc: 'Leading development across the Flutter app, backend services, product and order flows, service workflows, and payment systems.',
    stack: ['Flutter', 'TypeScript', 'Node.js', 'Firebase', 'Stripe'],
  },
  {
    start: '2024-11',
    period: 'Nov 2024 — Present',
    role: 'Lead Developer',
    company: 'Bilit Platform FZ-LLC',
    desc: 'Leading engineering across ticketing services, payments, background processing, the customer web application, and the Flutter scanner app.',
    stack: [
      'Node.js',
      'MongoDB',
      'Redis',
      'BullMQ',
      'React',
      'Stripe',
      'Flutter',
    ],
  },
  {
    start: '2022-03',
    period: 'Mar 2022 — Oct 2024',
    role: 'Application Developer',
    company: 'Webfume LLC',
    desc: 'Built and released web and mobile products for clients in a fully remote team using Flutter, Firebase, Vue, and Node.js.',
    stack: ['Flutter', 'Firebase', 'Vue', 'Node.js'],
  },
  {
    start: '2020-03',
    period: 'Mar 2020 — Feb 2022',
    role: 'Web & Mobile Developer',
    company: 'Cynoco.co.uk',
    desc: 'Delivered Vue web interfaces and Flutter and Kotlin mobile applications from design handoff through production release.',
    stack: ['Flutter', 'Vue', 'Kotlin'],
  },
].sort((a, b) => b.start.localeCompare(a.start));

export const SPOTLIGHT_PROJECTS = [
  {
    category: 'Event ticketing',
    name: 'Bilit.Events',
    href: 'https://bilit.events',
    description:
      'An event-ticketing platform covering purchases, payments, seat management, ticket delivery, and event check-in.',
    ownership:
      'I lead engineering across event and order services, Stripe payment flows, background jobs, the customer web application, and the Flutter ticket-scanner app.',
    role: 'Lead Developer · November 2024 — Present',
    technologies: [
      'TypeScript',
      'Node.js',
      'React',
      'Flutter',
      'MongoDB',
      'Redis',
      'Stripe',
    ],
    linkLabel: 'Visit Bilit.Events',
  },
  {
    category: 'Cycling platform',
    name: 'Pedal24',
    href: 'https://pedal24.com',
    description:
      'A cycling platform for bike services, marketplace listings, community events, and useful local spots.',
    ownership:
      'I lead development across the Flutter app, backend services, product and order flows, service workflows, and payment integration.',
    role: 'Lead Developer · January 2026 — Present',
    technologies: ['Flutter', 'TypeScript', 'Node.js', 'Firebase', 'Stripe'],
    linkLabel: 'Visit Pedal24',
  },
];

export const ENGINEERING_PROJECTS = [
  {
    category: 'Open source',
    name: 'Relay Pulse',
    href: 'https://github.com/mortezaom/relay-pulse',
    linkLabel: 'View source',
    status: 'In active development',
    description:
      'An uptime-monitoring platform for HTTP, HTTPS, and TCP services, designed for simple deployment on Cloudflare Workers.',
    technologies: ['TypeScript', 'Next.js', 'Cloudflare Workers', 'Drizzle'],
  },
];

export const ARCHIVE_PROJECTS = [
  {
    name: 'Paper',
    href: 'https://github.com/mortezaom',
    technologies: ['Flutter', 'Firebase', 'Vue 2'],
  },
  { name: 'Farsian', href: undefined, technologies: ['Flutter'] },
];

export const SKILL_GROUPS = [
  { name: 'Web', technologies: ['TypeScript', 'React', 'Next.js', 'Vue'] },
  {
    name: 'Backend',
    technologies: ['Node.js', 'Go', 'PostgreSQL', 'MongoDB', 'Redis'],
  },
  { name: 'Mobile', technologies: ['Flutter', 'Kotlin'] },
  {
    name: 'Infrastructure and services',
    technologies: ['Docker', 'Cloudflare', 'AWS', 'Stripe'],
  },
];

export const STATS: [string, string][] = [
  ['Since 2020', 'Building products'],
  ['Thousands', 'Customers served'],
  ['Evolve + AI', 'Modern tools and workflows'],
];

export const QUICK_LINKS: [string, string][] = [
  ['GitHub', 'https://github.com/mortezaom'],
  ['LinkedIn', 'https://linkedin.com/in/mortezaom'],
  ['Résumé', CV],
];

export const SECTION_IDS = [
  'home',
  'about',
  'work',
  'experience',
  'skills',
  'contact',
];
