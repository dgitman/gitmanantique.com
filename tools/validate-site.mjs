import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function collectHtml(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === ".git") return [];
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectHtml(absolute);
    return entry.name === "index.html" ? [absolute] : [];
  });
}

function count(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function routeFor(file) {
  const relative = path.relative(root, file);
  return relative === "index.html" ? "/" : `/${path.dirname(relative).replaceAll(path.sep, "/")}/`;
}

function localTarget(url) {
  const clean = url.split(/[?#]/)[0];
  if (!clean.startsWith("/")) return null;
  if (clean.endsWith("/")) return path.join(root, clean, "index.html");
  return path.join(root, clean);
}

const errors = [];
const pages = collectHtml(root);
const expectedRoutes = new Set(pages.map(routeFor));
const titles = new Map();
const descriptions = new Map();

for (const file of pages) {
  const html = fs.readFileSync(file, "utf8");
  const route = routeFor(file);
  const label = path.relative(root, file);
  const requiredCounts = [
    [/<title>[^<]+<\/title>/gi, 1, "title"],
    [/<meta\s+name="description"\s+content="[^"]+">/gi, 1, "meta description"],
    [/<link\s+rel="canonical"\s+href="[^"]+">/gi, 1, "canonical URL"],
    [/<h1(?:\s[^>]*)?>[\s\S]*?<\/h1>/gi, 1, "H1"],
    [/<meta\s+property="og:title"\s+content="[^"]+">/gi, 1, "Open Graph title"],
    [/<meta\s+property="og:description"\s+content="[^"]+">/gi, 1, "Open Graph description"],
    [/<meta\s+property="og:url"\s+content="[^"]+">/gi, 1, "Open Graph URL"],
    [/<meta\s+property="og:image"\s+content="[^"]+">/gi, 1, "Open Graph image"],
    [/<meta\s+name="twitter:card"\s+content="summary_large_image">/gi, 1, "Twitter card"],
    [/G-J6LRDMYRNL/g, 2, "Google Analytics measurement ID"]
  ];

  for (const [pattern, wanted, name] of requiredCounts) {
    const found = count(html, pattern);
    if (found !== wanted) errors.push(`${label}: expected ${wanted} ${name}, found ${found}`);
  }

  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
  const description = html.match(/<meta\s+name="description"\s+content="([^"]+)">/i)?.[1];
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)">/i)?.[1];
  const expectedCanonical = `https://gitmanantique.com${route}`;
  if (canonical !== expectedCanonical) errors.push(`${label}: canonical is ${canonical}, expected ${expectedCanonical}`);

  if (title) {
    if (titles.has(title)) errors.push(`${label}: duplicate title also used by ${titles.get(title)}`);
    titles.set(title, label);
  }
  if (description) {
    if (descriptions.has(description)) errors.push(`${label}: duplicate description also used by ${descriptions.get(description)}`);
    descriptions.set(description, label);
  }

  for (const match of html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(match[1]); }
    catch (error) { errors.push(`${label}: invalid JSON-LD (${error.message})`); }
  }

  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/gi)) {
    const url = match[1];
    if (/^(?:https?:|mailto:|tel:|#)/.test(url)) continue;
    const target = localTarget(url);
    if (target && !fs.existsSync(target)) errors.push(`${label}: missing local target ${url}`);
  }
}

const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const sitemapRoutes = new Set(
  [...sitemap.matchAll(/<loc>https:\/\/gitmanantique\.com([^<]*)<\/loc>/g)].map((match) => match[1] || "/")
);
for (const route of expectedRoutes) {
  if (!sitemapRoutes.has(route)) errors.push(`sitemap.xml: missing ${route}`);
}
for (const route of sitemapRoutes) {
  if (!expectedRoutes.has(route)) errors.push(`sitemap.xml: unknown route ${route}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${pages.length} HTML pages, ${sitemapRoutes.size} sitemap URLs, metadata, JSON-LD, and local links.`);
