export interface ContactLink {
  label: string;
  href: string;
}

export interface HeaderData {
  name: string;
  title: string;
  /** AES-GCM ciphertext (src/utils/crypto.ts) — decrypted client-side via a `?k=` URL param. See claude-docs/CONTACT-ENCRYPTION.md. */
  location: string;
  /** AES-GCM ciphertext (src/utils/crypto.ts) — decrypted client-side via a `?k=` URL param. See claude-docs/CONTACT-ENCRYPTION.md. */
  email: string;
  /** AES-GCM ciphertext (src/utils/crypto.ts) — decrypted client-side via a `?k=` URL param. See claude-docs/CONTACT-ENCRYPTION.md. */
  phone: string;
  links: ContactLink[];
}

export interface SkillCategory {
  category: string;
  skills: string[];
}

export interface ExperienceEntry {
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface ProjectEntry {
  name: string;
  description: string;
  stack: string[];
  link?: string;
  bullets: string[];
}

export interface EducationEntry {
  institution: string;
  degree: string;
  location: string;
  startDate: string;
  endDate: string;
}

export interface ResumeData {
  header: HeaderData;
  summary: string;
  skills: SkillCategory[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  education: EducationEntry[];
}

export const resumeData: ResumeData = {
  header: {
    name: 'Marwynn Joynes',
    title: 'Senior Full Stack Engineer | Technical Lead',
    // location/email/phone below are ciphertext, produced via `npm run
    // encrypt:value` — see the HeaderData field comments above. Don't leave
    // a plaintext hint next to these when swapping in real values; that
    // defeats the point. Keep the key that decrypts them out of the repo
    // entirely — including test fixtures (see e2e/contact-encryption.spec.ts).
    location: 'PK2oFvoOQzBvNijJ2MN-UwvurYB3ywueeLAvCZ0crdvR7puFNvIP',
    email: 'eQjuvxGJ8duWWKVphhpoQA7QjnnMIpNJtinrTF8cnPWK0Jco1-9ovYFG',
    phone: 'F7FyYjtp1MQftGdg7K2HU8_6pWlmC46sR7xCmZtmZt7V-HDkAL0fiQ',
    links: [
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/tofieldya' },
      { label: 'resume.marwynn.net', href: 'https://resume.marwynn.net' },
      { label: 'GitHub', href: 'https://github.com/mjoynes-wombat-web' },
    ],
  },
  summary:
    'Senior backend engineer and technical lead with a decade of design experience before moving into software, now focused on developer experience. Builds serverless infrastructure and robust backend APIs and services, and mentors engineers across the stack. A background spanning both visual design and infrastructure engineering informs a practical, detail-oriented approach to shipping product.',
  skills: [
    {
      category: 'Languages',
      skills: ['JavaScript (ES, jQuery, TypeScript)', 'PHP', 'Python', 'Ruby', 'Go'],
    },
    {
      category: 'Frameworks & Libraries',
      skills: [
        'React (Next.js, Gatsby)',
        'Preact',
        'Vue (Nuxt.js)',
        'Express',
        'Flask',
        'Apollo GraphQL',
        'Ruby on Rails',
        'Tailwind',
        'Bootstrap',
        'Foundation',
      ],
    },
    { category: 'Backend & CMS', skills: ['Node.js', 'Craft CMS', 'WordPress', 'Strapi'] },
    { category: 'Databases', skills: ['MySQL', 'PostgreSQL', 'SQLite', 'DynamoDB'] },
    {
      category: 'Cloud & Infrastructure',
      skills: [
        'AWS (CloudFormation, Serverless, Load Balancing)',
        'Terraform',
        'Docker',
        'Heroku',
        'Vagrant',
        'Linux (Apache2, Nginx, PM2)',
      ],
    },
    {
      category: 'Design & Tooling',
      skills: ['CSS3/Sass', 'HTML', 'Adobe Illustrator/Photoshop/XD', 'Git', 'Mocha/Chai'],
    },
  ],
  experience: [
    {
      company: 'Alma',
      title: 'Senior Backend Engineer & Technical Lead for Developer Experience',
      location: 'United States (Remote)',
      startDate: 'July 2022',
      endDate: 'Present',
      bullets: [
        'Promoted from Backend Engineer III (2022) to Senior Backend Engineer and Technical Lead for Developer Experience (2023).',
      ],
    },
    {
      company: '14Four',
      title: 'Senior Developer & Team Captain',
      location: 'Spokane, Washington',
      startDate: 'December 2020',
      endDate: 'July 2022',
      bullets: [
        'Development of high-traffic marketing campaign sites on AWS infrastructure.',
        'Technical mentor and advisor for both frontend and backend developers.',
      ],
    },
    {
      company: 'Uxiliary',
      title: 'Creative / Full Stack Developer',
      location: 'Spokane, Washington',
      startDate: 'October 2018',
      endDate: 'December 2020',
      bullets: ['Development of various websites from e-commerce to marketing sites.'],
    },
  ],
  projects: [
    {
      name: 'FHIR-Based Insurance Partner API',
      description:
        'Designed and built FHIR-based APIs enabling secure data exchange with third-party insurance partners.',
      stack: ['FHIR', 'REST APIs'],
      bullets: [],
    },
    {
      name: 'Nike Super Bowl Halftime VR Experience',
      description:
        'Serverless infrastructure supporting a large-scale, time-boxed live VR activation.',
      stack: ['AWS', 'Serverless', 'CloudWatch'],
      bullets: [
        'Managed serverless infrastructure, coordinating with an AWS SRE to scale ahead of demand.',
        'Implemented multi-region fallbacks to protect against AWS regional incidents.',
        'Built monitoring and alerting to surface developing issues before they became outages.',
      ],
    },
    {
      name: 'Sanitized Data Pipeline',
      description:
        'Data sanitization pipeline ensuring PHI/PII never leaked into lower environments or local development.',
      stack: ['Tonic', 'ECS', 'EFS', 'S3 Transfer Acceleration'],
      bullets: [
        'Used Tonic to generate sanitized data for lower environments and local development.',
        'Built a compressed local-development backup system using ECS, EFS, and S3 Transfer Acceleration to work around size/performance limitations.',
      ],
    },
    {
      name: 'Automated CI/CD Pipeline',
      description: 'Architected a fully automated CI/CD pipeline in GitHub.',
      stack: ['GitHub Actions', 'Merge Queues', 'Integration Testing', 'E2E Testing'],
      bullets: [
        'Implemented GitHub merge queues and required deploy checks to keep main always releasable.',
        'Built integration and end-to-end test suites gating every merge.',
      ],
    },
    {
      name: 'EDMO.com',
      description:
        'E-commerce site built with AWS Amplify, using AWS AppSync GraphQL and Craft CMS for marketing content; integrates with customer inventory management.',
      stack: ['AWS Amplify', 'AWS AppSync', 'GraphQL', 'Craft CMS'],
      link: 'https://edmo.com',
      bullets: [],
    },
    {
      name: 'SumoLogic.com',
      description: 'Load-balanced marketing site built on AWS infrastructure.',
      stack: ['AWS'],
      link: 'https://sumologic.com',
      bullets: [],
    },
    {
      name: 'Design Bright',
      description:
        'An intuitive web application for creating funding campaigns for nonprofit marketing projects.',
      stack: ['React', 'Express', 'Node.js', 'MySQL'],
      link: 'https://github.com/mjoynes-wombat-web/design-bright-client',
      bullets: [],
    },
    {
      name: 'Marwynn.net',
      description: 'Personal portfolio site.',
      stack: ['Gatsby', 'React', 'Node.js'],
      link: 'https://marwynn.net',
      bullets: [],
    },
  ],
  education: [
    {
      institution: 'Full Sail University',
      degree: 'Bachelor of Science (B.S.), Web Design and Development — Valedictorian',
      location: '',
      startDate: '2014',
      endDate: 'August 2017',
    },
  ],
};
