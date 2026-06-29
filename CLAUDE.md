# CLAUDE.md — Catavyn Project Guide

## What is Catavyn?

Catavyn is a lightweight, free, open-source note-taking & daily task desktop/web app. Think of it as a cleaner, simpler alternative to Notion — not trying to do everything, just notes + tasks + organization done well with a distinctive warm aesthetic.

**Target users:** Students, freelancers, anyone who wants a simple free note app that works on web and desktop without account lock-in.

## Tech Stack

- **Frontend:** React 19 + Vite + React Router v7
- **Styling:** Tailwind CSS v4 (with custom design tokens — see Design section)
- **Backend/Auth/DB:** Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Desktop:** Tauri v2 (same React codebase, wrapped as native desktop app)
- **Deployment:** Vercel (free tier, auto-deploy from GitHub)
- **Package manager:** npm

## Project Structure

```
catavyn/
├── CLAUDE.md              # This file
├── ROADMAP.md             # Step-by-step build roadmap
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── index.html
├── .env.local             # Supabase keys (NEVER commit)
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx           # React entry
│   ├── App.tsx            # Root component + router
│   ├── components/
│   │   ├── layout/        # Sidebar, TopBar, MainLayout
│   │   ├── notes/         # NoteCard, NoteEditor, NoteList
│   │   ├── tasks/         # TaskItem, TaskList, TaskPanel
│   │   ├── categories/    # CategoryCard, CategoryGrid
│   │   ├── tags/          # TagBadge, TagManager
│   │   └── ui/            # Button, Input, Modal, SearchBar, Calendar
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── NotesPage.tsx
│   │   ├── TagsPage.tsx
│   │   ├── PinnedPage.tsx
│   │   ├── TrashPage.tsx
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useNotes.ts
│   │   ├── useTasks.ts
│   │   ├── useCategories.ts
│   │   └── useTags.ts
│   ├── lib/
│   │   ├── supabase.ts    # Supabase client init
│   │   ├── database.types.ts # Auto-generated Supabase types
│   │   └── constants.ts
│   ├── context/
│   │   └── AuthContext.tsx
│   └── styles/
│       └── globals.css    # Tailwind base + custom styles
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
└── src-tauri/             # Added later in Phase 5
    ├── Cargo.toml
    ├── tauri.conf.json
    └── src/
        ├── main.rs
        └── lib.rs
```

## Database Schema (Supabase PostgreSQL)

```sql
-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#8B7E6A',
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Notes
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT DEFAULT '',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#A89B8C',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Note-Tags junction
CREATE TABLE note_tags (
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date DATE,
  due_time TIME,
  is_completed BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high')),
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security (CRITICAL — every table needs this)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access their own data
CREATE POLICY "Users manage own categories" ON categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own notes" ON notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own tags" ON tags FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own note_tags" ON note_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()));
CREATE POLICY "Users manage own tasks" ON tasks FOR ALL USING (auth.uid() = user_id);
```

## Design System

Reference: see uploaded design mockup (catavyn-sample.png)

### Aesthetic Direction
Warm, organic, paper-like — NOT a dark techy look. Think stationery shop meets digital minimalism. The UI should feel calm and inviting, like opening a physical notebook.

### Color Palette
```
--bg-page:       #E8E0D0    /* warm parchment background */
--bg-card:       #F5F0E8    /* card/surface background */
--bg-sidebar:    #D9D0C0    /* sidebar, slightly darker */
--bg-task-panel: #6B7B6A    /* muted sage green for daily task panel */
--text-primary:  #2C2C2C    /* near-black for titles */
--text-secondary:#6B6560    /* muted brown for body text */
--text-muted:    #9B9590    /* subtle labels */
--accent-gold:   #C4A84D    /* golden accent for highlights, buttons */
--accent-green:  #6B8B6A    /* sage green for task panel header */
--tag-campus:    #5B8B5A    /* green tag */
--tag-work:      #8B8B6A    /* olive tag */
--tag-personal:  #C4844D    /* warm orange tag */
--tag-ideas:     #C4A84D    /* golden tag */
--priority-high: #E8C080    /* warm yellow bg */
--priority-med:  #C8E0C8    /* soft green bg */
--priority-low:  #E0D8D0    /* neutral bg */
--border:        #D0C8B8    /* subtle warm border */
```

### Typography
- **Display/Logo:** Serif font — "Playfair Display" or "Libre Baskerville" (for "CATAVYN" header)
- **Headings:** "Inter" 600 weight
- **Body:** "Inter" 400 weight, 14px base
- **Monospace:** "JetBrains Mono" (for code blocks in notes if needed)

### Layout
- **Sidebar:** Fixed left, ~80px wide (icon-based navigation: Home, Notes, Tags, Pinned, Trash)
- **Main content:** Fluid center area
- **Task panel:** Fixed right sidebar (~320px) on home page, collapsible
- **Mobile:** Sidebar becomes bottom tab bar, task panel becomes separate page

### Component Patterns
- Cards: rounded-xl, subtle shadow, bg-card
- Tags: small rounded pill badges with colored backgrounds
- Buttons: rounded-lg, golden accent for primary CTA
- Icons: use lucide-react icon library (line style, 20px default)
- Illustrations: small decorative illustrations in category cards (optional, can use emoji initially)

## Key Conventions

1. **TypeScript strict mode** — no `any` types
2. **Functional components only** — no class components
3. **Custom hooks** for all Supabase data operations (useNotes, useTasks, etc.)
4. **AuthContext** wraps entire app — redirect to login if not authenticated
5. **Soft delete** for notes — set `deleted_at` timestamp, filter in queries
6. **Optimistic updates** — update UI immediately, sync with Supabase in background
7. **Mobile-first responsive** — design for 380px viewport first, scale up
8. **.env.local** for secrets — NEVER commit Supabase keys to git

## Commands

```bash
npm run dev          # Start Vite dev server (port 5173)
npm run build        # Production build
npm run preview      # Preview production build
npm run tauri dev    # Desktop dev mode (Phase 5)
npm run tauri build  # Build desktop executable (Phase 5)
```

## Environment Variables

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxx...
```

## Important Notes for Claude Code

- When creating components, always check if a similar component already exists before creating a new one
- Follow the color palette strictly — do not introduce new colors without updating this doc
- All Supabase queries must respect RLS — never use service_role key in frontend
- Test responsive layout at 380px (mobile), 768px (tablet), 1200px+ (desktop)
- The design reference image shows the HOME page layout — other pages should follow the same visual language
- Keep bundle size minimal — avoid heavy dependencies
- Prefer native HTML elements styled with Tailwind over UI library components
