const sitemapPath = /^\/sitemap-(?:id|en|ms|fr|es)(?:-\d{2})?\.xml$/;
const templatePrefix = /^---\r?\nlayout: null\r?\n---\r?\n\{%- assign configured_origin = site\.url \| append: site\.baseurl -%\}\{%- assign o = configured_origin \| default: site\.github\.url \| replace_first: 'http:\/\/', 'https:\/\/' -%\}/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const robots = url.pathname === '/robots.txt';
    if (!robots && url.pathname !== '/sitemap.xml' && !sitemapPath.test(url.pathname)) {
      return env.ASSETS.fetch(request);
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(null, {status: 405, headers: {Allow: 'GET, HEAD'}});
    }
    url.search = '';
    const asset = await env.ASSETS.fetch(new Request(url));
    if (!asset.ok) return asset;
    const source = await asset.text();
    if (!templatePrefix.test(source)) {
      return new Response(null, {status: 503, headers: {'Cache-Control': 'no-store'}});
    }
    const origin = url.origin.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const body = source.replace(templatePrefix, '').replaceAll('{{o}}', origin);
    return new Response(request.method === 'HEAD' ? null : body, {
      headers: {
        'Content-Type': robots ? 'text/plain; charset=utf-8' : 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
};
