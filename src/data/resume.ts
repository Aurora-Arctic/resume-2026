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

// Placeholder content only — each section gets filled out with real content
// in its own follow-up task. Shapes here (one entry per array, one bullet
// per entry) exist to prove the section components render correctly.
export const resumeData: ResumeData = {
  header: {
    name: 'Placeholder Name',
    title: 'Placeholder Title',
    // location/email/phone below are ciphertext, produced via `npm run
    // encrypt:value` — see the HeaderData field comments above. Don't leave
    // a plaintext hint next to these when swapping in real values; that
    // defeats the point. Keep the key that decrypts them out of the repo
    // entirely — including test fixtures (see e2e/contact-encryption.spec.ts).
    location: 'PK2oFvoOQzBvNijJ2MN-UwvurYB3ywueeLAvCZ0crdvR7puFNvIP',
    email: 'eQjuvxGJ8duWWKVphhpoQA7QjnnMIpNJtinrTF8cnPWK0Jco1-9ovYFG',
    phone: 'F7FyYjtp1MQftGdg7K2HU8_6pWlmC46sR7xCmZtmZt7V-HDkAL0fiQ',
    links: [{ label: 'placeholder.dev', href: 'https://placeholder.example.com' }],
  },
  summary: 'Placeholder summary paragraph.',
  skills: [
    { category: 'Languages', skills: ['Placeholder language'] },
    { category: 'Cloud & Infrastructure', skills: ['Placeholder platform'] },
    { category: 'CI/CD & Tooling', skills: ['Placeholder tool'] },
    { category: 'Frameworks & Libraries', skills: ['Placeholder framework'] },
  ],
  experience: [
    {
      company: 'Placeholder Company',
      title: 'Placeholder Role',
      location: 'Placeholder Location',
      startDate: 'Placeholder Start',
      endDate: 'Present',
      bullets: ['Placeholder bullet describing impact.'],
    },
  ],
  projects: [
    {
      name: 'Placeholder Project',
      description: 'Placeholder project description.',
      stack: ['Placeholder tech'],
      link: 'https://placeholder.example.com/project',
      bullets: ['Placeholder bullet describing the project.'],
    },
    {
      name: 'Placeholder Project Without A Link',
      description: 'Placeholder project description.',
      stack: ['Placeholder tech'],
      bullets: ['Placeholder bullet describing the project.'],
    },
  ],
  education: [
    {
      institution: 'Placeholder Institution',
      degree: 'Placeholder Degree',
      location: 'Placeholder Location',
      startDate: 'Placeholder Start',
      endDate: 'Placeholder End',
    },
  ],
};
