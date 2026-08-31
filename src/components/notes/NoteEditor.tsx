import { useState, useRef, useEffect, useCallback } from 'react'
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper, Extension } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'
import {
  ArrowLeft, Check, Trash2, Pin, ChevronDown, FolderOpen, X, Plus,
  Lock, LockOpen, Bold, Heading1, Heading2, List, ListOrdered,
  CheckSquare, FileText, ChevronRight, Users, RefreshCw, Download,
  Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, Layout,
  Type,
} from 'lucide-react'
import { exportNoteAsMarkdown, exportNoteAsPdf } from '../../lib/markdown'
import type { Category } from '../../hooks/useCategories'
import type { Tag } from '../../hooks/useTags'
import type { Note } from '../../hooks/useNotes'
import { useNoteRealtime } from '../../hooks/useNoteRealtime'

type WrapMode = 'inline' | 'square-left' | 'square-right' | 'break' | 'behind' | 'in-front'

function ResizableImageComponent({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const { src, alt, wrap = 'inline', width = '100%' } = node.attrs
  const [menuOpen, setMenuOpen] = useState(false)

  const wrapClasses: Record<WrapMode, string> = {
    'inline': 'block my-3 clear-both max-w-full',
    'square-left': 'float-left mr-4 mb-3 clear-left max-w-full z-10 relative',
    'square-right': 'float-right ml-4 mb-3 clear-right max-w-full z-10 relative',
    'break': 'block my-4 clear-both w-full text-center',
    'behind': 'absolute inset-0 opacity-25 pointer-events-auto -z-10 object-cover w-full h-full select-none',
    'in-front': 'absolute top-4 left-4 z-20 shadow-2xl opacity-90',
  }

  return (
    <NodeViewWrapper
      as="span"
      className={`relative inline-block group image-node-wrapper ${wrapClasses[wrap as WrapMode] || wrapClasses.inline} ${selected ? 'ring-2 ring-accent-gold rounded-lg' : ''}`}
      style={{ width: wrap === 'behind' ? '100%' : width }}
    >
      <div className="relative inline-block w-full">
        <img
          src={src}
          alt={alt || ''}
          className="rounded-lg max-w-full h-auto object-contain cursor-pointer shadow-xs"
          onClick={() => setMenuOpen(prev => !prev)}
        />

        {/* Floating image format pill */}
        <div className={`absolute top-2 right-2 bg-bg-card/95 backdrop-blur-xs border border-border rounded-lg shadow-md p-1 items-center gap-1 z-30 ${menuOpen ? 'flex' : 'hidden group-hover:flex'}`}>
          {/* Alignment / Wrap menu */}
          <button
            type="button"
            title="Inline block"
            onClick={() => { updateAttributes({ wrap: 'inline' }); setMenuOpen(false) }}
            className={`p-1 rounded hover:bg-bg-page text-xs ${wrap === 'inline' ? 'text-accent-gold font-bold bg-accent-gold/10' : 'text-text-secondary'}`}
          >
            <AlignCenter size={13} />
          </button>
          <button
            type="button"
            title="Square Left (Float Left)"
            onClick={() => { updateAttributes({ wrap: 'square-left' }); setMenuOpen(false) }}
            className={`p-1 rounded hover:bg-bg-page text-xs ${wrap === 'square-left' ? 'text-accent-gold font-bold bg-accent-gold/10' : 'text-text-secondary'}`}
          >
            <AlignLeft size={13} />
          </button>
          <button
            type="button"
            title="Square Right (Float Right)"
            onClick={() => { updateAttributes({ wrap: 'square-right' }); setMenuOpen(false) }}
            className={`p-1 rounded hover:bg-bg-page text-xs ${wrap === 'square-right' ? 'text-accent-gold font-bold bg-accent-gold/10' : 'text-text-secondary'}`}
          >
            <AlignRight size={13} />
          </button>
          <button
            type="button"
            title="Full Break"
            onClick={() => { updateAttributes({ wrap: 'break', width: '100%' }); setMenuOpen(false) }}
            className={`p-1 rounded hover:bg-bg-page text-xs ${wrap === 'break' ? 'text-accent-gold font-bold bg-accent-gold/10' : 'text-text-secondary'}`}
          >
            <Layout size={13} />
          </button>
          <button
            type="button"
            title="Behind text (Watermark)"
            onClick={() => { updateAttributes({ wrap: 'behind' }); setMenuOpen(false) }}
            className={`px-1 py-0.5 rounded hover:bg-bg-page text-[10px] ${wrap === 'behind' ? 'text-accent-gold font-bold bg-accent-gold/10' : 'text-text-muted'}`}
          >
            Behind
          </button>

          <div className="w-px h-3 bg-border mx-0.5" />

          {/* Quick Resizing */}
          <button
            type="button"
            title="Small (25%)"
            onClick={() => { updateAttributes({ width: '25%' }); setMenuOpen(false) }}
            className="px-1 py-0.5 rounded text-[10px] text-text-secondary hover:bg-bg-page"
          >
            S
          </button>
          <button
            type="button"
            title="Medium (50%)"
            onClick={() => { updateAttributes({ width: '50%' }); setMenuOpen(false) }}
            className="px-1 py-0.5 rounded text-[10px] text-text-secondary hover:bg-bg-page"
          >
            M
          </button>
          <button
            type="button"
            title="Full (100%)"
            onClick={() => { updateAttributes({ width: '100%' }); setMenuOpen(false) }}
            className="px-1 py-0.5 rounded text-[10px] text-text-secondary hover:bg-bg-page"
          >
            L
          </button>

          <div className="w-px h-3 bg-border mx-0.5" />

          <button
            type="button"
            title="Delete image"
            onClick={() => deleteNode()}
            className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </NodeViewWrapper>
  )
}

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      wrap: {
        default: 'inline',
        parseHTML: element => element.getAttribute('data-wrap') || 'inline',
        renderHTML: attributes => ({
          'data-wrap': attributes.wrap,
        }),
      },
      width: {
        default: '100%',
        parseHTML: element => element.getAttribute('data-width') || '100%',
        renderHTML: attributes => ({
          'data-width': attributes.width,
        }),
      },
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent)
  },
})

