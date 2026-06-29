import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, Check, Trash2 } from 'lucide-react'

interface NoteEditorProps {
  initialTitle?: string
  initialContent?: string
  onSave: (title: string, content: string) => Promise<void>
  onBack: () => void
  onDelete?: () => void
}

export default function NoteEditor({
  initialTitle = '',
  initialContent = '',
  onSave,
  onBack,
  onDelete,
}: NoteEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const titleRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const didFocus = useRef(false)

  function resize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  // Resize textarea whenever content changes
  useEffect(() => { resize() }, [content])

  // Focus appropriate field on mount
  useEffect(() => {
    if (didFocus.current) return
    didFocus.current = true
    if (!initialTitle) {
      titleRef.current?.focus()
    } else {
      textareaRef.current?.focus()
    }
  }, [initialTitle])

  const save = useCallback(async () => {
    if (status === 'saving') return
    setStatus('saving')
    await onSave(title.trim() || 'Untitled', content)
    setStatus('saved')
    setTimeout(() => setStatus('idle'), 2000)
  }, [status, onSave, title, content])

  // Ctrl+S / Cmd+S
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        save()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [save])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-bg-page border-b border-border">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-text-muted hover:text-text-primary text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="flex items-center gap-3">
          {status === 'saved' && (
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Check size={12} />
              Saved
            </span>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              type="button"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
              aria-label="Move to trash"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Trash</span>
            </button>
          )}
          <button
            onClick={save}
            disabled={status === 'saving'}
            className="rounded-lg bg-accent-gold px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {status === 'saving' ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Writing area */}
      <div className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              textareaRef.current?.focus()
            }
          }}
          placeholder="Untitled"
          maxLength={200}
          className="w-full bg-transparent text-text-primary font-semibold text-2xl placeholder:text-text-muted focus:outline-none mb-4"
        />

        <div className="border-t border-border mb-6" />

        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => {
            setContent(e.target.value)
            resize()
          }}
          placeholder="Start writing…"
          rows={1}
          className="w-full bg-transparent text-text-secondary text-sm leading-relaxed placeholder:text-text-muted focus:outline-none resize-none overflow-hidden"
          style={{ minHeight: '60vh' }}
        />
      </div>
    </div>
  )
}
