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
  github?: string;
  bullets: string[];
  /** Condensed prose shown on the Summary/Minimal/Application print tiers. */
  summary?: string;
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
    'Senior full-stack engineer and technical lead with a decade of design experience before moving into engineering. Led partner integrations and compliance-sensitive systems, including healthcare data exchange and PHI/PII sanitization pipelines. Architected serverless and CI/CD infrastructure, cutting CI runtime and cost by ~30%. Mentored engineers across the stack. Increasingly works with AI-assisted engineering tooling to ship faster without sacrificing quality.',
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
        { label: 'Data Sanitization Tooling' },
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
      endDate: 'July 2026',
      bullets: [
        'Cut costs by improving CI/CD workflows and performance.',
        'Introduced a client-data protection process that reduced friction and risk.',
        'Tech lead/architect for partner integrations that enabled company growth.',
        'Led developer experience improvements that improved developer confidence and reduced friction.',
        'Mentored engineers on career growth and problem-solving.',
        'Promoted from Backend Engineer III (2022) to Senior Backend Engineer and Technical Lead (2023).',
      ],
      summary:
        'Technical lead and architect driving CI/CD improvements, a client-data protection process, and growth-enabling partner integrations. Improved developer experience and mentored engineers through career growth and challenges.',
    },
    {
      company: '14Four',
      title: 'Senior Developer & Team Captain',
      location: 'Spokane, Washington',
      startDate: 'December 2020',
      endDate: 'July 2022',
      bullets: [
        'Build a self-service full stack framework that cut new-site initialization from 2 days to 2 hours.',
        'Built high-traffic marketing campaign sites on AWS.',
        'Technical mentor and advisor for both frontend and backend developers.',
      ],
      summary:
        'Built a self-service backend and infra site-creation framework that cut new site turnaround from two days to two hours, and developed high-traffic marketing campaign sites on AWS infrastructure. Served as a technical mentor and advisor for both frontend and backend developers.',
    },
    {
      company: 'Uxiliary',
      title: 'Creative / Full Stack Developer',
      location: 'Spokane, Washington',
      startDate: 'October 2018',
      endDate: 'December 2020',
      bullets: [
        'Picked up new stacks fast on inherited projects (Drupal, Rails, WordPress, custom PHP).',
        'Integrated with customer systems, including custom inventory and internal APIs.',
        'Assisted with community building through meetups and competitions.',
      ],
      summary:
        'Full-stack developer adapting on the fly to inherited projects across a variety of tech stacks, and integrating with various customer systems including custom inventory and internal APIs. Assisted with community building through meetups and competitions.',
    },
  ],
  projects: [
    {
      name: 'Insurance Partner Data Exchange API',
      description:
        'Designed and built healthcare-standard APIs enabling secure data exchange with third-party insurance partners.',
      stack: ['REST APIs', 'Healthcare Data Standards'],
      summary:
        'Built healthcare-standard REST APIs for secure data exchange with an insurance partner. Led discovery, validation rules, and testing in direct partnership with their team.',
      bullets: [
        'Built a secure API per partner-specified Healthcare Data Standards rules.',
        'Implemented clear validation and error rules.',
        'Partnered with the insurer on discovery, planning, implementation, and testing.',
      ],
      company: 'Alma',
    },
    {
      name: 'Nike Super Bowl Halftime VR Experience',
      description:
        'Serverless infrastructure supporting a large-scale, time-boxed live VR activation.',
      stack: ['AWS', 'Serverless', 'CloudWatch'],
      summary:
        'Ran serverless AWS infrastructure for a live Super Bowl VR activation, scaling ahead of demand with an AWS SRE. Added multi-region fallbacks and monitoring to catch issues before they became outages.',
      bullets: [
        'Managed serverless infrastructure, coordinating with an AWS SRE to scale ahead of demand.',
        'Implemented multi-region fallbacks to protect against AWS regional incidents.',
        'Built monitoring and alerting to surface developing issues before they became outages.',
      ],
      company: '14Four',
    },
    {
      name: 'Panda Express Chinese New Year Sweepstakes',
      description:
        "Sweepstakes site for Panda Express's Chinese New Year campaign, built on serverless infra to absorb large traffic spikes.",
      stack: ['AWS Lambda', 'Serverless Aurora', 'GraphQL', 'Vue.js'],
      summary:
        'Built a serverless sweepstakes site on AWS Lambda and Aurora to absorb unpredictable traffic spikes. Delivered the GraphQL backend and co-built the Vue.js frontend.',
      bullets: [
        'Managed serverless infrastructure and a serverless database to handle unpredictable traffic spikes.',
        'Built a backend GraphQL API.',
        'Built the frontend Vue.js site alongside a frontend developer.',
      ],
      company: '14Four',
    },
    {
      name: 'Sanitized Data Pipeline',
      description:
        'Data sanitization pipeline ensuring PHI/PII never leaked into lower environments or local development.',
      stack: ['Data Sanitization Tooling', 'ECS', 'EFS', 'S3 Transfer Acceleration'],
      summary:
        'Automated a data sanitization pipeline keeping PHI/PII out of lower environments and local development. Built a compressed local backup system on ECS, EFS, and S3 Transfer Acceleration.',
      bullets: [
        'Used automated data sanitization tooling to generate sanitized data for lower environments and local development.',
        'Built a compressed local-development backup system using ECS, EFS, and S3 Transfer Acceleration to work around size/performance limitations.',
      ],
      company: 'Alma',
    },
    {
      name: 'Automated CI/CD Pipeline',
      description: 'Architected a fully automated CI/CD pipeline in GitHub.',
      stack: ['GitHub Actions', 'Merge Queues', 'Integration Testing', 'E2E Testing'],
      summary:
        'Architected a fully automated CI/CD pipeline in GitHub Actions with merge queues and required deploy checks. Built the integration and e2e suites gating every merge.',
      bullets: [
        'Implemented GitHub merge queues and required deploy checks to keep main always releasable.',
        'Built integration and end-to-end test suites gating every merge.',
      ],
      company: 'Alma',
    },
    {
      name: '3rd-Party CI Runner Migration',
      description:
        'Migrated CI workloads from GitHub-hosted runners to third-party CI runners for better reliability, faster run times, easier resource allocation, and lower cost.',
      stack: ['GitHub Actions', 'GitHub API', 'CI/CD'],
      summary:
        'Migrated CI from GitHub-hosted to third-party runners for better reliability and easier scaling. Cut CI runtime and costs by roughly 30%.',
      bullets: [
        'Migrated GitHub Actions workflows from GitHub-hosted runners to third-party CI runners.',
        'Tuned CI runner resource allocation for the most time- and cost-efficient runs.',
        'Cut CI runtime and cost by ~30%.',
      ],
      company: 'Alma',
    },
    {
      name: 'EDMO.com',
      description:
        'E-commerce site on AWS Amplify with AppSync GraphQL and Craft CMS, integrated with customer inventory management.',
      stack: ['AWS Amplify', 'AWS AppSync', 'GraphQL', 'Craft CMS'],
      link: 'https://edmo.com',
      summary:
        "Built an e-commerce site on AWS Amplify with AppSync GraphQL and Craft CMS, syncing data with the client's inventory API. Hardened authentication and migrated legacy users to better practices.",
      bullets: [
        "Integrated with client's custom internal inventory management API.",
        'Hardened authentication and migrated legacy users to better practices.',
        "Implemented data syncing to and from client's system.",
      ],
      company: 'Uxiliary',
    },
    {
      name: 'SumoLogic.com',
      description: 'Load-balanced marketing site built on AWS infrastructure.',
      stack: ['AWS CodePipeline', 'AWS ECS', 'Craft CMS'],
      link: 'https://sumologic.com',
      summary:
        'Built a load-balanced marketing site on AWS ECS with a custom Craft CMS build. Partnered with a third-party infra team on CI/CD.',
      bullets: [
        'Developed frontend of website to match client specs.',
        'Worked with 3rd party infrastructure team to develop CI/CD processes.',
        'Created custom Craft CMS implementation.',
      ],
      company: 'Uxiliary',
    },
    {
      name: 'Resume Site',
      description:
        'Full CI/CD and 80%+ test coverage for a personal resume? Overkill, sure — but it showcases my skills. ;)',
      stack: ['Github Actions', 'Vitest', 'Playwright', 'Gatsby', 'TypeScript'],
      link: 'https://resume.marwynn.net',
      github: 'https://github.com/Aurora-Arctic/resume-2026',
      summary:
        'Is it overkill to implement full CI/CD and 80%+ test coverage for a personal resume? Sure — it showcases my skills. Demonstrates CI/CD, testing depth, frontend breadth, and AI-assisted engineering (Claude Code).',
      bullets: [
        'Designed and built a fully static site with Gatsby, React, and TypeScript.',
        'Implemented client-side encryption for contact information with AES-256-GCM.',
        'Built a light/dark theme toggle with synchronized SSR to prevent flash-of-unstyled-content.',
        'Engineered responsive design with print layouts optimized for ATS (Applicant Tracking Systems).',
        'Set up CI/CD with GitHub Actions, merge queues, and automated testing (Vitest and Playwright).',
      ],
      company: 'Personal',
    },
    {
      name: 'Design Bright',
      description:
        'An intuitive web application for creating funding campaigns for nonprofit marketing projects.',
      stack: ['React', 'Express', 'Node.js', 'MySQL'],
      link: 'https://github.com/mjoynes-wombat-web/design-bright-client',
      summary:
        'Independently designed and built a full-stack React/Express/MySQL app for nonprofit fundraising campaigns. Delivered as a final school project with a perfect score.',
      bullets: [
        'Independently planned, designed, and built the full-stack app.',
        'Learned new technologies on the fly while still meeting deadlines.',
        'Received 100% as my final project for school.',
      ],
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
