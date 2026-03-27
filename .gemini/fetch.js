const cheerio = require('cheerio');
fetch('http://localhost:3000/oferta/test').then(async r => {
  const html = await r.text();
  const $ = cheerio.load(html);
  
  // Find Next.js error overlay text
  const overlay = $('#nextjs__container_errors_label').parent().text() || $('body').text().substring(0, 1000);
  console.log("STATUS:", r.status);
  console.log("ERROR OVERLAY:", overlay);
}).catch(console.error);
