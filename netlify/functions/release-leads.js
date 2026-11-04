import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async () => {
  const { data, error } = await supabase.rpc("release_matured_leads");
  if (error) {
    console.error("release_matured_leads", error);
    return new Response("Erreur", { status: 500 });
  }
  console.log(`Leads validés : ${data}`);
  return new Response(JSON.stringify({ validated: data }), { status: 200 });
};

export const config = { schedule: "@daily" };
