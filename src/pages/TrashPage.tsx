import { useNotes } from '../hooks/useNotes'

export default function TrashPage() {
  const { notes, loading, restoreNote, permanentlyDeleteNote } = useNotes({ deleted: true })

  async function emptyTrash() {
    await Promise.all(notes.map(n => permanentlyDeleteNote(n.id)))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-text-primary font-semibold text-xl">Trash</h1>
          <p className="text-text-muted text-xs mt-0.5">
            Notes here are not synced and will be deleted after 30 days.
          </p>
        </div>
        {notes.length > 0 && (
          <button
            onClick={emptyTrash}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted hover:text-red-500 hover:border-red-300 transition-colors"
          >
            Empty trash
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-text-muted text-sm">Loading…</div>
      ) : notes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-text-muted text-sm">Trash is empty.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notes.map(note => {
            const trashedDate = note.deleted_at
              ? new Date(note.deleted_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : ''

            return (
              <div
                key={note.id}
                className="bg-bg-card rounded-xl border border-border px-4 py-3 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-text-primary font-medium text-sm truncate">
                    {note.title || 'Untitled'}
                  </div>
                  {note.content.trim() && (
                    <div className="text-text-muted text-xs truncate mt-0.5">
                      {note.content.trim().slice(0, 80)}
                    </div>
                  )}
                </div>

                <div className="text-text-muted text-xs shrink-0 hidden sm:block">
                  Trashed {trashedDate}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => restoreNote(note.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium border border-border text-text-secondary hover:border-accent-gold/50 hover:text-accent-gold transition-colors"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => permanentlyDeleteNote(note.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium border border-border text-text-muted hover:border-red-300 hover:text-red-500 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
