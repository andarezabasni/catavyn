import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, Check, Trash2, Pin, ChevronDown, FolderOpen, X, Plus, Lock, LockOpen } from 'lucide-react'
import type { Category } from '../../hooks/useCategories'
import type { Tag } from '../../hooks/useTags'

interface NoteEditorProps {
  initialTitle?: string
  initialContent?: string
  categoryId?: string | null
  categories?: Category[]
  noteTags?: Tag[]
  allTags?: Tag[]
  pinHash?: string | null
  onSave: (title: string, content: string) => Promise<void>
  onBack: () => void
  onDelete?: () => void
  isPinned?: boolean
  onPin?: () => void
  onLockToggle?: () => void
  onCategoryChange?: (categoryId: string | null) => void
  onTagAdd?: (tagId: string) => void
  onTagRemove?: (tagId: string) => void
  onTagCreate?: (name: string) => Promise<Tag | null>
}

export default function NoteEditor({
  initialTitle = '',
  initialContent = '',
  categoryId = null,
  categories = [],
  noteTags = [],
  allTags = [],
  pinHash = null,
  isPinned = false,
  onPin,
  onLockToggle,
  onSave,
  onBack,
  onDelete,
  onCategoryChange,
  onTagAdd,
  onTagRemove,
  onTagCreate,
}: NoteEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [catOpen, setCatOpen] = useState(false)
  const [tagOpen, setTagOpen] = useState(false)
  const [tagSearch, setTagSearch] = useState('')

  const titleRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const catDropdownRef = useRef<HTMLDivElement>(null)
  const tagDropdownRef = useRef<HTMLDivElement>(null)
  const tagInputRef = useRef<HTMLInputElement>(null)
  const didFocus = useRef(false)

  const currentCategory = categories.find(c => c.id === categoryId) ?? null

  const noteTagIds = new Set(noteTags.map(t => t.id))
  const filteredAvailableTags = allTags.filter(
    t => !noteTagIds.has(t.id) && t.name.toLowerCase().includes(tagSearch.toLowerCase())
  )
  const canCreate =
    tagSearch.trim().length > 0 &&
    !allTags.some(t => t.name.toLowerCase() === tagSearch.trim().toLowerCase()) &&
    !!onTagCreate

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

  useEffect(() => {
    if (!tagOpen) return
    tagInputRef.current?.focus()
    function handleClick(e: MouseEvent) {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setTagOpen(false)
        setTagSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [tagOpen])

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

  function pickTag(tagId: string) {
    onTagAdd?.(tagId)
    setTagSearch('')
    setTagOpen(false)
  }

  async function createAndAttach() {
    if (!onTagCreate || !tagSearch.trim()) return
    await onTagCreate(tagSearch.trim())
    setTagSearch('')
    setTagOpen(false)
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3 bg-bg-page border-b border-border">
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
          {onPin && (
            <button
              type="button"
              onClick={onPin}
              aria-label={isPinned ? 'Unpin note' : 'Pin note'}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                isPinned
                  ? 'text-accent-gold hover:opacity-75'
                  : 'text-text-muted hover:text-accent-gold hover:bg-accent-gold/10'
              }`}
            >
              <Pin size={14} />
              <span className="hidden sm:inline">{isPinned ? 'Pinned' : 'Pin'}</span>
            </button>
          )}
          {onLockToggle && (
            <button
              type="button"
              onClick={onLockToggle}
              aria-label={pinHash ? 'Manage note lock' : 'Lock note'}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                pinHash
                  ? 'text-accent-gold hover:opacity-75'
                  : 'text-text-muted hover:text-accent-gold hover:bg-accent-gold/10'
              }`}
            >
              {pinHash ? <Lock size={14} /> : <LockOpen size={14} />}
              <span className="hidden sm:inline">{pinHash ? 'Locked' : 'Lock'}</span>
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              type="button"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
      <div className="flex-1 px-4 py-6 sm:px-6 sm:py-8 max-w-3xl mx-auto w-full">
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
          className="w-full bg-transparent text-text-primary font-semibold text-xl sm:text-2xl placeholder:text-text-muted focus:outline-none mb-4"
        />

        {/* Category picker */}
        {onCategoryChange && (
          <div className="mb-3" ref={catDropdownRef}>
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
                  {categories.length > 0 && <div className="border-t border-border my-1" />}
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

        {/* Tag picker */}
        {(onTagAdd || noteTags.length > 0) && (
          <div className="mb-4 flex items-center gap-1.5 flex-wrap">
            {noteTags.map(tag => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
                {onTagRemove && (
                  <button
                    type="button"
                    onClick={() => onTagRemove(tag.id)}
                    aria-label={`Remove tag ${tag.name}`}
                    className="rounded-full hover:opacity-75 transition-opacity leading-none"
                  >
                    <X size={10} />
                  </button>
                )}
              </span>
            ))}

            {onTagAdd && (
              <div className="relative" ref={tagDropdownRef}>
                <button
                  type="button"
                  onClick={() => setTagOpen(v => !v)}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-0.5 text-[11px] text-text-muted hover:border-accent-gold/50 hover:text-text-secondary transition-colors"
                >
                  <Plus size={10} />
                  Add tag
                </button>

                {tagOpen && (
                  <div className="absolute top-full left-0 mt-1 z-20 bg-bg-card rounded-xl border border-border shadow-lg py-1 min-w-48">
                    <div className="px-2 pt-1 pb-1">
                      <input
                        ref={tagInputRef}
                        type="text"
                        value={tagSearch}
                        onChange={e => setTagSearch(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            if (filteredAvailableTags.length > 0 && !canCreate) {
                              pickTag(filteredAvailableTags[0].id)
                            } else if (canCreate) {
                              void createAndAttach()
                            }
                          }
                        }}
                        placeholder="Search or create…"
                        className="w-full rounded-lg bg-bg-page border border-border px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-gold/50"
                      />
                    </div>

                    {canCreate && (
                      <button
                        type="button"
                        onClick={() => void createAndAttach()}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs hover:bg-bg-page transition-colors text-text-secondary"
                      >
                        <Plus size={12} className="text-accent-gold shrink-0" />
                        Create &ldquo;{tagSearch.trim()}&rdquo;
                      </button>
                    )}

                    {canCreate && filteredAvailableTags.length > 0 && (
                      <div className="border-t border-border my-1" />
                    )}

                    {filteredAvailableTags.length === 0 && !canCreate ? (
                      <p className="px-3 py-2 text-xs text-text-muted">
                        {tagSearch ? 'No matching tags' : 'All tags added'}
                      </p>
                    ) : (
                      filteredAvailableTags.map(tag => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => pickTag(tag.id)}
                          className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs hover:bg-bg-page transition-colors"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="text-text-secondary">{tag.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
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