// Custom extension for font size styling
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType
      unsetFontSize: () => ReturnType
    }
  }
}

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle', 'paragraph', 'heading', 'taskItem', 'listItem'],
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {}
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .run()
      },
    }
  },
})

const FONT_SIZES = [
  { label: 'Small', value: '12px' },
  { label: 'Normal', value: '14px' },
  { label: 'Medium', value: '16px' },
  { label: 'Large', value: '18px' },
  { label: 'Extra Large', value: '22px' },
]

interface NoteEditorProps {
  initialTitle?: string
  initialContent?: string
  categoryId?: string | null
  categories?: Category[]
  noteTags?: Tag[]
  allTags?: Tag[]
  pinHash?: string | null
  isPinned?: boolean
  onPin?: () => void
  onLockToggle?: () => void
  onSave: (title: string, content: string) => Promise<void>
  onBack: () => void
  onDelete?: () => void
  onCategoryChange?: (categoryId: string | null) => void
  onTagAdd?: (tagId: string) => void
  onTagRemove?: (tagId: string) => void
  onTagCreate?: (name: string) => Promise<Tag | null>
  // Sub-notes
  subNotes?: Note[]
  onNewSubNote?: () => void
  onOpenSubNote?: (note: Note) => void
  // Collaboration
  noteId?: string
  onShare?: () => void
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
  subNotes = [],
  onNewSubNote,
  onOpenSubNote,
  noteId,
  onShare,
}: NoteEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [remoteUpdater, setRemoteUpdater] = useState<string | null>(null)
  const [catOpen, setCatOpen] = useState(false)
  const [tagOpen, setTagOpen] = useState(false)
  const [tagSearch, setTagSearch] = useState('')
  const [exportOpen, setExportOpen] = useState(false)

  const titleRef = useRef<HTMLInputElement>(null)
  const exportDropdownRef = useRef<HTMLDivElement>(null)
  const catDropdownRef = useRef<HTMLDivElement>(null)
  const tagDropdownRef = useRef<HTMLDivElement>(null)
  const tagInputRef = useRef<HTMLInputElement>(null)
  const didFocus = useRef(false)
  // Debounced autosave: pending timer + a ref to the latest `save` closure so
  // the tiptap onUpdate callback (bound once) never fires a stale save with
  // an outdated title.
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestSaveRef = useRef<() => Promise<void>>(async () => {})
  const autosaveTriggerRef = useRef<() => void>(() => {})

  const currentCategory = categories.find(c => c.id === categoryId) ?? null
  const noteTagIds = new Set(noteTags.map(t => t.id))
  const filteredAvailableTags = allTags.filter(
    t => !noteTagIds.has(t.id) && t.name.toLowerCase().includes(tagSearch.toLowerCase())
  )
  const canCreate =
    tagSearch.trim().length > 0 &&
    !allTags.some(t => t.name.toLowerCase() === tagSearch.trim().toLowerCase()) &&
    !!onTagCreate

  const fileInputRef = useRef<HTMLInputElement>(null)

  const editorRef = useRef<ReturnType<typeof useEditor>>(null)

  const handleImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      if (base64 && editorRef.current) {
        editorRef.current.chain().focus().setImage({ src: base64 }).run()
      }
    }
    reader.readAsDataURL(file)
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      TaskList,
      TaskItem.configure({ nested: false }),
      CustomImage.configure({
        allowBase64: true,
      }),
      FontSize,
    ],
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'prose-editor focus:outline-none',
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items
        if (items) {
          for (const item of Array.from(items)) {
            if (item.type.indexOf('image') === 0) {
              const file = item.getAsFile()
              if (file) {
                handleImageFile(file)
                return true
              }
            }
          }
        }
        return false
      },
      handleDrop: (_view, event, _slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0]
          if (file.type.startsWith('image/')) {
            handleImageFile(file)
            return true
          }
        }
        return false
      },
    },
    onUpdate: () => autosaveTriggerRef.current(),
  })

  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  useNoteRealtime(noteId ?? null, useCallback(({ title: remoteTitle, content: remoteContent }) => {
    setTitle(remoteTitle)
    editor?.commands.setContent(remoteContent)
    setRemoteUpdater('collaborator')
    setTimeout(() => setRemoteUpdater(null), 4000)
  }, [editor]))

  useEffect(() => {
    if (didFocus.current) return
    didFocus.current = true
    if (!initialTitle) {
      titleRef.current?.focus()
    } else {
      editor?.commands.focus('end')
    }
  }, [initialTitle, editor])

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
    if (!exportOpen) return
    function handleClick(e: MouseEvent) {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [exportOpen])

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
    if (status === 'saving' || !editor) return
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    setStatus('saving')
    const html = editor.getHTML()
    await onSave(title.trim() || 'Untitled', html)
    setStatus('saved')
    setTimeout(() => setStatus('idle'), 2000)
  }, [status, onSave, title, editor])

  useEffect(() => {
    latestSaveRef.current = save
  }, [save])

  // Stable identity (tiptap's onUpdate is bound once) — always resolves the
  // latest `save` via the ref above when the debounce timer fires.
  const scheduleAutosave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null
      void latestSaveRef.current()
    }, 800)
  }, [])

  useEffect(() => {
    autosaveTriggerRef.current = scheduleAutosave
  }, [scheduleAutosave])

  // Flush any pending autosave before leaving the editor, so navigating away
  // (Back button, sidebar link, etc.) never drops unsaved edits.
  async function handleBack() {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
      await latestSaveRef.current()
    }
    onBack()
  }

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        void latestSaveRef.current()
      }
    }
  }, [])

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

  function handleExport(format: 'md' | 'pdf') {
    setExportOpen(false)
    if (!editor) return
    const exportTitle = title.trim() || 'Untitled'
    if (format === 'md') {
      exportNoteAsMarkdown(exportTitle, editor.getHTML())
    } else {
      exportNoteAsPdf(exportTitle, editor.getHTML())
    }
  }

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

  const isH1 = editor?.isActive('heading', { level: 1 }) ?? false
  const isH2 = editor?.isActive('heading', { level: 2 }) ?? false
  const textStyleLabel = isH1 ? 'Heading' : isH2 ? 'Subtitle' : 'Normal'

  return (
    <div className="flex flex-col min-h-screen">
      {/* Remote update banner */}
      {remoteUpdater && (
        <div className="flex items-center gap-2 px-4 py-2 bg-accent-gold/10 border-b border-accent-gold/20 text-xs text-accent-gold">
          <RefreshCw size={12} className="shrink-0" />
          Note updated by a collaborator
        </div>
      )}

      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3 bg-bg-page border-b border-border">
        <button
          onClick={() => void handleBack()}
          className="flex items-center gap-1.5 text-text-muted hover:text-text-primary text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          {status === 'saved' && (
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Check size={12} />
              Saved
            </span>
          )}
          <div className="relative" ref={exportDropdownRef}>
            <button
              type="button"
              onClick={() => setExportOpen(v => !v)}
              aria-label="Export note"
              className="flex items-center gap-1.5 rounded-lg px-2 sm:px-3 py-1.5 text-sm text-text-muted hover:text-accent-gold hover:bg-accent-gold/10 transition-colors"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export</span>
            </button>

            {exportOpen && (
              <div className="absolute top-full right-0 mt-1 z-20 bg-bg-card rounded-xl border border-border shadow-lg py-1 min-w-44">
                <button
                  type="button"
                  onClick={() => handleExport('md')}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-bg-page transition-colors"
                >
                  <FileText size={13} className="text-text-muted shrink-0" />
                  Markdown (.md)
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-bg-page transition-colors"
                >
                  <FileText size={13} className="text-text-muted shrink-0" />
                  PDF (print)
                </button>
              </div>
            )}
          </div>
          {onShare && (
            <button
              type="button"
              onClick={onShare}
              aria-label="Collaboration"
              className="flex items-center gap-1.5 rounded-lg px-2 sm:px-3 py-1.5 text-sm text-text-muted hover:text-accent-gold hover:bg-accent-gold/10 transition-colors"
            >
              <Users size={14} />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}
          {onPin && (
            <button
              type="button"
              onClick={onPin}
              aria-label={isPinned ? 'Unpin note' : 'Pin note'}
              className={`flex items-center gap-1.5 rounded-lg px-2 sm:px-3 py-1.5 text-sm transition-colors ${
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
              className={`flex items-center gap-1.5 rounded-lg px-2 sm:px-3 py-1.5 text-sm transition-colors ${
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
              className="flex items-center gap-1.5 rounded-lg px-2 sm:px-3 py-1.5 text-sm text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
          onChange={e => { setTitle(e.target.value); scheduleAutosave() }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              editor?.commands.focus('start')
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

        <div className="border-t border-border mb-4" />

        {/* Formatting toolbar */}
        <div className="flex items-center gap-1 mb-4 flex-wrap">
          {/* Text style dropdown */}
          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-text-secondary hover:bg-bg-card border border-border transition-colors min-w-20"
            >
              {textStyleLabel}
              <ChevronDown size={11} className="ml-auto" />
            </button>
            <div className="absolute top-full left-0 mt-1 z-20 bg-bg-card rounded-xl border border-border shadow-lg py-1 min-w-36 hidden group-focus-within:block">
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); editor?.chain().focus().setParagraph().run() }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-bg-page transition-colors ${!isH1 && !isH2 ? 'text-text-primary font-medium' : 'text-text-secondary'}`}
              >
                Normal
              </button>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 1 }).run() }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-bg-page transition-colors font-semibold ${isH1 ? 'text-text-primary' : 'text-text-secondary'}`}
              >
                Heading
              </button>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 2 }).run() }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-bg-page transition-colors font-medium ${isH2 ? 'text-text-primary' : 'text-text-secondary'}`}
              >
                Subtitle
              </button>
            </div>
          </div>

          {/* Font size dropdown */}
          <div className="relative group">
            <button
              type="button"
              title="Font size"
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-text-secondary hover:bg-bg-card border border-border transition-colors"
            >
              <Type size={13} className="text-text-muted" />
              <ChevronDown size={10} className="text-text-muted" />
            </button>
            <div className="absolute top-full left-0 mt-1 z-20 bg-bg-card rounded-xl border border-border shadow-lg py-1 min-w-32 hidden group-focus-within:block">
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault()
                  editor?.chain().focus().unsetFontSize().run()
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-page transition-colors"
              >
                Default
              </button>
              {FONT_SIZES.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onMouseDown={e => {
                    e.preventDefault()
                    editor?.chain().focus().setFontSize(s.value).run()
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-page transition-colors flex items-center justify-between"
                >
                  <span>{s.label}</span>
                  <span className="text-[10px] text-text-muted">{s.value}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Bold */}
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleBold().run() }}
            className={`rounded-lg p-1.5 text-sm font-bold transition-colors ${
              editor?.isActive('bold') ? 'bg-accent-gold/15 text-accent-gold' : 'text-text-muted hover:text-text-secondary hover:bg-bg-card'
            }`}
            aria-label="Bold"
          >
            <Bold size={14} />
          </button>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Bullet list */}
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleBulletList().run() }}
            className={`rounded-lg p-1.5 transition-colors ${
              editor?.isActive('bulletList') ? 'bg-accent-gold/15 text-accent-gold' : 'text-text-muted hover:text-text-secondary hover:bg-bg-card'
            }`}
            aria-label="Bullet list"
          >
            <List size={14} />
          </button>

          {/* Ordered list */}
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleOrderedList().run() }}
            className={`rounded-lg p-1.5 transition-colors ${
              editor?.isActive('orderedList') ? 'bg-accent-gold/15 text-accent-gold' : 'text-text-muted hover:text-text-secondary hover:bg-bg-card'
            }`}
            aria-label="Numbered list"
          >
            <ListOrdered size={14} />
          </button>

          {/* Checklist */}
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleTaskList().run() }}
            className={`rounded-lg p-1.5 transition-colors ${
              editor?.isActive('taskList') ? 'bg-accent-gold/15 text-accent-gold' : 'text-text-muted hover:text-text-secondary hover:bg-bg-card'
            }`}
            aria-label="Checklist"
          >
            <CheckSquare size={14} />
          </button>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Insert Image Button */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) {
                handleImageFile(file)
                e.target.value = ''
              }
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg p-1.5 transition-colors text-text-muted hover:text-text-secondary hover:bg-bg-card"
            title="Upload/Insert Image"
            aria-label="Upload Image"
          >
            <ImageIcon size={14} />
          </button>

          <div className="hidden sm:flex items-center gap-1 ml-1">
            <div className="w-px h-5 bg-border mx-1" />
            {/* Heading shortcuts */}
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 1 }).run() }}
              className={`rounded-lg p-1.5 transition-colors ${
                isH1 ? 'bg-accent-gold/15 text-accent-gold' : 'text-text-muted hover:text-text-secondary hover:bg-bg-card'
              }`}
              aria-label="Heading 1"
            >
              <Heading1 size={14} />
            </button>
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 2 }).run() }}
              className={`rounded-lg p-1.5 transition-colors ${
                isH2 ? 'bg-accent-gold/15 text-accent-gold' : 'text-text-muted hover:text-text-secondary hover:bg-bg-card'
              }`}
              aria-label="Heading 2"
            >
              <Heading2 size={14} />
            </button>
          </div>
        </div>

        {/* Tiptap editor */}
        <EditorContent
          editor={editor}
          className="tiptap-editor min-h-[50vh] text-text-secondary text-sm leading-relaxed"
        />

        {/* Sub-notes panel */}
        {(onNewSubNote || subNotes.length > 0) && (
          <div className="mt-12 pt-6 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-text-muted text-xs font-medium uppercase tracking-wide">
                Sub-notes ({subNotes.length})
              </h3>
              {onNewSubNote && (
                <button
                  type="button"
                  onClick={onNewSubNote}
                  className="flex items-center gap-1 text-xs text-text-muted hover:text-accent-gold transition-colors"
                >
                  <Plus size={12} />
                  New sub-note
                </button>
              )}
            </div>

            {subNotes.length === 0 ? (
              <p className="text-text-muted text-xs italic">No sub-notes yet.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {subNotes.map(sub => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => onOpenSubNote?.(sub)}
                    className="flex items-center gap-3 rounded-xl border border-border bg-bg-card px-4 py-3 text-left hover:shadow-sm transition-shadow group"
                  >
                    <FileText size={14} className="text-text-muted shrink-0" />
                    <span className="flex-1 min-w-0 text-sm text-text-primary font-medium truncate">
                      {sub.title || 'Untitled'}
                    </span>
                    <ChevronRight size={14} className="text-text-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
