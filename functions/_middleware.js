// Sisi's Run / Pitch It To Me Straight — hostname middleware
//
// Redirects visits to the production *.pages.dev hostname over to the
// real domain (same path and query), so the site is only ever browsed
// at pitchittomestraight.com.
//
// Preview deployment URLs (e.g. 61a09550.pitch-it-to-me-straight.pages.dev)
// are intentionally left untouched so they remain useful for debugging.

const PROD_PAGES_HOST = 'pitch-it-to-me-straight.pages.dev';
const CANONICAL_ORIGIN = 'https://pitchittomestraight.com';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname === PROD_PAGES_HOST) {
    return Response.redirect(CANONICAL_ORIGIN + url.pathname + url.search, 301);
  }
  return context.next();
}
