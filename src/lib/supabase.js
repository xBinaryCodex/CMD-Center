import { createClient } from '@supabase/supabase-js'

const url  = import.meta.env.VITE_SUPABASE_URL
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.warn('[Supabase] Missing env vars — running in local-only mode')
}

export const supabase = createClient(url || 'http://localhost', key || 'placeholder', {
  auth: { persistSession: true, autoRefreshToken: true },
})

export async function getRemoteData(userId) {
  const { data, error } = await supabase
    .from('user_data')
    .select('data')
    .eq('user_id', userId)
    .single()
  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
  return data?.data ?? null
}

export async function upsertRemoteData(userId, data) {
  const { error } = await supabase
    .from('user_data')
    .upsert({ user_id: userId, data, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) throw error
}

export async function deleteUserData(userId) {
  const { error } = await supabase
    .from('user_data')
    .delete()
    .eq('user_id', userId)
  if (error) throw error
}
