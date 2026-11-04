import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // 1. Vérifier la signature : sans elle, on refuse tout
  const rawBody = await req.text();
  const signature = req.headers.get("x-notch-signature") || "";
  const expected = crypto
    .createHmac("sha256", process.env.NOTCHPAY_HASH)
    .update(rawBody)
    .digest("hex");

  const valid =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) {
    return new Response("Signature invalide", { status: 401 });
  }

  // 2. Ne traiter que les paiements terminés
  const event = JSON.parse(rawBody);
  const data = event.data || {};
  if (data.status !== "complete") {
    return new Response("Ignoré", { status: 200 });
  }

  // 3. Le montant et la structure viennent des métadonnées créées par le serveur
  const meta = data.metadata || {};
  if (meta.kind !== "caution" || !meta.listing_id) {
    return new Response("Ignoré", { status: 200 });
  }

  const amountMinor = Math.round(Number(data.amount) * 100);

  // 4. Enregistrer une seule fois (idempotence)
  const { data: result, error } = await supabase.rpc("apply_caution_payment", {
    p_reference: data.reference,
    p_listing_id: meta.listing_id,
    p_amount_minor: amountMinor,
  });

  if (error) {
    console.error("apply_caution_payment", error);
    return new Response("Erreur serveur", { status: 500 });
  }
  return new Response(JSON.stringify({ result }), { status: 200 });
};
