import { Link } from 'react-router'
import {
  FileText, CheckSquare, FolderOpen, Users, Lock, Download,
  Moon, Bell, ArrowRight, Check, PenLine, Layers, CalendarCheck,
  Monitor, ChevronDown,
} from 'lucide-react'
import appLogo from '../assets/logo.png'

const GITHUB_REPO = 'https://github.com/andarezabasni/catavyn'
const WINDOWS_DOWNLOAD = 'https://github.com/andarezabasni/catavyn/releases'

const FEATURES = [
  {
    icon: FileText,
    color: '#C4A84D',
    title: 'Rich Notes & Nested Sub-notes',
    text: 'Format with clean markdown, headers, checklists, and code blocks. Nest sub-notes to manage complex projects effortlessly.',
  },
  {
    icon: CheckSquare,
    color: '#6B8B6A',
    title: 'Daily Task Management',
    text: 'Keep execution focused with priority tags, scheduled due times, and an integrated daily agenda calendar.',
  },
  {
    icon: FolderOpen,
    color: '#C4844D',
    title: 'Visual Categories & Tags',
    text: 'Structure notes through color-coded categories and custom tags for instant multi-filter search and discovery.',
  },
  {
    icon: Users,
    color: '#5B8B5A',
    title: 'Real-Time Collaboration',
    text: 'Work synchronously with granular view or edit permissions and a transparent live activity audit trail.',
  },
  {
    icon: Lock,
    color: '#8B8B6A',
    title: 'PIN-Protected Privacy',
    text: 'Lock confidential notes behind custom PIN security, reinforced with PostgreSQL Row Level Security (RLS).',
  },
  {
    icon: Download,
    color: '#C4A84D',
    title: 'Markdown & PDF Portability',
    text: 'Export notes to clean Markdown or PDF at any time. Import your existing notes with zero ecosystem lock-in.',
  },
  {
    icon: Bell,
    color: '#C4844D',
    title: 'Proactive Due Date Reminders',
    text: 'Receive browser and desktop notifications so high-priority deadlines and task schedules are never missed.',
  },
  {
    icon: Moon,
    color: '#6B8B6A',
    title: 'Paper-Like & Warm Dark Theme',
    text: 'Designed for deep focus, featuring a warm tactile aesthetic by day and an eye-friendly palette by night.',
  },
]

const STEPS = [
  {
    icon: PenLine,
    title: 'Capture Ideas Instantly',
    text: 'Start writing in seconds with automatic background syncing so you never lose a draft.',
  },
  {
    icon: Layers,
    title: 'Structure & Interlink',
    text: 'Organize pages using nested sub-notes, category hierarchies, and customized tag filters.',
  },
  {
    icon: CalendarCheck,
    title: 'Execute & Track Progress',
    text: 'Convert thoughts into actionable daily tasks, prioritize workloads, and receive on-time alerts.',
  },
]

// Web-optimized JPEG variants (~100 KB each vs ~1.3 MB source PNGs)
const SCREENSHOTS = [
  { src: '/screenshot/2.jpg', alt: 'Catavyn home dashboard with categorized notes, reminders, and pinned workspace' },
  { src: '/screenshot/4.jpg', alt: 'Catavyn warm dark theme note editor interface' },
  { src: '/screenshot/5.jpg', alt: 'Catavyn notes list view with full-text search and category filters' },
  { src: '/screenshot/3.jpg', alt: 'Catavyn secure PIN-locked private notes modal' },
]

const PROMISES = [
  '100% Free and open source',
  'Zero advertisements or user tracking',
  'Instant Markdown and PDF data export',
  'Full offline desktop & browser support',
]

