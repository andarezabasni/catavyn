import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Plus, Pin } from 'lucide-react'
import { useCategories, type Category } from '../hooks/useCategories'
import { useNotes } from '../hooks/useNotes'
import { useTags } from '../hooks/useTags'
import { useAuth } from '../context/AuthContext'
import NoteCard from '../components/notes/NoteCard'

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { categories, createCategory } = useCategories()
  const { notes, togglePin } = useNotes()
  const { noteTagsMap } = useTags()

  const firstName = user?.email?.split('@')[0] ?? 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const noteCounts = notes.reduce<Record<string, number>>((acc, note) => {
    if (note.category_id) {
      acc[note.category_id] = (acc[note.category_id] ?? 0) + 1
    }
    return acc
  }, {})

  const pinnedNotes = notes.filter(n => n.is_pinned)
  const recentNotes = notes.filter(n => !n.is_pinned).slice(0, 6)

  const [showCatForm, setShowCatForm] = useState(false)
  const [catName, setCatName] = useState('')
  const [catIcon, setCatIcon] = useState('📁')
  const [catCreating, setCatCreating] = useState(false)

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!catName.trim()) return
    setCatCreating(true)
    await createCategory({ name: catName.trim(), icon: catIcon })
    setCatName('')
    setCatIcon('📁')
    setShowCatForm(false)
    setCatCreating(false)
  }

  function cancelCatForm() {
    setShowCatForm(false)
    setCatName('')
    setCatIcon('📁')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-text-primary font-semibold text-2xl">
          {greeting}, {firstName}
        </h1>
        <p className="text-text-muted text-sm mt-1">{today}</p>
      </div>

      {/* Categories */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-primary font-semibold text-base">Categories</h2>
          {!showCatForm && (
            <button
              onClick={() => setShowCatForm(true)}
              className="flex items-center gap-1.5 text-sm text-accent-gold hover:opacity-75 font-medium transition-opacity"
            >
              <Plus size={15} />
              New category
            </button>
          )}
        </div>

        {showCatForm && (
          <form
            onSubmit={handleCreateCategory}
            className="mb-4 bg-bg-card rounded-xl border border-border p-4 flex flex-wrap gap-3 items-center"
          >
            <input
              type="text"
              placeholder="Category name"
              value={catName}
              onChange={e => setCatName(e.target.value)}
              autoFocus
              maxLength={40}
              className="flex-1 min-w-0 rounded-lg border border-border bg-bg-page px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-gold"
            />
            <input
              type="text"
              value={catIcon}
              onChange={e => setCatIcon(e.target.value)}
              title="Icon (emoji)"
              className="w-14 text-center rounded-lg border border-border bg-bg-page px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-gold"
            />
            <button
              type="submit"
              disabled={catCreating || !catName.trim()}
              className="rounded-lg bg-accent-gold px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {catCreating ? 'Adding…' : 'Add'}
            </button>
            <button
              type="button"
              onClick={cancelCatForm}
              className="rounded-lg px-3 py-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              Cancel
            </button>
          </form>
        )}

        {categories.length === 0 ? (
          <EmptyHint>No categories yet. Create one to organize your notes.</EmptyHint>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map(cat => (
              <CategoryCard
                key={cat.id}
                category={cat}
                noteCount={noteCounts[cat.id] ?? 0}
              />
            ))}
          </div>
        )}
      </section>

      {/* Pinned Notes */}
      {pinnedNotes.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Pin size={15} className="text-accent-gold" />
            <h2 className="text-text-primary font-semibold text-base">Pinned</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pinnedNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                tags={noteTagsMap[note.id] ?? []}
                onClick={() => navigate(`/notes?edit=${note.id}`)}
                onPin={() => togglePin(note.id, !note.is_pinned)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recent Notes */}
      <section>
        <h2 className="text-text-primary font-semibold text-base mb-4">Recent Notes</h2>
        {recentNotes.length === 0 ? (
          <EmptyHint>No notes yet. Head to Notes to create your first one.</EmptyHint>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                tags={noteTagsMap[note.id] ?? []}
                onClick={() => navigate(`/notes?edit=${note.id}`)}
                onPin={() => togglePin(note.id, !note.is_pinned)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function CategoryCard({ category, noteCount }: { category: Category; noteCount: number }) {
  return (
    <div
      className="bg-bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow cursor-pointer"
      style={{ borderLeftColor: category.color, borderLeftWidth: '3px' }}
    >
      <div className="text-2xl mb-2 leading-none">{category.icon}</div>
      <div className="text-text-primary font-medium text-sm truncate">{category.name}</div>
      <div className="text-text-muted text-xs mt-1">
        {noteCount} {noteCount === 1 ? 'note' : 'notes'}
      </div>
    </div>
  )
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-8 text-center">
      <p className="text-text-muted text-sm">{children}</p>
    </div>
  )
}
