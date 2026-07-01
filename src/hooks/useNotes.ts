import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from '../lib/toast'
import type { Database } from '../lib/database.types'

export type Note = Database['public']['Tables']['notes']['Row']
type NoteInsert = Omit<Database['public']['Tables']['notes']['Insert'], 'user_id'>
type NoteUpdate = Database['public']['Tables']['notes']['Update']

interface UseNotesOptions {
  deleted?: boolean
  parentId?: string    // fetch sub-notes of this note
  rootOnly?: boolean   // fetch only root notes (parent_id IS NULL)
  includeShared?: boolean // also return notes shared with user (not just own)
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

    // When includeShared is true, omit the user_id filter and let RLS return
    // both own notes and notes where the user is a collaborator
    let query = supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false })

    if (!options.includeShared) {
      query = query.eq('user_id', user.id)
    }

    if (options.deleted) {
      query = query.not('deleted_at', 'is', null)
    } else {
      query = query.is('deleted_at', null)
    }

    if (options.parentId !== undefined) {
      query = query.eq('parent_id', options.parentId)
    } else if (options.rootOnly) {
      query = query.is('parent_id', null)
    }

    const { data, error } = await query

    if (error) {
      setError(error.message)
    } else {
      setNotes(data ?? [])
    }
    setLoading(false)
  }, [user, options.deleted, options.parentId, options.rootOnly, options.includeShared])

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

    const tempId = `temp-${Date.now()}`
    const optimistic: Note = {
      id: tempId,
      is_pinned: false,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category_id: null,
      ...payload,
      pin_hash: payload.pin_hash ?? null,
      parent_id: (payload.parent_id ?? null) as string | null,
      updated_by: (payload.updated_by ?? null) as string | null,
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
      toast.error('Failed to create note')
      return null
    }

    setNotes(prev => prev.map(n => n.id === tempId ? created : n))
    return created
  }, [user, options.deleted])

  const updateNote = useCallback(async (id: string, data: NoteUpdate) => {
    const now = new Date().toISOString()
    const patch = { ...data, updated_at: now, updated_by: user?.id ?? null }

    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...patch } : n))

    const { error } = await supabase
      .from('notes')
      .update(patch)
      .eq('id', id)

    if (error) {
      setError(error.message)
      toast.error('Failed to save note')
      await fetchNotes()
    }
  }, [user, fetchNotes])

  const deleteNote = useCallback(async (id: string) => {
    const now = new Date().toISOString()

    setNotes(prev => prev.filter(n => n.id !== id))

    const { error } = await supabase
      .from('notes')
      .update({ deleted_at: now, updated_at: now })
      .eq('id', id)

    if (error) {
      setError(error.message)
      toast.error('Failed to delete note')
      await fetchNotes()
    }
  }, [fetchNotes])

  const restoreNote = useCallback(async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id))

    const { error } = await supabase
      .from('notes')
      .update({ deleted_at: null, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      setError(error.message)
      toast.error('Failed to restore note')
      await fetchNotes()
    }
  }, [fetchNotes])

  const permanentlyDeleteNote = useCallback(async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id))

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)

    if (error) {
      setError(error.message)
      toast.error('Failed to permanently delete note')
      await fetchNotes()
    }
  }, [fetchNotes])

  const togglePin = useCallback(async (id: string, pinned: boolean) => {
    await updateNote(id, { is_pinned: pinned })
  }, [updateNote])

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
    togglePin,
  }
}
