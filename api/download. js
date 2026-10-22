const PLAT = {
  youtube: ['ytmp3gg', 'ytmp3'],
  instagram: ['indown', 'snapsave', 'direct'],
  pinterest: ['pindown', 'direct']
};
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
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const u = (req.query && req.query.url) || '';
  const p = which(u);
  if (!p) return res.status(400).json({ error: 'Platform tidak didukung' });
  let s;
  try { s = await load(); } catch (e) { return res.status(500).json({ error: 'scrapr gagal dimuat: ' + e.message }); }
  const errs = [];
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
