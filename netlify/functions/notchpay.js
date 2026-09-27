exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { amount, email, name, currency } = JSON.parse(event.body);

    // B-MONEY est international : on prend la devise envoyée par le site
    // Si pas de devise, on laisse NotchPay décider automatiquement
    const paymentData = {
      amount: amount,
      email: email,
      description: `Paiement B-MONEY pour ${name} - International`,
      callback: 'https://b-money.netlify.app/success'
    };

    // Si le client envoie USD, EUR, XAF, etc., on l'utilise
    // Sinon NotchPay gère automatiquement en mode international
    if (currency) {
      paymentData.currency = currency;
    }

    const response = await fetch('https://api.notchpay.co/payments', {
      method: 'POST',
      headers: {
        'Authorization': process.env.NOTCHPAY_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
