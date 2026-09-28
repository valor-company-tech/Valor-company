import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export async function handler(event){
  const { query } = JSON.parse(event.body)
  const cleanQuery = query.toLowerCase().trim()

  // A. ON VERIFIE LE CACHE - 0 TOKEN DEPENSE SI DEJA VU
  const { data: cached } = await supabase.from('bmoney_cache').select('rapport').eq('query', cleanQuery).single()
  if(cached) return { statusCode: 200, body: JSON.stringify({ from_cache: true, rapport: cached.rapport }) }

  // B. SI NOUVEAU, ON APPELLE L'IA AVEC PROMPT OPTIMAL
  // C'est ici qu'on économise : prompt court, structuré, max_tokens limité
  const prompt = `Analyse niche: "${query}". Réponds JSON court seulement: {niche, volume, marge_x, saturation_%, 3_actions, verdict_en_1_phrase}`

  const iaResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method:"POST",
    headers:{ "Authorization": `Bearer ${process.env.OPENAI_KEY}`, "Content-Type":"application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{role:"user", content: prompt}],
      max_tokens: 550, // Suffisant pour être clair, pas trop pour être cher
      temperature: 0.4,
      response_format: { type: "json_object" }
    })
  }).then(r=>r.json())

  const rapport = JSON.parse(iaResponse.choices[0].message.content)

  // C. ON SAUVEGARDE POUR NE PLUS JAMAIS PAYER
  await supabase.from('bmoney_cache').insert({ query: cleanQuery, rapport })

  return { statusCode: 200, body: JSON.stringify({ from_cache: false, rapport }) }
}
