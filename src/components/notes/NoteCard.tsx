import { Pin, Trash2 } from 'lucide-react'
import type { Note } from '../../hooks/useNotes'
import type { Tag } from '../../hooks/useTags'
import TagBadge from '../tags/TagBadge'

interface NoteCardProps {
  note: Note
  tags?: Tag[]
  onClick?: () => void
  onDelete?: () => void
  onPin?: () => void
}

export default function NoteCard({ note, tags = [], onClick, onDelete, onPin }: NoteCardProps) {
  const excerpt = note.content.trim().slice(0, 120)
  const date = new Date(note.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group text-left w-full bg-bg-card rounded-xl border border-border p-4 flex flex-col gap-1.5 transition-shadow ${
        onClick ? 'hover:shadow-md cursor-pointer' : 'cursor-default'
      }`}
    >
      {/* Title + pin */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-text-primary font-medium text-sm truncate flex-1">
          {note.title || 'Untitled'}
        </span>
        {onPin ? (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onPin() }}
            aria-label={note.is_pinned ? 'Unpin note' : 'Pin note'}
            className={`shrink-0 mt-0.5 p-0.5 rounded transition-all ${
              note.is_pinned
                ? 'text-accent-gold'
                : 'text-text-muted opacity-0 group-hover:opacity-100 hover:text-accent-gold'
            }`}
          >
            <Pin size={12} />
          </button>
        ) : note.is_pinned ? (
          <Pin size={12} className="text-accent-gold shrink-0 mt-0.5" />
        ) : null}
      </div>

      {/* Excerpt */}
      {excerpt && (
        <p className="text-text-muted text-xs leading-relaxed line-clamp-3">{excerpt}</p>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {tags.map(tag => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
        </div>
      )}

      {/* Date + delete */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-text-muted text-xs">{date}</span>
        {onDelete && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onDelete() }}
            aria-label="Move to trash"
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-text-muted hover:text-red-500 hover:bg-red-50"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </button>
  )
}
