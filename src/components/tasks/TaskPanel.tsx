import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { useTasks } from '../../hooks/useTasks'
import TaskItem from './TaskItem'

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function formatHeader(d: Date): string {
  const today = toISODate(new Date())
  const target = toISODate(d)
  const tomorrow = toISODate(new Date(Date.now() + 86400000))
  const yesterday = toISODate(new Date(Date.now() - 86400000))

  if (target === today)     return 'Today'
  if (target === tomorrow)  return 'Tomorrow'
  if (target === yesterday) return 'Yesterday'

  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatSubtitle(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export default function TaskPanel() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const dateStr = toISODate(selectedDate)
  const isToday = dateStr === toISODate(new Date())

  const { tasks, loading, createTask, updateTask, deleteTask, toggleComplete } = useTasks(dateStr)

  const [addOpen, setAddOpen] = useState(false)
  const [addTitle, setAddTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const addInputRef = useRef<HTMLInputElement>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    if (addOpen) addInputRef.current?.focus()
  }, [addOpen])

  function prevDay() {
    setSelectedDate(d => new Date(d.getTime() - 86400000))
    setAddOpen(false)
  }

  function nextDay() {
    setSelectedDate(d => new Date(d.getTime() + 86400000))
    setAddOpen(false)
  }

  function goToday() {
    setSelectedDate(new Date())
    setAddOpen(false)
  }

  function cancelAdd() {
    setAddOpen(false)
    setAddTitle('')
  }

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault()
    const title = addTitle.trim()
    if (!title || adding) return
    setAdding(true)
    await createTask({ title, due_date: dateStr })
    setAddTitle('')
    setAdding(false)
    addInputRef.current?.focus()
  }

  const pending = tasks.filter(t => !t.is_completed)
  const completed = tasks.filter(t => t.is_completed)

  return (
    <div className="flex flex-col h-full bg-bg-task-panel text-white select-none">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-1">
          <button
            type="button"
            onClick={prevDay}
            aria-label="Previous day"
            className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            onClick={goToday}
            className="flex flex-col items-center gap-0.5"
            aria-label="Go to today"
          >
            <span className="text-base font-semibold text-white leading-none">
              {formatHeader(selectedDate)}
            </span>
            {!isToday && (
              <span className="text-[10px] text-white/40 leading-none">tap for today</span>
            )}
          </button>

          <button
            type="button"
            onClick={nextDay}
            aria-label="Next day"
            className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {!isToday && (
          <p className="text-center text-[11px] text-white/40 mt-1">{formatSubtitle(selectedDate)}</p>
        )}

        {isToday && (
          <p className="text-center text-[11px] text-white/40 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        )}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-5 py-3 min-h-0">
        {loading ? (
          <p className="text-white/40 text-xs text-center py-6">Loading…</p>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/40 text-xs">No tasks for this day.</p>
            <p className="text-white/25 text-[11px] mt-1">Click below to add one.</p>
          </div>
        ) : (
          <>
            {pending.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() => toggleComplete(task.id, true)}
                onDelete={() => deleteTask(task.id)}
                onEdit={() => setEditingId(task.id)}
              />
            ))}

            {completed.length > 0 && (
              <>
                {pending.length > 0 && <div className="my-2 border-t border-white/10" />}
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1 font-medium">
                  Completed · {completed.length}
                </p>
                {completed.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => toggleComplete(task.id, false)}
                    onDelete={() => deleteTask(task.id)}
                    onEdit={() => setEditingId(task.id)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Inline edit title (stub — replaced by TaskForm in 4.4) */}
      {editingId && (
        <InlineEditTitle
          task={tasks.find(t => t.id === editingId)!}
          onSave={async (title) => {
            await updateTask(editingId, { title })
            setEditingId(null)
          }}
          onClose={() => setEditingId(null)}
        />
      )}

      {/* Add task footer */}
      <div className="px-5 py-4 border-t border-white/10">
        {addOpen ? (
          <form onSubmit={handleQuickAdd} className="flex items-center gap-2">
            <input
              ref={addInputRef}
              type="text"
              value={addTitle}
              onChange={e => setAddTitle(e.target.value)}
              placeholder="Task name…"
              maxLength={100}
              className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/50"
            />
            <button
              type="submit"
              disabled={!addTitle.trim() || adding}
              className="shrink-0 rounded-lg bg-accent-green px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Add
            </button>
            <button
              type="button"
              onClick={cancelAdd}
              className="shrink-0 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={14} />
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors w-full"
          >
            <Plus size={16} />
            <span>Add new task</span>
          </button>
        )}
      </div>
    </div>
  )
}

function InlineEditTitle({
  task,
  onSave,
  onClose,
}: {
  task: { id: string; title: string }
  onSave: (title: string) => Promise<void>
  onClose: () => void
}) {
  const [value, setValue] = useState(task.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const title = value.trim()
    if (!title) return
    await onSave(title)
  }

  return (
    <div className="px-5 py-3 border-t border-white/10 bg-bg-task-panel">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Escape' && onClose()}
          maxLength={100}
          className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/50"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="shrink-0 rounded-lg bg-accent-green px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={14} />
        </button>
      </form>
    </div>
  )
}
