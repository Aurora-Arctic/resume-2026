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

export interface SkillEntry {
  label: string;
  /** Sub-technologies rendered as an expandable list below the skill when present. */
  subItems?: string[];
}

export interface SkillCategory {
  category: string;
  skills: SkillEntry[];
}

export interface ExperienceEntry {
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
  /** Condensed prose shown in place of `bullets` on the Summary print tier only. */
  summary?: string;
}

export interface ProjectEntry {
  name: string;
  description: string;
  stack: string[];
  link?: string;
  bullets: string[];
  /** Matches an ExperienceEntry.company verbatim, or 'Personal' for projects with no associated job. */
  company: string;
}

export interface EducationEntry {
  institution: string;
  degree: string;
  location: string;
  startDate: string;
  endDate: string;
  /** Rendered below the dates; hidden on the Minimal print tier. */
  honor?: string;
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
      skills: [
        { label: 'Python' },
        { label: 'JavaScript', subItems: ['Node.JS', 'TypeScript', 'jQuery'] },
        { label: 'SQL' },
        { label: 'HTML' },
        { label: 'CSS', subItems: ['Sass', 'Tailwind', 'Foundation', 'Bootstrap'] },
        { label: 'PHP' },
        { label: 'Ruby' },
      ],
    },
    {
      category: 'Frameworks & Tools',
      skills: [
        { label: 'Django' },
        { label: 'React', subItems: ['Next.js', 'Gatsby'] },
        { label: 'Git' },
        { label: 'Express' },
        { label: 'Apollo GraphQL' },
        { label: 'Flask' },
        { label: 'Vue', subItems: ['Nuxt.js'] },
        { label: 'Ruby on Rails' },
        {
          label: 'Design Software',
          subItems: ['Figma', 'Adobe Illustrator/Photoshop', 'Affinity Serif'],
        },
      ],
    },
    {
      category: 'AI Tools',
      skills: [
        { label: 'Claude' },
        { label: 'Co-Pilot' },
        { label: 'Gemini' },
        { label: 'Cursor' },
      ],
    },
    {
      category: 'Testing',
      skills: [
        { label: 'Pytest' },
        { label: 'Jest' },
        { label: 'Playwright' },
        { label: 'Vitest' },
      ],
    },
    {
      category: 'Databases',
      skills: [
        { label: 'MySQL' },
        { label: 'DynamoDB' },
        { label: 'Tonic Data Generator' },
        { label: 'PostgreSQL' },
        { label: 'SQLite' },
      ],
    },
    {
      category: 'Cloud & Infrastructure',
      skills: [
        {
          label: 'AWS',
          subItems: ['CloudFormation', 'Serverless', 'Load Balancing'],
        },
        { label: 'Docker' },
        { label: 'Terraform' },
        { label: 'Linux', subItems: ['Apache2', 'Nginx', 'PM2', 'Gunicorn'] },
      ],
    },
  ],
  experience: [
    {
      company: 'Alma',
      title: 'Senior Backend Engineer & Technical Lead',
      location: 'United States (Remote)',
      startDate: 'July 2022',
      endDate: 'Present',
      bullets: [
        'Drove improvements to CI/CD workflows and performance, reducing costs.',
        'Reduced friction and risk through a new process for protecting private client information.',
        'Technical lead and architect on partner integration initiatives that enabled growth.',
        'Led developer experience improvements that improved developer confidence and reduced friction.',
        'Helped developers with career growth and navigating challenges through mentorship.',
        'Promoted from Backend Engineer III (2022) to Senior Backend Engineer and Technical Lead (2023).',
      ],
      summary:
        'Technical lead and architect driving CI/CD workflow and performance improvements that reduced costs, and a client data protection process that reduced friction and risk. Served as technical lead on partner integration initiatives that enabled company growth, while leading developer experience improvements that boosted developer confidence. Mentored developers through career growth and challenges along the way.',
    },
    {
      company: '14Four',
      title: 'Senior Developer & Team Captain',
      location: 'Spokane, Washington',
      startDate: 'December 2020',
      endDate: 'July 2022',
      bullets: [
        'Created infrastructure and a backend framework that reduced new site creation from 2 days to 2 hours, enabling self-service site creation.',
        'Development of high-traffic marketing campaign sites on AWS infrastructure.',
        'Technical mentor and advisor for both frontend and backend developers.',
      ],
      summary:
        'Built a self-service backend and infra site-creation framework that cut new site turnaround from two days to two hours. Developed high-traffic marketing campaign sites on AWS infrastructure. Served as a technical mentor and advisor for both frontend and backend developers.',
    },
    {
      company: 'Uxiliary',
      title: 'Creative / Full Stack Developer',
      location: 'Spokane, Washington',
      startDate: 'October 2018',
      endDate: 'December 2020',
      bullets: [
        'Adapted to new technologies with inherited projects on the fly, using a range of technologies like Drupal, Ruby on Rails, WordPress, custom PHP sites, and more.',
        'Integrated with various customer systems, including custom inventory APIs and internal APIs.',
        'Assisted with community building through meetups and competitions.',
      ],
      summary:
        'Full-stack developer adapting on the fly to inherited projects across a variety of different tech stacks. Integrated with various customer systems, including custom inventory and internal APIs. Assisted with community building through meetups and competitions.',
    },
  ],
  projects: [
    {
      name: 'FHIR-Based Insurance Partner API',
      description:
        'Designed and built FHIR-based APIs enabling secure data exchange with third-party insurance partners.',
      stack: ['FHIR', 'REST APIs'],
      bullets: [],
      company: 'Alma',
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
      company: '14Four',
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
      company: 'Alma',
    },
    {
      name: 'Automated CI/CD Pipeline',
      description: 'Architected a fully automated CI/CD pipeline in GitHub.',
      stack: ['GitHub Actions', 'Merge Queues', 'Integration Testing', 'E2E Testing'],
      bullets: [
        'Implemented GitHub merge queues and required deploy checks to keep main always releasable.',
        'Built integration and end-to-end test suites gating every merge.',
      ],
      company: 'Alma',
    },
    {
      name: 'EDMO.com',
      description:
        'E-commerce site built with AWS Amplify, using AWS AppSync GraphQL and Craft CMS for marketing content; integrates with customer inventory management.',
      stack: ['AWS Amplify', 'AWS AppSync', 'GraphQL', 'Craft CMS'],
      link: 'https://edmo.com',
      bullets: [],
      company: 'Uxiliary',
    },
    {
      name: 'SumoLogic.com',
      description: 'Load-balanced marketing site built on AWS infrastructure.',
      stack: ['AWS'],
      link: 'https://sumologic.com',
      bullets: [],
      company: 'Uxiliary',
    },
    {
      name: 'Design Bright',
      description:
        'An intuitive web application for creating funding campaigns for nonprofit marketing projects.',
      stack: ['React', 'Express', 'Node.js', 'MySQL'],
      link: 'https://github.com/mjoynes-wombat-web/design-bright-client',
      bullets: [],
      company: 'Personal',
    },
  ],
  education: [
    {
      institution: 'Full Sail University',
      degree: 'Web Design and Development B.S.',
      location: '',
      startDate: '2014',
      endDate: '2017',
      honor: 'Valedictorian',
    },
  ],
};
