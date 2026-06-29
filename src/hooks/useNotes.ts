import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Database } from '../lib/database.types'

export type Note = Database['public']['Tables']['notes']['Row']
type NoteInsert = Omit<Database['public']['Tables']['notes']['Insert'], 'user_id'>
type NoteUpdate = Database['public']['Tables']['notes']['Update']

interface UseNotesOptions {
  deleted?: boolean
}

export function useNotes(options: UseNotesOptions = {}) {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotes = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    const query = supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    const { data, error } = options.deleted
      ? await query.not('deleted_at', 'is', null)
      : await query.is('deleted_at', null)

    if (error) {
      setError(error.message)
    } else {
      setNotes(data ?? [])
    }
    setLoading(false)
  }, [user, options.deleted])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const createNote = useCallback(async (data: NoteInsert = {}): Promise<Note | null> => {
    if (!user) return null

    const payload = {
      user_id: user.id,
      title: 'Untitled',
      content: '',
      ...data,
    }

    // Optimistic insert
    const tempId = `temp-${Date.now()}`
    const optimistic: Note = {
      id: tempId,
      is_pinned: false,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category_id: null,
      ...payload,
    }
    if (!options.deleted) setNotes(prev => [optimistic, ...prev])

    const { data: created, error } = await supabase
      .from('notes')
      .insert(payload)
      .select()
      .single()

    if (error) {
      setNotes(prev => prev.filter(n => n.id !== tempId))
      setError(error.message)
      return null
    }

    setNotes(prev => prev.map(n => n.id === tempId ? created : n))
    return created
  }, [user, options.deleted])

  const updateNote = useCallback(async (id: string, data: NoteUpdate) => {
    const now = new Date().toISOString()
    const patch = { ...data, updated_at: now }

    // Optimistic update
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...patch } : n))

    const { error } = await supabase
      .from('notes')
      .update(patch)
      .eq('id', id)

    if (error) {
      setError(error.message)
      await fetchNotes()
    }
  }, [fetchNotes])

  const deleteNote = useCallback(async (id: string) => {
    const now = new Date().toISOString()

    // Optimistic remove from active list
    setNotes(prev => prev.filter(n => n.id !== id))

    const { error } = await supabase
      .from('notes')
      .update({ deleted_at: now, updated_at: now })
      .eq('id', id)

    if (error) {
      setError(error.message)
      await fetchNotes()
    }
  }, [fetchNotes])

  const restoreNote = useCallback(async (id: string) => {
    // Optimistic remove from trash list
    setNotes(prev => prev.filter(n => n.id !== id))

    const { error } = await supabase
      .from('notes')
      .update({ deleted_at: null, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      setError(error.message)
      await fetchNotes()
    }
  }, [fetchNotes])

  const permanentlyDeleteNote = useCallback(async (id: string) => {
    // Optimistic remove
    setNotes(prev => prev.filter(n => n.id !== id))

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)

    if (error) {
      setError(error.message)
      await fetchNotes()
    }
  }, [fetchNotes])

  return {
    notes,
    loading,
    error,
    refetch: fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    restoreNote,
    permanentlyDeleteNote,
  }
}
