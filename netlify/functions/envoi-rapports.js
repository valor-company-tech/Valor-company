const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_USER,
    pass: process.env.ZOHO_PASSWORD,
  },
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function getVeilleEmergente() {
  // Ici le robot ira chercher tes 3 sources YouTube etc. automatiquement
  return [
    { titre: "Niche émergente du jour", pole: "Tendance", pourquoi: "Forte demande" },
  ];
}

function doitOnEnvoyer(user) {
  if (user.forfait === 'gratuit') return false;
  if (!user.derniere_envoi) return true;

  const dernier = new Date(user.derniere_envoi);
  const aujourdhui = new Date();
  const joursDepuis = (aujourdhui - dernier) / (1000 * 60 * 60 * 24);

  if (user.forfait === 'decouverte') return joursDepuis >= 14;
  if (user.forfait === 'strategie') return joursDepuis >= 7;
  if (user.forfait === 'premium') {
    const foisParSemaine = user.frequence_premium || 1;
    return joursDepuis >= (7 / foisParSemaine);
  }
  return false;
}

exports.handler = async function(event, context) {
  const { data: users } = await supabase.from('abonnements').select('*');
  const veille20 = await getVeilleEmergente();

  for (const user of users) {
    if (!doitOnEnvoyer(user)) continue;

    const contenu = `Bonjour,\n\nVoici votre rapport B-money du jour :\n\n- Vos intérêts (80%) : ${user.centres_interets}\n- Veille émergente (20%) : ${veille20[0].titre}\n\nÀ demain 8h.\n\nL'équipe B-money`;

    await transporter.sendMail({
      from: `"B-money" <${process.env.ZOHO_USER}>`,
      to: user.email,
      subject: `Votre rapport B-money du jour`,
      text: contenu,
    });

    await supabase.from('abonnements').update({ derniere_envoi: new Date().toISOString() }).eq('id', user.id);
  }
  return { statusCode: 200, body: "OK" };
};

exports.config = { schedule: "0 8 * * *" };
