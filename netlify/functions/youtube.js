exports.handler = async (event) => {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  
  const query = event.queryStringParameters.q || 'B-MONEY business';
  
  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${query}&key=${API_KEY}`);
    const data = await res.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
