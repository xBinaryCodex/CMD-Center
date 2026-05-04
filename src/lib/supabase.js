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

/**
 * Attempt to redeem a license key.
 * Returns { success: true, plan: 'pro' } or { success: false, error: string }
 * Requires RLS policy: authenticated users can UPDATE rows where used_by IS NULL.
 */
export async function redeemLicense(rawKey, userId) {
  const key = rawKey.trim().toLowerCase()

  // Atomically claim the key (only works if used_by IS NULL → prevents double-use)
  const { data, error } = await supabase
    .from('licenses')
    .update({ used_by: userId, used_at: new Date().toISOString() })
    .eq('key', key)
    .is('used_by', null)
    .select('plan')
    .single()

  if (error || !data) {
    // Distinguish "already used" vs "doesn't exist"
    const { data: check } = await supabase
      .from('licenses')
      .select('used_by')
      .eq('key', key)
      .maybeSingle()
    if (!check) return { success: false, error: 'Invalid key — double-check and try again.' }
    if (check.used_by) return { success: false, error: 'This key has already been used.' }
    return { success: false, error: 'Activation failed — please try again.' }
  }

  return { success: true, plan: data.plan || 'pro' }
}
