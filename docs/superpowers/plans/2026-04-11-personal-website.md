# Personal Website (imaanali.com) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a cinematic personal brand website for Imaan Ali at imaanali.com — maroon-on-black aesthetic, three work detail pages, deployed via Docker to Coolify.

**Architecture:** Static-ish Next.js 14 App Router site. All content lives in `src/lib/content.ts`. Components are small and focused. No database, no auth, no CMS.

**Tech Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion · Playfair Display + Inter (Google Fonts) · Jest + React Testing Library · Docker → Coolify

**Spec:** `docs/superpowers/specs/2026-04-11-personal-website-design.md`

---

## Task 1: Scaffold the Next.js project

**Files:**
- Create: `~/Documents/Imaan Ali Folder/imaanali-website/` (new project root)

- [ ] **Step 1: Scaffold the project**

```bash
cd ~/Documents/Imaan\ Ali\ Folder
npx create-next-app@latest imaanali-website \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack
cd imaanali-website
```

- [ ] **Step 2: Install dependencies**

```bash
npm install framer-motion
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event ts-jest
```

- [ ] **Step 3: Configure Jest**

Create `jest.config.ts`:
```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
}

export default createJestConfig(config)
```

Create `jest.setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Verify scaffold works**

```bash
npm run dev
```
Expected: Next.js dev server running at http://localhost:3000 with default page.

- [ ] **Step 5: Delete boilerplate**

Remove the default content from `src/app/page.tsx` (replace with just `export default function Home() { return <main /> }`).
Remove all content from `src/app/globals.css` except the `@tailwind` directives.

- [ ] **Step 6: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js 14 project with Tailwind, Framer Motion, Jest"
```

---

## Task 2: Configure design tokens, fonts, and global styles

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/layout.test.tsx`:
```tsx
import { render } from '@testing-library/react'

// Test that our CSS custom properties exist on :root
// We do this by checking Tailwind config exports the right colors
import tailwindConfig from '../../tailwind.config'

