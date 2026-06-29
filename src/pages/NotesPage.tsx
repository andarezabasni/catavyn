import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { LayoutGrid, List, Plus, RotateCcw, X } from 'lucide-react'
import { useNotes } from '../hooks/useNotes'
import { useCategories } from '../hooks/useCategories'
import { useTags } from '../hooks/useTags'
import NoteEditor from '../components/notes/NoteEditor'
import NoteCard from '../components/notes/NoteCard'
import SearchBar from '../components/ui/SearchBar'
import type { Note } from '../hooks/useNotes'

type ViewMode = 'grid' | 'list'

export default function NotesPage() {
  const { notes, loading, createNote, updateNote, deleteNote, restoreNote, togglePin } = useNotes()
  const { categories } = useCategories()
  const { tags, noteTagsMap, createTag, attachTag, detachTag } = useTags()

  const [searchParams, setSearchParams] = useSearchParams()
  const urlTagId = searchParams.get('tag')
  const activeTagFilter = tags.find(t => t.id === urlTagId) ?? null

  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)

  const [undoNote, setUndoNote] = useState<{ id: string; title: string } | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Tracks category + tags for new notes before first save
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null)
  const [pendingTagIds, setPendingTagIds] = useState<string[]>([])

  const editingNote = editingNoteId ? notes.find(n => n.id === editingNoteId) ?? null : null

  const filteredNotes = notes
    .filter(n => {
      if (categoryFilter && n.category_id !== categoryFilter) return false
      if (urlTagId) {
        const noteTags = noteTagsMap[n.id] ?? []
        if (!noteTags.some(t => t.id === urlTagId)) return false
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const inTitle = n.title.toLowerCase().includes(q)
        const inContent = n.content.toLowerCase().includes(q)
        const inTags = (noteTagsMap[n.id] ?? []).some(t => t.name.toLowerCase().includes(q))
        if (!inTitle && !inContent && !inTags) return false
      }
      return true
    })
    .sort((a, b) => {
      if (a.is_pinned === b.is_pinned) return 0
      return a.is_pinned ? -1 : 1
    })

  // Open editor via ?edit=<noteId> deep link (e.g. from PinnedPage)
  const editParam = searchParams.get('edit')
  useEffect(() => {
    if (!editParam || loading || editorOpen) return
    const note = notes.find(n => n.id === editParam)
    if (!note) return
    setEditingNoteId(note.id)
    setPendingTagIds([])
    setEditorOpen(true)
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.delete('edit')
      return next
    }, { replace: true })
  }, [editParam, loading, notes, editorOpen, setSearchParams])

  function openNew() {
    setEditingNoteId(null)
    setPendingCategoryId(categoryFilter)
    setPendingTagIds([])
    setEditorOpen(true)
  }

  function openEdit(note: Note) {
    setEditingNoteId(note.id)
    setPendingTagIds([])
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
      const created = await createNote({ title, content, category_id: pendingCategoryId ?? undefined })
      if (created) {
        setEditingNoteId(created.id)
        await Promise.all(
          pendingTagIds.map(tagId => {
            const tag = tags.find(t => t.id === tagId)
            return tag ? attachTag(created.id, tag) : Promise.resolve()
          })
        )
        setPendingTagIds([])
      }
    }
  }

  async function handleCategoryChange(catId: string | null) {
    if (editingNoteId) {
      await updateNote(editingNoteId, { category_id: catId })
    } else {
      setPendingCategoryId(catId)
    }
  }

  async function handleTagAdd(tagId: string) {
    if (editingNoteId) {
      const tag = tags.find(t => t.id === tagId)
      if (tag) await attachTag(editingNoteId, tag)
    } else {
      setPendingTagIds(prev => prev.includes(tagId) ? prev : [...prev, tagId])
    }
  }

  async function handleTagRemove(tagId: string) {
    if (editingNoteId) {
      await detachTag(editingNoteId, tagId)
    } else {
      setPendingTagIds(prev => prev.filter(id => id !== tagId))
    }
  }

  async function handleTagCreate(name: string) {
    const created = await createTag({ name })
    if (created) {
      if (editingNoteId) {
        await attachTag(editingNoteId, created)
      } else {
        setPendingTagIds(prev => [...prev, created.id])
      }
    }
    return created
  }

  async function handleDelete(note: Note) {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    await deleteNote(note.id)
    if (editorOpen) closeEditor()
    setUndoNote({ id: note.id, title: note.title || 'Untitled' })
    undoTimerRef.current = setTimeout(() => setUndoNote(null), 5000)
  }

  async function handleUndo() {
    if (!undoNote) return
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    await restoreNote(undoNote.id)
    setUndoNote(null)
  }

  if (editorOpen) {
    return (
      <>
        <NoteEditor
          initialTitle={editingNote?.title ?? ''}
          initialContent={editingNote?.content ?? ''}
          categoryId={editingNote?.category_id ?? pendingCategoryId}
          categories={categories}
          noteTags={editingNoteId ? (noteTagsMap[editingNoteId] ?? []) : tags.filter(t => pendingTagIds.includes(t.id))}
          allTags={tags}
          isPinned={editingNote?.is_pinned ?? false}
          onPin={editingNote ? () => togglePin(editingNote.id, !editingNote.is_pinned) : undefined}
          onSave={handleSave}
          onBack={closeEditor}
          onDelete={editingNote ? () => handleDelete(editingNote) : undefined}
          onCategoryChange={handleCategoryChange}
          onTagAdd={handleTagAdd}
          onTagRemove={handleTagRemove}
          onTagCreate={handleTagCreate}
        />
        {undoNote && <UndoToast title={undoNote.title} onUndo={handleUndo} />}
      </>
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

      {/* Search */}
      <SearchBar
        placeholder="Search notes…"
        onSearch={setSearchQuery}
        className="mb-4"
      />

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

      {/* Active tag filter chip */}
      {activeTagFilter && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-text-muted text-xs">Filtered by tag:</span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white"
            style={{ backgroundColor: activeTagFilter.color }}
          >
            {activeTagFilter.name}
            <button
              type="button"
              onClick={() => setSearchParams({})}
              aria-label="Clear tag filter"
              className="hover:opacity-75 transition-opacity leading-none"
            >
              <X size={11} />
            </button>
          </span>
        </div>
      )}

      {/* Notes */}
      {loading ? (
        <div className="text-text-muted text-sm">Loading…</div>
      ) : filteredNotes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-text-muted text-sm mb-3">
            {categoryFilter || urlTagId ? 'No notes match this filter.' : 'No notes yet.'}
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
            <NoteCard
              key={note.id}
              note={note}
              tags={noteTagsMap[note.id] ?? []}
              searchQuery={searchQuery}
              onClick={() => openEdit(note)}
              onDelete={() => handleDelete(note)}
              onPin={() => togglePin(note.id, !note.is_pinned)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredNotes.map(note => (
            <NoteListRow
              key={note.id}
              note={note}
              onClick={() => openEdit(note)}
              onDelete={() => handleDelete(note)}
            />
          ))}
        </div>
      )}

      {undoNote && <UndoToast title={undoNote.title} onUndo={handleUndo} />}
    </div>
  )
}

function NoteListRow({
  note,
  onClick,
  onDelete,
}: {
  note: Note
  onClick: () => void
  onDelete: () => void
}) {
  const excerpt = note.content.trim().slice(0, 80)
  const date = new Date(note.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="group flex items-center gap-2">
      <button
        onClick={onClick}
        className="text-left flex-1 min-w-0 bg-bg-card rounded-xl border border-border px-4 py-3 hover:shadow-sm transition-shadow flex items-baseline gap-4"
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
      <button
        type="button"
        onClick={onDelete}
        aria-label="Move to trash"
        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      </button>
    </div>
  )
}

function UndoToast({ title, onUndo }: { title: string; onUndo: () => void }) {
  return (
    <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-text-primary text-bg-page rounded-xl px-4 py-3 shadow-lg text-sm whitespace-nowrap">
      <RotateCcw size={14} className="shrink-0 opacity-70" />
      <span className="truncate max-w-48">
        "<span className="font-medium">{title}</span>" moved to trash
      </span>
      <button
        onClick={onUndo}
        className="font-semibold text-accent-gold hover:opacity-80 transition-opacity shrink-0"
      >
        Undo
      </button>
    </div>
  )
}
