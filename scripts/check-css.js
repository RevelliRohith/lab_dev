async function check() {
  const html = await (await fetch('http://localhost:3005/dashboard')).text();
  const cssMatches = Array.from(html.matchAll(/href="(\/_next\/static\/css\/[^"]+)"/g));
  console.log('CSS links found:', cssMatches.map(m => m[1]));
  for (const m of cssMatches) {
    const res = await fetch('http://localhost:3005' + m[1]);
    console.log(m[1], 'status:', res.status, res.headers.get('content-type'));
  }
}
check();
