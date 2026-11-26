const https = require('https');

https.get('https://abh2026top10vote.org/assets/index-art20261117-d2e5ba096549.js', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('JS LENGTH:', data.length);
    const apiMatch = data.match(/https?:\/\/[^\s"'<>]+/g) || [];
    const domains = new Set();
    for (const url of apiMatch) {
      try { domains.add(new URL(url).origin); } catch(_) {}
    }
    console.log('API ORIGINS:', Array.from(domains));
    console.log('HAS TURNSTILE:', data.includes('turnstile'));
    console.log('HAS CLOUDFLARE:', data.includes('challenges.cloudflare.com') || data.includes('cloudflare'));
    
    // Search for keywords
    for (const kw of ['turnstile', 'challenge', 'captcha', 'recaptcha', 'cf-', 'cloudflare']) {
      let idx = 0;
      while ((idx = data.indexOf(kw, idx)) !== -1) {
        console.log(`FOUND ${kw}:`, data.slice(Math.max(0, idx - 80), idx + 150));
        idx += kw.length + 50;
        if (idx > 1000000) break;
      }
    }
  });
}).on('error', err => console.error(err));