const FAQS = [
  {
    q: 'Is Catavyn completely free?',
    a: 'Yes. There are no paywalls, hidden limits, or subscription tiers. Catavyn is an open-source productivity app released under the MIT license.',
  },
  {
    q: 'Can I use Catavyn on desktop as well as web?',
    a: 'Yes. Catavyn runs in modern web browsers and offers a native, lightweight Windows desktop app powered by Tauri.',
  },
  {
    q: 'How is user data and note privacy protected?',
    a: 'Your notes are isolated through Supabase Row-Level Security (RLS) policies. Individual sensitive documents can also be locked with a private PIN.',
  },
  {
    q: 'Can I migrate or export my notes anytime?',
    a: 'Yes. You retain complete ownership of your data with one-click Markdown and PDF exports, alongside Markdown import capabilities.',
  },
  {
    q: 'How does real-time team collaboration work?',
    a: 'You can share notes via email invite with customized edit or read-only permissions, syncing updates instantly across active sessions.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-page text-text-primary overflow-x-hidden">
      {/* Nav */}
      <header className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-5 py-4 sm:py-5">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <img src={appLogo} alt="" className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0" />
          <span className="font-display text-lg sm:text-xl font-bold tracking-wide">CATAVYN</span>
        </div>
        <nav className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Link
            to="/login"
            className="rounded-lg px-2.5 sm:px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-accent-gold px-3 sm:px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative">
        {/* Soft decorative glows */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-24 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-accent-gold/15 blur-3xl" />
          <div className="absolute top-1/2 -left-28 w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-accent-green/15 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-5 pt-10 sm:pt-16 pb-12 sm:pb-16 text-center">
          <p className="inline-block rounded-full border border-border bg-bg-card px-3 py-1 text-xs font-medium text-text-secondary mb-5 sm:mb-6">
            Free &bull; Open Source &bull; Web &amp; Windows Desktop
          </p>
          <h1 className="font-display text-[2.1rem] leading-[1.15] sm:text-5xl md:text-6xl sm:leading-tight font-bold max-w-3xl mx-auto">
            Note-taking and task planning,{' '}
            <span className="italic text-accent-gold">distraction-free.</span>
          </h1>
          <p className="text-text-secondary text-[15px] sm:text-lg max-w-xl mx-auto mt-4 sm:mt-5 leading-relaxed">
            Catavyn brings together structured markdown notes, nested sub-pages, and daily agenda planning in one warm, tactile workspace with zero lock-in.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mt-7 sm:mt-8 px-2 sm:px-0">
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 rounded-xl bg-accent-gold px-6 py-3 text-sm sm:text-base font-semibold text-white hover:opacity-90 transition-opacity shadow-sm"
            >
              Start Free Workspace
              <ArrowRight size={16} />
            </Link>
            <a
              href={WINDOWS_DOWNLOAD}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-card px-6 py-3 text-sm sm:text-base font-semibold text-text-primary hover:border-accent-gold/60 transition-colors"
            >
              <Monitor size={16} />
              Download Windows App
            </a>
          </div>
          <p className="text-text-muted text-xs mt-3">No subscriptions. No credit card required. Free forever.</p>

          {/* Hero screenshot */}
          <div className="mt-10 sm:mt-14 rounded-xl sm:rounded-2xl border border-border bg-bg-card shadow-xl overflow-hidden">
            <img
              src="/screenshot/1.jpg"
              alt="Catavyn note-taking dashboard with tasks, categories, reminders, and pinned documents"
              className="w-full h-auto block"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-5 py-12 sm:py-16">
        <p className="text-accent-gold text-xs font-semibold uppercase tracking-widest text-center mb-2">Workflow</p>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-center">
          Engineered for focus and clarity.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-10">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="relative rounded-2xl border border-border bg-bg-card p-5 sm:p-6 text-center">
              <span className="absolute top-4 right-4 font-display text-3xl font-bold text-border select-none" aria-hidden="true">
                {i + 1}
              </span>
              <div className="w-11 h-11 rounded-xl bg-accent-gold/15 flex items-center justify-center mx-auto mb-3.5">
                <Icon size={20} className="text-accent-gold" />
              </div>
              <h3 className="font-semibold text-sm mb-1.5">{title}</h3>
              <p className="text-text-secondary text-xs leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-5 py-12 sm:py-16">
        <p className="text-accent-gold text-xs font-semibold uppercase tracking-widest text-center mb-2">Capabilities</p>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-center">
          Essential tools for productive thinkers.
        </h2>
        <p className="text-text-secondary text-center mt-3 max-w-lg mx-auto text-sm sm:text-base">
          A focused workspace uniting rich markdown documents, hierarchical organization, and scheduled task management.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mt-8 sm:mt-10">
          {FEATURES.map(({ icon: Icon, color, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-bg-card p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                style={{ backgroundColor: `${color}26` }}
              >
                <Icon size={18} style={{ color }} />
              </div>
              <h3 className="font-semibold text-sm mb-1.5">{title}</h3>
              <p className="text-text-secondary text-xs leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Screenshot gallery — swipeable on mobile */}
      <section className="py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-5">
          <p className="text-accent-gold text-xs font-semibold uppercase tracking-widest text-center mb-2">Interface</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-center">
            Designed for thoughtful productivity.
          </h2>
          <p className="text-text-muted text-xs text-center mt-2 sm:hidden">Swipe to browse →</p>
        </div>
        <div className="mt-7 sm:mt-10 flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 sm:px-[max(1.25rem,calc((100vw-64rem)/2))] pb-4 [-webkit-overflow-scrolling:touch]">
          {SCREENSHOTS.map(shot => (
            <img
              key={shot.src}
              src={shot.src}
              alt={shot.alt}
              loading="lazy"
              className="snap-center shrink-0 w-[86%] sm:w-135 rounded-xl border border-border shadow-md bg-bg-card"
            />
          ))}
        </div>
      </section>

      {/* Promises */}
      <section className="max-w-5xl mx-auto px-4 sm:px-5 py-12 sm:py-16">
        <div className="rounded-2xl bg-bg-task-panel text-white px-5 sm:px-10 py-9 sm:py-12">
          <div className="flex flex-col md:flex-row md:items-center gap-7 sm:gap-8">
            <div className="flex-1">
              <h2 className="font-display text-2xl sm:text-3xl font-bold">
                Your data remains completely yours.
              </h2>
              <p className="text-white/70 text-sm mt-3 leading-relaxed max-w-md">
                Unlike walled-garden note platforms, Catavyn protects your privacy and outputs universal Markdown. Keep complete control of your thoughts, documents, and workflows at all times.
              </p>
            </div>
            <ul className="flex flex-col gap-3">
              {PROMISES.map(p => (
                <li key={p} className="flex items-center gap-2.5 text-sm text-white/90">
                  <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-4 sm:px-5 py-12 sm:py-16">
        <p className="text-accent-gold text-xs font-semibold uppercase tracking-widest text-center mb-2">FAQ</p>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-7 sm:mb-9">
          Frequently Asked Questions
        </h2>
        <div className="flex flex-col gap-3">
          {FAQS.map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-xl border border-border bg-bg-card px-4 sm:px-5 py-3.5 open:pb-4"
            >
              <summary className="flex items-center justify-between gap-3 cursor-pointer list-none text-sm font-semibold [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDown size={16} className="text-text-muted shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="text-text-secondary text-sm leading-relaxed mt-2.5">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-5 py-14 sm:py-20 text-center">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-accent-gold/10 blur-3xl" />
        </div>
        <div className="relative">
          <h2 className="font-display text-2xl sm:text-4xl font-bold">
            Upgrade your daily thinking and note-taking routine.
          </h2>
          <p className="text-text-secondary mt-3">Start organized, private note-taking in seconds.</p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mt-7 px-2 sm:px-0">
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 rounded-xl bg-accent-gold px-6 py-3 text-sm sm:text-base font-semibold text-white hover:opacity-90 transition-opacity shadow-sm"
            >
              Get Started for Free
              <ArrowRight size={16} />
            </Link>
            <a
              href={WINDOWS_DOWNLOAD}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-card px-6 py-3 text-sm sm:text-base font-semibold text-text-primary hover:border-accent-gold/60 transition-colors"
            >
              <Monitor size={16} />
              Get Windows App
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-5 py-7 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center gap-2">
              <img src={appLogo} alt="" className="w-6 h-6 object-contain" />
              <span className="font-display text-sm font-bold tracking-wide">CATAVYN</span>
            </div>
            <span className="text-text-muted text-xs sm:ml-2">Privacy-focused note-taking &amp; daily task management.</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <Link to="/login" className="hover:text-text-primary transition-colors">Sign in</Link>
            <Link to="/register" className="hover:text-text-primary transition-colors">Register</Link>
            <a href={WINDOWS_DOWNLOAD} target="_blank" rel="noreferrer" className="hover:text-text-primary transition-colors">
              Windows app
            </a>
            <a href={GITHUB_REPO} target="_blank" rel="noreferrer" className="hover:text-text-primary transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
