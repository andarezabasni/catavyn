import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, Check, Trash2, ChevronDown, FolderOpen } from 'lucide-react'
import type { Category } from '../../hooks/useCategories'

interface NoteEditorProps {
  initialTitle?: string
  initialContent?: string
  categoryId?: string | null
  categories?: Category[]
  onSave: (title: string, content: string) => Promise<void>
  onBack: () => void
  onDelete?: () => void
  onCategoryChange?: (categoryId: string | null) => void
}

export default function NoteEditor({
  initialTitle = '',
  initialContent = '',
  categoryId = null,
  categories = [],
  onSave,
  onBack,
  onDelete,
  onCategoryChange,
}: NoteEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [catOpen, setCatOpen] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const catDropdownRef = useRef<HTMLDivElement>(null)
  const didFocus = useRef(false)

  const currentCategory = categories.find(c => c.id === categoryId) ?? null

  function resize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  useEffect(() => { resize() }, [content])

  useEffect(() => {
    if (didFocus.current) return
    didFocus.current = true
    if (!initialTitle) {
      titleRef.current?.focus()
    } else {
      textareaRef.current?.focus()
    }
  }, [initialTitle])

  // Close category dropdown on outside click
  useEffect(() => {
    if (!catOpen) return
    function handleClick(e: MouseEvent) {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setCatOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [catOpen])

  const save = useCallback(async () => {
    if (status === 'saving') return
    setStatus('saving')
    await onSave(title.trim() || 'Untitled', content)
    setStatus('saved')
    setTimeout(() => setStatus('idle'), 2000)
  }, [status, onSave, title, content])

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

  function selectCategory(id: string | null) {
    setCatOpen(false)
    onCategoryChange?.(id)
  }

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

        {/* Category picker */}
        {onCategoryChange && (
          <div className="mb-4" ref={catDropdownRef}>
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => setCatOpen(v => !v)}
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-text-muted hover:border-accent-gold/50 hover:text-text-secondary transition-colors"
              >
                {currentCategory ? (
                  <>
                    <span>{currentCategory.icon}</span>
                    <span className="font-medium text-text-secondary">{currentCategory.name}</span>
                  </>
                ) : (
                  <>
                    <FolderOpen size={12} />
                    <span>Add to category</span>
                  </>
                )}
                <ChevronDown size={11} className={`transition-transform ${catOpen ? 'rotate-180' : ''}`} />
              </button>

              {catOpen && (
                <div className="absolute top-full left-0 mt-1 z-20 bg-bg-card rounded-xl border border-border shadow-lg py-1 min-w-44">
                  <button
                    type="button"
                    onClick={() => selectCategory(null)}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 text-xs hover:bg-bg-page transition-colors ${
                      !categoryId ? 'text-text-primary font-medium' : 'text-text-secondary'
                    }`}
                  >
                    <FolderOpen size={13} className="text-text-muted" />
                    No category
                  </button>
                  {categories.length > 0 && (
                    <div className="border-t border-border my-1" />
                  )}
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => selectCategory(cat.id)}
                      className={`w-full text-left flex items-center gap-2 px-3 py-2 text-xs hover:bg-bg-page transition-colors ${
                        categoryId === cat.id ? 'text-text-primary font-medium' : 'text-text-secondary'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
