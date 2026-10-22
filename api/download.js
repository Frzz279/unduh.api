const PLAT = {
  youtube: ['ytmp3gg', 'ytmp3'],
  instagram: ['indown', 'snapsave', 'direct'],
  pinterest: ['pindown', 'direct']
};
const FORMATS = ['144p', '240p', '360p', '480p', '720p', '1080p', 'audio'];
function which(u) {
  let h = '';
  try { h = new URL(u).hostname; } catch (e) { return null; }
  if (/youtu/.test(h)) return 'youtube';
  if (/instagram|instagr\.am/.test(h)) return 'instagram';
  if (/pinterest|pin\.it/.test(h)) return 'pinterest';
  return null;
}
function hasUrl(v) {
  if (typeof v === 'string') return /^https?:\/\//i.test(v);
  if (v && typeof v === 'object') return Object.values(v).some(hasUrl);
  return false;
}
let lib;
async function load() {
  if (lib) return lib;
  let m;
  try { m = require('@coflyn/scrapr'); } catch (e) { m = await import('@coflyn/scrapr'); }
  lib = m.youtube ? m : (m.default || m);
  return lib;
}
async function fastsaver(u, format) {
  const r = await fetch('https://api.fastsaver.io/v1/youtube/download', {
    method: 'POST',
    headers: {
      'X-Api-Key': process.env.FASTSAVER_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ url: u, format }),
    signal: AbortSignal.timeout(55000)
  });
  const t = await r.text();
  let j;
  try { j = JSON.parse(t); } catch (e) { j = { raw: t.slice(0, 300) }; }
  if (!r.ok) throw new Error(r.status + ' ' + JSON.stringify(j).slice(0, 300));
  return j;
}
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const q = req.query || {};
  const u = q.url || '';
  const p = which(u);
  if (!p) return res.status(400).json({ error: 'Platform tidak didukung' });
  const format = FORMATS.includes(q.format) ? q.format : '720p';
  const errs = [];
  if (p === 'youtube' && process.env.FASTSAVER_KEY) {
    try {
      const r = await fastsaver(u, format);
      if (hasUrl(r)) return res.status(200).json({ platform: p, scraper: 'fastsaver', result: r });
      errs.push('fastsaver: tidak ada link, balasan: ' + JSON.stringify(r).slice(0, 200));
    } catch (e) { errs.push('fastsaver: ' + e.message); }
  }
  let s;
  try { s = await load(); } catch (e) { return res.status(500).json({ error: 'scrapr gagal dimuat: ' + e.message, detail: errs }); }
  for (const fn of PLAT[p]) {
    try {
      const f = s[p] && s[p][fn];
      if (typeof f !== 'function') { errs.push(fn + ': fungsi tidak ditemukan'); continue; }
      const r = await f(u);
      if (!hasUrl(r)) { errs.push(fn + ': ' + ((r && r.message) || 'tidak ada link')); continue; }
      return res.status(200).json({ platform: p, scraper: fn, result: r });
    } catch (e) { errs.push(fn + ': ' + e.message); }
  }
  res.status(502).json({ error: 'Semua scraper gagal', detail: errs });
};
