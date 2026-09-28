import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export async function handler(event){
  const { user_id } = JSON.parse(event.body)
  const mois = new Date().toISOString().slice(0,7) // 2026-05

  const { data } = await supabase.from('bmoney_quotas').select('*').eq('user_id', user_id).eq('mois', mois).single()

  const LIMITS = { forfait_0:0, forfait_1:50, forfait_2:100, forfait_3:200 }
  const plan = data?.plan || 'forfait_0'
  const used = data?.used || 0

  return { statusCode: 200, body: JSON.stringify({
    quota_ok: used < (LIMITS[plan]||0),
    used, max: LIMITS[plan], plan
  })}
}
