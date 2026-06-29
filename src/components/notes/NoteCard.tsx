import { Pin } from 'lucide-react'
import type { Note } from '../../hooks/useNotes'
import type { Database } from '../../lib/database.types'

type Tag = Database['public']['Tables']['tags']['Row']

interface NoteCardProps {
  note: Note
  tags?: Tag[]
  onClick?: () => void
}

export default function NoteCard({ note, tags = [], onClick }: NoteCardProps) {
  const excerpt = note.content.trim().slice(0, 120)
  const date = new Date(note.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left w-full bg-bg-card rounded-xl border border-border p-4 flex flex-col gap-1.5 transition-shadow ${
        onClick ? 'hover:shadow-md cursor-pointer' : 'cursor-default'
      }`}
    >
      {/* Title + pin */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-text-primary font-medium text-sm truncate flex-1">
          {note.title || 'Untitled'}
        </span>
        {note.is_pinned && (
          <Pin size={12} className="text-accent-gold shrink-0 mt-0.5" />
        )}
      </div>

      {/* Excerpt */}
      {excerpt && (
        <p className="text-text-muted text-xs leading-relaxed line-clamp-3">{excerpt}</p>
      )}

      {/* Tags — populated in Phase 3 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {tags.map(tag => (
            <span
              key={tag.id}
              className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Date */}
      <div className="text-text-muted text-xs mt-auto pt-1">{date}</div>
    </button>
  )
}
