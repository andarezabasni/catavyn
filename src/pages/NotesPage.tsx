import { useState } from 'react'
import { LayoutGrid, List, Plus } from 'lucide-react'
import { useNotes } from '../hooks/useNotes'
import { useCategories } from '../hooks/useCategories'
import NoteEditor from '../components/notes/NoteEditor'
import NoteCard from '../components/notes/NoteCard'
import type { Note } from '../hooks/useNotes'

type ViewMode = 'grid' | 'list'

export default function NotesPage() {
  const { notes, loading, createNote, updateNote } = useNotes()
  const { categories } = useCategories()

  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)

  const editingNote = editingNoteId ? notes.find(n => n.id === editingNoteId) ?? null : null

  const filteredNotes = categoryFilter
    ? notes.filter(n => n.category_id === categoryFilter)
    : notes

  function openNew() {
    setEditingNoteId(null)
    setEditorOpen(true)
  }

  function openEdit(note: Note) {
    setEditingNoteId(note.id)
    setEditorOpen(true)
  }

  function closeEditor() {
    setEditorOpen(false)
    setEditingNoteId(null)
  }

  async function handleSave(title: string, content: string) {
    if (editingNoteId) {
      await updateNote(editingNoteId, { title, content })
    } else {
      const created = await createNote({ title, content, category_id: categoryFilter ?? undefined })
      if (created) setEditingNoteId(created.id)
    }
  }

  if (editorOpen) {
    return (
      <NoteEditor
        initialTitle={editingNote?.title ?? ''}
        initialContent={editingNote?.content ?? ''}
        onSave={handleSave}
        onBack={closeEditor}
      />
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-text-primary font-semibold text-xl">Notes</h1>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-border bg-bg-card p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-bg-page text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-bg-page text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
              aria-label="List view"
            >
              <List size={16} />
            </button>
          </div>

          {/* New note */}
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 rounded-lg bg-accent-gold px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            <Plus size={15} />
            New note
          </button>
        </div>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setCategoryFilter(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              categoryFilter === null
                ? 'bg-accent-gold text-white'
                : 'bg-bg-card border border-border text-text-secondary hover:border-accent-gold/50'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id === categoryFilter ? null : cat.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                categoryFilter === cat.id
                  ? 'bg-accent-gold text-white'
                  : 'bg-bg-card border border-border text-text-secondary hover:border-accent-gold/50'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Notes */}
      {loading ? (
        <div className="text-text-muted text-sm">Loading…</div>
      ) : filteredNotes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-text-muted text-sm mb-3">
            {categoryFilter ? 'No notes in this category.' : 'No notes yet.'}
          </p>
          <button
            onClick={openNew}
            className="text-sm text-accent-gold font-medium hover:opacity-75 transition-opacity"
          >
            Create your first note →
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredNotes.map(note => (
            <NoteCard key={note.id} note={note} onClick={() => openEdit(note)} />
          ))}
        </div>

      ) : (
        <div className="flex flex-col gap-2">
          {filteredNotes.map(note => (
            <NoteListRow key={note.id} note={note} onClick={() => openEdit(note)} />
          ))}
        </div>
      )}
    </div>
  )
}

function NoteListRow({ note, onClick }: { note: Note; onClick: () => void }) {
  const excerpt = note.content.trim().slice(0, 80)
  const date = new Date(note.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <button
      onClick={onClick}
      className="text-left w-full bg-bg-card rounded-xl border border-border px-4 py-3 hover:shadow-sm transition-shadow flex items-baseline gap-4"
    >
      <div className="text-text-primary font-medium text-sm truncate flex-1 min-w-0">
        {note.title || 'Untitled'}
      </div>
      {excerpt && (
        <div className="text-text-muted text-xs truncate flex-2 min-w-0 hidden sm:block">
          {excerpt}
        </div>
      )}
      <div className="text-text-muted text-xs shrink-0">{date}</div>
    </button>
  )
}
