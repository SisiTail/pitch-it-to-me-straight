// Sisi's Run — global leaderboard API (Cloudflare Pages Function)
// Route: /api/score
//   GET  -> returns the Top 25 as a JSON array
//   POST -> {name, score} adds an entry, returns {list, rank}
//
// Requires a KV namespace bound to this Pages project with the
// variable name LEADERBOARD (Settings -> Bindings -> KV namespace).

const KEY = 'top';
const MAX_ENTRIES = 25;
const MAX_SCORE = 5000000;

export async function onRequestGet({ env }) {
  const list = await readBoard(env);
  return json(list);
}

export async function onRequestPost({ request, env }) {
  if (!env.LEADERBOARD) return json({ error: 'Leaderboard not configured yet' }, 500);

  let body;
  try { body = await request.json(); }
  catch (e) { return json({ error: 'Bad request' }, 400); }

  const name = cleanName(body && body.name);
  const score = cleanScore(body && body.score);
  if (!name || score === null) return json({ error: 'Invalid name or score' }, 400);

  const list = await readBoard(env);
  const entry = { name, score, t: Date.now() };
  list.push(entry);
  list.sort((a, b) => b.score - a.score || a.t - b.t);
  const top = list.slice(0, MAX_ENTRIES);

  await env.LEADERBOARD.put(KEY, JSON.stringify(top));

  const rank = top.indexOf(entry) + 1; // 0 means it didn't crack the Top 25
  return json({ list: top, rank });
}

async function readBoard(env) {
  if (!env.LEADERBOARD) return [];
  try {
    const raw = await env.LEADERBOARD.get(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr.filter(e =>
      e && typeof e.name === 'string' && typeof e.score === 'number'
    ).slice(0, MAX_ENTRIES);
  } catch (e) {
    return [];
  }
}

function cleanName(n) {
  if (typeof n !== 'string') return null;
  n = n.replace(/[^\w \-\.]/g, '').trim().slice(0, 12);
  return n.length ? n : null;
}

function cleanScore(s) {
  s = Number(s);
  if (!Number.isFinite(s)) return null;
  s = Math.floor(s);
  if (s < 0 || s > MAX_SCORE) return null;
  return s;
}

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}