describe('design tokens', () => {
  it('defines maroon as primary color', () => {
    const colors = tailwindConfig.theme?.extend?.colors as Record<string, Record<string, string>>
    expect(colors['maroon']['500']).toBe('#c0392b')
  })

  it('defines near-black as background', () => {
    const colors = tailwindConfig.theme?.extend?.colors as Record<string, Record<string, string>>
    expect(colors['ink']['900']).toBe('#0e0608')
  })

  it('defines cream as primary text', () => {
    const colors = tailwindConfig.theme?.extend?.colors as Record<string, Record<string, string>>
    expect(colors['cream']['100']).toBe('#f5ebe0')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/components/__tests__/layout.test.tsx
```
Expected: FAIL — tailwind config does not have these colors yet.

- [ ] **Step 3: Update tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          400: '#c0392b',
          500: '#c0392b',
          700: '#721c24',
          900: '#3d1015',
        },
        ink: {
          900: '#0e0608',
          800: '#1a0a0e',
        },
        cream: {
          100: '#f5ebe0',
          300: '#d4c4b0',
          500: '#b5a898',
        },
        muted: '#555555',
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 4: Update src/app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    scroll-behavior: smooth;
  }

  body {
    @apply bg-ink-900 text-cream-100 font-sans;
  }

  ::selection {
    @apply bg-maroon-700 text-cream-100;
  }
}
```

- [ ] **Step 5: Update src/app/layout.tsx with fonts**

```tsx
import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  title: 'Imaan Ali',
  description: 'Thinker. Builder. Changemaker.',
  openGraph: {
    title: 'Imaan Ali',
    description: 'Thinker. Builder. Changemaker.',
    url: 'https://imaanali.com',
    siteName: 'Imaan Ali',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npx jest src/components/__tests__/layout.test.tsx
```
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add design tokens, fonts, global styles"
```

---

## Task 3: Content file

**Files:**
- Create: `src/lib/content.ts`
- Create: `src/lib/__tests__/content.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/content.test.ts`:
```typescript
import { siteContent } from '../content'

describe('siteContent', () => {
  it('has correct email', () => {
    expect(siteContent.contact.email).toBe('imaan@siiea.ai')
  })

  it('has correct linkedin url', () => {
    expect(siteContent.contact.linkedin).toBe('https://www.linkedin.com/in/imaan-ali-8857a0308')
  })

  it('has exactly 3 work items', () => {
    expect(siteContent.work).toHaveLength(3)
  })

  it('each work item has required fields', () => {
    siteContent.work.forEach(item => {
      expect(item.title).toBeTruthy()
      expect(item.description).toBeTruthy()
      expect(item.tag).toBeTruthy()
      expect(item.href).toBeTruthy()
    })
  })

  it('has a value statement', () => {
    expect(siteContent.value).toBeTruthy()
    expect(siteContent.value).toBe('Carpe Diem.')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/lib/__tests__/content.test.ts
```
Expected: FAIL — content.ts does not exist yet.

- [ ] **Step 3: Create src/lib/content.ts**

```typescript
export const siteContent = {
  name: {
    first: 'Imaan',
    last: 'Ali.',
  },
  tagline: 'Thinker. Builder. Changemaker.',
  value: 'Carpe Diem.',
  about: {
    paragraphs: [
      "I'm a high school student doing work most people wait until grad school to attempt. As a Research Assistant at Brown University, I contribute to a collaborative digital archive documenting the histories of Indigenous enslavement in the Americas — working alongside Indigenous scholars, community partners, and academic researchers to ensure historical accuracy and cultural sensitivity.",
      "I'm also the author of Chains of Captivity, Colonial Power, and Archival Erasure — a research paper on Native American slavery and the epistemological structures that erased it from the historical record. And I hold a provisional patent for OCCT, a system that tracks whether politicians actually keep their promises. History, technology, and justice are inseparable. That's what I build toward.",
    ],
  },
  work: [
    {
      title: 'Research Assistant, Brown University',
      description:
        'Collaborative digital archive documenting histories of Indigenous enslavement in the Americas. Working with Indigenous scholars, community partners, and academic researchers.',
      tag: 'Archival Research · Decolonial Practice',
      href: '/work/brown-ra',
    },
    {
      title: 'Chains of Captivity',
      description:
        'Research paper analyzing Native American slavery in colonial North America through colonial print culture and decolonial epistemological critique. Primary sources: Library of Congress.',
      tag: 'History · Decolonial Research',
      href: '/work/chains-of-captivity',
    },
    {
      title: 'OCCT — Organizational Commitment Chain Tracker',
      description:
        'A software system that tracks whether politicians keep their promises — scoring fidelity across five dimensions: amount, scope, timeline, population, and mechanism. Provisional patent holder.',
      tag: 'Civic Tech · Intellectual Property',
      href: '/work/patent',
    },
  ],
  contact: {
    email: 'imaan@siiea.ai',
    linkedin: 'https://www.linkedin.com/in/imaan-ali-8857a0308',
    note: 'I respond to everything.',
  },
}

export type WorkItem = (typeof siteContent.work)[number]
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/lib/__tests__/content.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add content data file with all copy"
```

---

## Task 4: Nav component

**Files:**
- Create: `src/components/Nav.tsx`
- Create: `src/components/__tests__/Nav.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/Nav.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import Nav from '../Nav'

describe('Nav', () => {
  it('renders the IA monogram', () => {
    render(<Nav />)
    expect(screen.getByText('IA')).toBeInTheDocument()
  })

  it('renders Work link', () => {
    render(<Nav />)
    expect(screen.getByRole('link', { name: 'Work' })).toBeInTheDocument()
  })

  it('renders About link', () => {
    render(<Nav />)
    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument()
  })

  it('renders Contact link', () => {
    render(<Nav />)
    expect(screen.getByRole('link', { name: 'Contact' })).toBeInTheDocument()
  })

  it('monogram links to home', () => {
    render(<Nav />)
    const monogram = screen.getByText('IA').closest('a')
    expect(monogram).toHaveAttribute('href', '/')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/components/__tests__/Nav.test.tsx
```
Expected: FAIL — Nav component does not exist.

- [ ] **Step 3: Create src/components/Nav.tsx**

```tsx
'use client'

export default function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5">
      <a
        href="/"
        className="font-serif text-lg font-bold text-maroon-500 tracking-widest hover:text-maroon-400 transition-colors"
      >
        IA
      </a>
      <div className="flex items-center gap-8">
        {(['Work', 'About', 'Contact'] as const).map((item) => (
          <a
            key={item}
            href={`#${item.toLowerCase()}`}
            className="text-xs tracking-[0.2em] uppercase text-cream-500 hover:text-cream-100 transition-colors"
          >
            {item}
          </a>
        ))}
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/components/__tests__/Nav.test.tsx
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add Nav component"
```

---

## Task 5: ScrollIndicator component

**Files:**
- Create: `src/components/ScrollIndicator.tsx`
- Create: `src/components/__tests__/ScrollIndicator.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/ScrollIndicator.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import ScrollIndicator from '../ScrollIndicator'

describe('ScrollIndicator', () => {
  it('renders without crashing', () => {
    const { container } = render(<ScrollIndicator />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('has scroll-down aria-label for accessibility', () => {
    render(<ScrollIndicator />)
    expect(screen.getByLabelText('Scroll down')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/components/__tests__/ScrollIndicator.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Create src/components/ScrollIndicator.tsx**

```tsx
'use client'

import { motion } from 'framer-motion'

export default function ScrollIndicator() {
  return (
    <motion.div
      aria-label="Scroll down"
      className="flex flex-col items-center gap-1"
      animate={{ y: [0, 8, 0] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="w-px h-6 bg-maroon-500 opacity-60" />
      <div
        className="w-0 h-0"
        style={{
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderTop: '5px solid #c0392b',
          opacity: 0.6,
        }}
      />
    </motion.div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/components/__tests__/ScrollIndicator.test.tsx
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add animated ScrollIndicator component"
```

---

## Task 6: Hero section

**Files:**
- Create: `src/components/Hero.tsx`
- Create: `src/components/__tests__/Hero.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/Hero.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import Hero from '../Hero'

describe('Hero', () => {
  it('renders first name', () => {
    render(<Hero />)
    expect(screen.getByText('Imaan')).toBeInTheDocument()
  })

  it('renders last name', () => {
    render(<Hero />)
    expect(screen.getByText('Ali.')).toBeInTheDocument()
  })

  it('renders tagline', () => {
    render(<Hero />)
    expect(screen.getByText('Thinker. Builder. Changemaker.')).toBeInTheDocument()
  })

  it('renders the IA monogram in the hero', () => {
    render(<Hero />)
    // Hero is full screen — photo placeholder should exist
    expect(screen.getByRole('img', { name: /photo placeholder/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/components/__tests__/Hero.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Create src/components/Hero.tsx**

```tsx
'use client'

import { motion } from 'framer-motion'
import ScrollIndicator from './ScrollIndicator'
import { siteContent } from '@/lib/content'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] },
  }),
}

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-end pb-20 px-10 md:px-20 overflow-hidden"
    >
      {/* Photo placeholder — bleeds into background */}
      <div className="absolute inset-0 flex items-center justify-end pointer-events-none">
        <div className="relative w-1/3 h-3/4 mr-10 md:mr-20">
          {/* Replace src with real photo later */}
          <img
            src="/photo-placeholder.jpg"
            alt="Photo placeholder"
            className="w-full h-full object-cover opacity-30 grayscale"
            style={{
              maskImage: 'linear-gradient(to left, rgba(0,0,0,0.6), transparent)',
              WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.6), transparent)',
            }}
          />
          {/* Maroon tint overlay */}
          <div className="absolute inset-0 bg-maroon-900 mix-blend-multiply opacity-50" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl">
        <motion.p
          custom={0.1}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-xs tracking-[0.3em] uppercase text-maroon-500 mb-4"
        >
          Pre-Law · Civic Tech · Researcher
        </motion.p>

        <motion.h1
          custom={0.25}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="font-serif text-7xl md:text-9xl font-bold text-cream-100 leading-none"
        >
          {siteContent.name.first}
          <br />
          {siteContent.name.last}
        </motion.h1>

        <motion.div
          custom={0.4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex items-center gap-4 mt-6"
        >
          <div className="w-8 h-px bg-maroon-500" />
          <p className="text-sm tracking-[0.15em] uppercase text-cream-300">
            {siteContent.tagline}
          </p>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        custom={0.8}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <ScrollIndicator />
      </motion.div>
    </section>
  )
}
```

- [ ] **Step 4: Create a placeholder image**

```bash
# Create a simple dark placeholder (1x1 dark pixel as base64 png)
# This prevents a broken image until a real photo is added
curl -s "https://via.placeholder.com/600x900/0e0608/0e0608.png" -o public/photo-placeholder.jpg 2>/dev/null || \
  node -e "
    const { createCanvas } = require('canvas');
    // Fallback: just create empty file
  " 2>/dev/null || \
  touch public/photo-placeholder.jpg
```

If the above curl fails (no internet), just create a dark 1x1 PNG:
```bash
echo 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' | base64 -d > public/photo-placeholder.jpg
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx jest src/components/__tests__/Hero.test.tsx
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add Hero section with Framer Motion animations"
```

---

## Task 7: About section

**Files:**
- Create: `src/components/About.tsx`
- Create: `src/components/__tests__/About.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/About.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import About from '../About'

describe('About', () => {
  it('renders both paragraphs', () => {
    render(<About />)
    expect(screen.getByText(/high school student/i)).toBeInTheDocument()
    expect(screen.getByText(/Chains of Captivity/i)).toBeInTheDocument()
  })

  it('has the correct section id for nav anchoring', () => {
    const { container } = render(<About />)
    expect(container.querySelector('#about')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/components/__tests__/About.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Create src/components/About.tsx**

```tsx
'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { siteContent } from '@/lib/content'

export default function About() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="about" className="py-32 px-10 md:px-20 max-w-4xl">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 32 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-xs tracking-[0.3em] uppercase text-maroon-500 mb-8">About</p>
        <div className="space-y-6">
          {siteContent.about.paragraphs.map((paragraph, i) => (
            <p key={i} className="text-lg md:text-xl text-cream-300 leading-relaxed font-serif">
              {paragraph}
            </p>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/components/__tests__/About.test.tsx
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add About section"
```

---

## Task 8: WorkCard component

**Files:**
- Create: `src/components/WorkCard.tsx`
- Create: `src/components/__tests__/WorkCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/WorkCard.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import WorkCard from '../WorkCard'
import type { WorkItem } from '@/lib/content'

const mockItem: WorkItem = {
  title: 'Test Project',
  description: 'A test description for this project.',
  tag: 'Research · Tech',
  href: '/work/test',
}

describe('WorkCard', () => {
  it('renders the title', () => {
    render(<WorkCard item={mockItem} />)
    expect(screen.getByText('Test Project')).toBeInTheDocument()
  })

  it('renders the description', () => {
    render(<WorkCard item={mockItem} />)
    expect(screen.getByText('A test description for this project.')).toBeInTheDocument()
  })

  it('renders the tag', () => {
    render(<WorkCard item={mockItem} />)
    expect(screen.getByText('Research · Tech')).toBeInTheDocument()
  })

  it('links to the correct href', () => {
    render(<WorkCard item={mockItem} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/work/test')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/components/__tests__/WorkCard.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Create src/components/WorkCard.tsx**

```tsx
'use client'

import { motion } from 'framer-motion'
import type { WorkItem } from '@/lib/content'

export default function WorkCard({ item }: { item: WorkItem }) {
  return (
    <motion.a
      href={item.href}
      whileHover={{ borderColor: '#c0392b' }}
      className="block border border-cream-100/10 p-8 transition-colors duration-300 cursor-pointer group"
      style={{ borderColor: 'rgba(245,235,224,0.1)' }}
    >
      <p className="text-xs tracking-[0.2em] uppercase text-maroon-500 mb-4">{item.tag}</p>
      <h3 className="font-serif text-xl text-cream-100 mb-4 group-hover:text-white transition-colors">
        {item.title}
      </h3>
      <p className="text-sm text-cream-500 leading-relaxed">{item.description}</p>
      <div className="flex items-center gap-2 mt-6">
        <div className="w-4 h-px bg-maroon-500" />
        <span className="text-xs tracking-widest uppercase text-maroon-500 opacity-0 group-hover:opacity-100 transition-opacity">
          Read more
        </span>
      </div>
    </motion.a>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/components/__tests__/WorkCard.test.tsx
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add WorkCard component with hover animation"
```

---

## Task 9: Work section

**Files:**
- Create: `src/components/Work.tsx`
- Create: `src/components/__tests__/Work.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/Work.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import Work from '../Work'

describe('Work', () => {
  it('renders all 3 work cards', () => {
    render(<Work />)
    expect(screen.getByText('Research Assistant, Brown University')).toBeInTheDocument()
    expect(screen.getByText('Chains of Captivity')).toBeInTheDocument()
    expect(screen.getByText('OCCT — Organizational Commitment Chain Tracker')).toBeInTheDocument()
  })

  it('has the correct section id', () => {
    const { container } = render(<Work />)
    expect(container.querySelector('#work')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/components/__tests__/Work.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Create src/components/Work.tsx**

```tsx
'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import WorkCard from './WorkCard'
import { siteContent } from '@/lib/content'

export default function Work() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="work" className="py-32 px-10 md:px-20">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 32 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-xs tracking-[0.3em] uppercase text-maroon-500 mb-12">Work</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-cream-100/5">
          {siteContent.work.map((item) => (
            <WorkCard key={item.href} item={item} />
          ))}
        </div>
      </motion.div>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/components/__tests__/Work.test.tsx
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add Work section with 3 cards"
```

---

## Task 10: Values section

**Files:**
- Create: `src/components/Values.tsx`
- Create: `src/components/__tests__/Values.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/Values.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import Values from '../Values'

describe('Values', () => {
  it('renders Carpe Diem', () => {
    render(<Values />)
    expect(screen.getByText('Carpe Diem.')).toBeInTheDocument()
  })

  it('has the correct section id', () => {
    const { container } = render(<Values />)
    expect(container.querySelector('#values')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/components/__tests__/Values.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Create src/components/Values.tsx**

```tsx
'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { siteContent } from '@/lib/content'

export default function Values() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="values"
      className="py-40 px-10 md:px-20 flex flex-col items-center justify-center text-center"
    >
      <div ref={ref}>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-16 h-px bg-maroon-500 mx-auto mb-12 origin-left"
        />
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif text-5xl md:text-7xl text-cream-100 italic"
        >
          {siteContent.value}
        </motion.p>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-16 h-px bg-maroon-500 mx-auto mt-12 origin-right"
        />
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/components/__tests__/Values.test.tsx
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add Values section"
```

---

## Task 11: Contact section

**Files:**
- Create: `src/components/Contact.tsx`
- Create: `src/components/__tests__/Contact.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/Contact.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import Contact from '../Contact'

describe('Contact', () => {
  it('renders the email address', () => {
    render(<Contact />)
    expect(screen.getByText('imaan@siiea.ai')).toBeInTheDocument()
  })

  it('email is a mailto link', () => {
    render(<Contact />)
    const emailLink = screen.getByRole('link', { name: /imaan@siiea.ai/i })
    expect(emailLink).toHaveAttribute('href', 'mailto:imaan@siiea.ai')
  })

  it('renders linkedin link', () => {
    render(<Contact />)
    const linkedinLink = screen.getByRole('link', { name: /linkedin/i })
    expect(linkedinLink).toHaveAttribute('href', 'https://www.linkedin.com/in/imaan-ali-8857a0308')
  })

  it('renders the note', () => {
    render(<Contact />)
    expect(screen.getByText('I respond to everything.')).toBeInTheDocument()
  })

  it('has the correct section id', () => {
    const { container } = render(<Contact />)
    expect(container.querySelector('#contact')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/components/__tests__/Contact.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Create src/components/Contact.tsx**

```tsx
'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { siteContent } from '@/lib/content'

export default function Contact() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="contact" className="py-32 px-10 md:px-20 border-t border-cream-100/5">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 32 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-lg"
      >
        <p className="text-xs tracking-[0.3em] uppercase text-maroon-500 mb-8">Contact</p>

        <a
          href={`mailto:${siteContent.contact.email}`}
          className="font-serif text-3xl md:text-4xl text-cream-100 hover:text-maroon-400 transition-colors block mb-6"
        >
          {siteContent.contact.email}
        </a>

        <a
          href={siteContent.contact.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className="text-sm tracking-widest uppercase text-cream-500 hover:text-maroon-400 transition-colors inline-flex items-center gap-3"
        >
          <div className="w-4 h-px bg-maroon-500" />
          LinkedIn
        </a>

        <p className="text-cream-500 text-sm mt-10 italic">{siteContent.contact.note}</p>
      </motion.div>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/components/__tests__/Contact.test.tsx
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add Contact section"
```

---

## Task 12: Assemble Home page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/app/__tests__/page.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import Home from '../page'

describe('Home page', () => {
  it('renders Hero', () => {
    render(<Home />)
    expect(screen.getByText('Imaan')).toBeInTheDocument()
  })

  it('renders About section', () => {
    render(<Home />)
    expect(screen.getByText(/high school student/i)).toBeInTheDocument()
  })

  it('renders Work section', () => {
    render(<Home />)
    expect(screen.getByText('Research Assistant, Brown University')).toBeInTheDocument()
  })

  it('renders Contact section', () => {
    render(<Home />)
    expect(screen.getByText('imaan@siiea.ai')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/app/__tests__/page.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Update src/app/page.tsx**

```tsx
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import About from '@/components/About'
import Work from '@/components/Work'
import Values from '@/components/Values'
import Contact from '@/components/Contact'

export default function Home() {
  return (
    <main className="bg-ink-900 min-h-screen">
      <Nav />
      <Hero />
      <About />
      <Work />
      <Values />
      <Contact />
      <footer className="py-8 px-10 md:px-20 border-t border-cream-100/5">
        <p className="text-xs text-muted tracking-widest uppercase">
          © {new Date().getFullYear()} Imaan Ali
        </p>
      </footer>
    </main>
  )
}
```

- [ ] **Step 4: Run all tests**

```bash
npx jest
```
Expected: All tests PASS

- [ ] **Step 5: Verify visually in dev server**

```bash
npm run dev
```
Open http://localhost:3000 — full page should render with all sections.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: assemble home page with all sections"
```

---

## Task 13: Brown RA detail page

**Files:**
- Create: `src/app/work/brown-ra/page.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/app/work/brown-ra/__tests__/page.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import BrownRAPage from '../page'

describe('Brown RA detail page', () => {
  it('renders the role title', () => {
    render(<BrownRAPage />)
    expect(screen.getByRole('heading', { name: /research assistant/i })).toBeInTheDocument()
  })

  it('renders Brown University', () => {
    render(<BrownRAPage />)
    expect(screen.getByText(/brown university/i)).toBeInTheDocument()
  })

  it('renders back link', () => {
    render(<BrownRAPage />)
    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/#work')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/app/work/brown-ra
```
Expected: FAIL

- [ ] **Step 3: Create src/app/work/brown-ra/page.tsx**

```tsx
import Nav from '@/components/Nav'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Research Assistant, Brown University — Imaan Ali',
}

export default function BrownRAPage() {
  return (
    <main className="bg-ink-900 min-h-screen">
      <Nav />
      <article className="pt-40 pb-32 px-10 md:px-20 max-w-3xl">
        <a
          href="/#work"
          className="text-xs tracking-[0.2em] uppercase text-maroon-500 hover:text-maroon-400 transition-colors inline-flex items-center gap-3 mb-16"
        >
          <div className="w-4 h-px bg-maroon-500" />
          Back
        </a>

        <p className="text-xs tracking-[0.3em] uppercase text-maroon-500 mb-6">
          Archival Research · Decolonial Practice
        </p>

        <h1 className="font-serif text-5xl md:text-6xl text-cream-100 font-bold leading-tight mb-4">
          Research Assistant
        </h1>
        <p className="font-serif text-2xl text-cream-300 mb-16">Brown University</p>

        <div className="space-y-8 text-cream-300 text-lg leading-relaxed">
          <p>
            I contribute to a collaborative, community-driven initiative focused on documenting and
            analyzing the histories of Indigenous enslavement in the Americas. The project aims to
            build a publicly accessible, ethically stewarded digital archive — one that centers
            Indigenous voices, community knowledge, and rigorous historical methodology.
          </p>

          <p>
            My work involves conducting archival and database research, verifying and synthesizing
            historical records, and assisting in the development of the archive&apos;s data
            infrastructure. I engage directly with primary sources — colonial legal documents, trade
            records, and newspaper archives — while supporting the team&apos;s historiographical
            analysis.
          </p>

          <p>
            I work closely with Indigenous scholars, community partners, and academic researchers to
            ensure historical accuracy, cultural sensitivity, and data transparency. My
            responsibilities also include participating in regular team meetings to refine research
            methodology and project goals.
          </p>

          <p>
            This work matters because the histories we preserve — and those we erase — shape how we
            understand power, justice, and accountability today.
          </p>
        </div>
      </article>
    </main>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/app/work/brown-ra
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add Brown RA detail page"
```

---

## Task 14: Chains of Captivity detail page

**Files:**
- Create: `src/app/work/chains-of-captivity/page.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/app/work/chains-of-captivity/__tests__/page.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import ChainsPage from '../page'

describe('Chains of Captivity detail page', () => {
  it('renders the paper title', () => {
    render(<ChainsPage />)
    expect(screen.getByRole('heading', { name: /chains of captivity/i })).toBeInTheDocument()
  })

  it('renders the abstract', () => {
    render(<ChainsPage />)
    expect(screen.getByText(/native american slavery/i)).toBeInTheDocument()
  })

  it('renders back link', () => {
    render(<ChainsPage />)
    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/#work')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/app/work/chains-of-captivity
```
Expected: FAIL

- [ ] **Step 3: Create src/app/work/chains-of-captivity/page.tsx**

```tsx
import Nav from '@/components/Nav'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chains of Captivity — Imaan Ali',
}

export default function ChainsPage() {
  return (
    <main className="bg-ink-900 min-h-screen">
      <Nav />
      <article className="pt-40 pb-32 px-10 md:px-20 max-w-3xl">
        <a
          href="/#work"
          className="text-xs tracking-[0.2em] uppercase text-maroon-500 hover:text-maroon-400 transition-colors inline-flex items-center gap-3 mb-16"
        >
          <div className="w-4 h-px bg-maroon-500" />
          Back
        </a>

        <p className="text-xs tracking-[0.3em] uppercase text-maroon-500 mb-6">
          History · Decolonial Research
        </p>

        <h1 className="font-serif text-4xl md:text-5xl text-cream-100 font-bold leading-tight mb-4">
          Chains of Captivity, Colonial Power, and Archival Erasure
        </h1>
        <p className="font-serif text-xl text-cream-300 mb-16">
          Native American Slavery in Colonial North America
        </p>

        <section className="mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-maroon-500 mb-4">Abstract</p>
          <p className="text-cream-300 text-lg leading-relaxed">
            This paper explores Native American slavery in colonial North America through a combined
            analysis of colonial print culture and recent historiography. Utilizing digitized
            colonial-period newspapers in the Library of Congress, the paper examines the structures
            of Indigenous enslavement and the epistemological modes that allowed these practices to
            be common, visible, and then pushed to the margins of historical discourse. The paper
            argues that Indigenous captivity and enslavement played a structurally significant role
            in shaping the political economies of Colonial America — and that its historiographical
            erasure is attributable not to historical absence but to the colonial architecture of
            Indigenous archives.
          </p>
        </section>

        <section className="mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-maroon-500 mb-4">Key Argument</p>
          <div className="space-y-4 text-cream-300 text-lg leading-relaxed">
            <p>
              Indigenous slavery was not incidental to colonialism but constitutive of the political
              economy of settler colonialism. The historiographical erasure of Native American
              slavery is not incidental to historical knowledge — it is the result of
              epistemological structures inherent within colonial archives themselves.
            </p>
            <p>
              Decolonial recovery requires engaging with how archives produce knowledge, not just
              what they contain. To read colonial newspaper advertisements against the grain is to
              recover the violence that their administrative language concealed.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-maroon-500 mb-4">Methodology</p>
          <p className="text-cream-300 text-lg leading-relaxed">
            Primary sources from the Library of Congress Chronicling America archive — including the
            Boston News-Letter (1710s–1720s) and the South Carolina Gazette (1730s–1740s) — analyzed
            through the decolonial framework of Linda Tuhiwai Smith (1999) and the historiographical
            work of Gallay and Newell.
          </p>
        </section>
      </article>
    </main>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/app/work/chains-of-captivity
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add Chains of Captivity detail page"
```

---

## Task 15: OCCT Patent detail page

**Files:**
- Create: `src/app/work/patent/page.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/app/work/patent/__tests__/page.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import PatentPage from '../page'

describe('Patent detail page', () => {
  it('renders OCCT title', () => {
    render(<PatentPage />)
    expect(screen.getByRole('heading', { name: /occt/i })).toBeInTheDocument()
  })

  it('renders provisional patent status', () => {
    render(<PatentPage />)
    expect(screen.getByText(/provisional patent/i)).toBeInTheDocument()
  })

  it('renders five dimensions', () => {
    render(<PatentPage />)
    expect(screen.getByText(/amount/i)).toBeInTheDocument()
    expect(screen.getByText(/scope/i)).toBeInTheDocument()
    expect(screen.getByText(/timeline/i)).toBeInTheDocument()
    expect(screen.getByText(/population/i)).toBeInTheDocument()
    expect(screen.getByText(/mechanism/i)).toBeInTheDocument()
  })

  it('renders back link', () => {
    render(<PatentPage />)
    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/#work')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/app/work/patent
```
Expected: FAIL

- [ ] **Step 3: Create src/app/work/patent/page.tsx**

```tsx
import Nav from '@/components/Nav'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OCCT — Imaan Ali',
}

const dimensions = [
  { name: 'Amount', description: 'Was the promised quantity delivered?' },
  { name: 'Scope', description: 'Did implementation match the stated reach of the commitment?' },
  { name: 'Timeline', description: 'Was the promise fulfilled on schedule?' },
  { name: 'Population', description: 'Did the right people benefit?' },
  { name: 'Mechanism', description: 'Was the implementation method consistent with the promise?' },
]

export default function PatentPage() {
  return (
    <main className="bg-ink-900 min-h-screen">
      <Nav />
      <article className="pt-40 pb-32 px-10 md:px-20 max-w-3xl">
        <a
          href="/#work"
          className="text-xs tracking-[0.2em] uppercase text-maroon-500 hover:text-maroon-400 transition-colors inline-flex items-center gap-3 mb-16"
        >
          <div className="w-4 h-px bg-maroon-500" />
          Back
        </a>

        <p className="text-xs tracking-[0.3em] uppercase text-maroon-500 mb-6">
          Civic Tech · Intellectual Property
        </p>

        <h1 className="font-serif text-4xl md:text-5xl text-cream-100 font-bold leading-tight mb-4">
          OCCT
        </h1>
        <p className="font-serif text-xl text-cream-300 mb-4">
          Organizational Commitment Chain Tracker
        </p>
        <p className="text-xs tracking-[0.2em] uppercase text-maroon-500 mb-16">
          Provisional Patent — USPTO
        </p>

        <section className="mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-maroon-500 mb-4">The Problem</p>
          <p className="text-cream-300 text-lg leading-relaxed">
            Existing tools that track political promises give a binary verdict: kept or broken. But
            that misses how promises actually die — through dilution, delay, and scope creep. A
            politician can technically pass a bill and still betray the spirit of every commitment
            they made.
          </p>
        </section>

        <section className="mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-maroon-500 mb-4">What It Does</p>
          <p className="text-cream-300 text-lg leading-relaxed">
            OCCT automatically extracts commitments from speeches and documents, then tracks each
            promise through legislation and regulation — scoring how faithfully each stage
            implemented the original commitment across five dimensions.
          </p>
        </section>

        <section className="mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-maroon-500 mb-6">
            The Five Dimensions
          </p>
          <div className="space-y-4">
            {dimensions.map((d) => (
              <div key={d.name} className="flex gap-6 items-start">
                <div className="w-px h-12 bg-maroon-700 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-cream-100 font-serif text-lg">{d.name}</p>
                  <p className="text-cream-500 text-sm mt-1">{d.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="text-xs tracking-[0.3em] uppercase text-maroon-500 mb-4">
            Why It Matters
          </p>
          <p className="text-cream-300 text-lg leading-relaxed">
            OCCT produces a multi-dimensional fidelity score that shows exactly where and how a
            promise was diluted, delayed, or delivered. Accountability requires precision.
          </p>
        </section>
      </article>
    </main>
  )
}
```

- [ ] **Step 4: Run all tests**

```bash
npx jest
```
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add OCCT patent detail page"
```

---

## Task 16: Dockerfile and deployment config

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`

- [ ] **Step 1: Create Dockerfile**

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
```

- [ ] **Step 2: Update next.config.ts for standalone output**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
}

export default nextConfig
```

- [ ] **Step 3: Create .dockerignore**

```
node_modules
.next
.git
*.md
Dockerfile
.dockerignore
```

- [ ] **Step 4: Build and test the Docker image locally**

```bash
docker build -t imaanali-website .
docker run -p 3000:3000 imaanali-website
```
Expected: Site accessible at http://localhost:3000

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add Dockerfile for Coolify deployment"
```

---

## Task 17: Deploy to Coolify

- [ ] **Step 1: Push repo to GitHub (or GitLab)**

```bash
# Create a new repo on GitHub named "imaanali-website" first, then:
git remote add origin git@github.com:<your-username>/imaanali-website.git
git push -u origin main
```

- [ ] **Step 2: Add to Coolify**

In Coolify dashboard:
1. New Resource → Application
2. Connect GitHub repo `imaanali-website`
3. Build Pack: **Dockerfile**
4. Port: `3000`
5. Domain: `imaanali.com`
6. Deploy

- [ ] **Step 3: Point Cloudflare DNS to Coolify**

In Cloudflare dashboard for `imaanali.com`:
1. DNS → Add Record
2. Type: `A`
3. Name: `@`
4. IPv4: `<your Coolify server IP>`
5. Proxy status: **DNS only** (grey cloud) until SSL is confirmed working, then switch to Proxied

- [ ] **Step 4: Verify live site**

Open https://imaanali.com — should load with full cinematic scroll, all sections, all detail pages.

- [ ] **Step 5: Final commit with live URL**

```bash
git tag v1.0.0
git push origin --tags
```

---

## Summary

| Task | Deliverable |
|------|-------------|
| 1 | Next.js project scaffolded |
| 2 | Design tokens, fonts, global styles |
| 3 | All content in one file |
| 4 | Nav component |
| 5 | ScrollIndicator component |
| 6 | Hero section |
| 7 | About section |
| 8 | WorkCard component |
| 9 | Work section |
| 10 | Values section |
| 11 | Contact section |
| 12 | Home page assembled |
| 13 | Brown RA detail page |
| 14 | Chains of Captivity detail page |
| 15 | OCCT patent detail page |
| 16 | Dockerfile + deployment config |
| 17 | Live at imaanali.com |

**Still needed from Imaan before launch:**
- Headshot / portrait photo (add to `public/photo-placeholder.jpg` — filename can stay the same, just replace the file)
