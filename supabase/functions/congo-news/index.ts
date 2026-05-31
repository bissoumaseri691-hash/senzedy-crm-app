/**
 * Senzedy — Edge Function: congo-news
 * Fetch actualités congolaises en direct via RSS (Google News + Radio Okapi)
 * Pas de clé API nécessaire — 100% gratuit
 *
 * Déploiement : supabase functions deploy congo-news
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sources RSS gratuites — axées immobilier
const RSS_FEEDS = [
  {
    url: "https://news.google.com/rss/search?q=immobilier+Kinshasa+RDC&hl=fr&gl=CD&ceid=CD:fr",
    source: "Google News",
  },
  {
    url: "https://news.google.com/rss/search?q=immobilier+Congo+construction+logement&hl=fr&gl=CD&ceid=CD:fr",
    source: "Google News",
  },
  {
    url: "https://news.google.com/rss/search?q=investissement+immobilier+Afrique+RDC&hl=fr&gl=CD&ceid=CD:fr",
    source: "Google News",
  },
  {
    url: "https://news.google.com/rss/search?q=terrain+construction+Kinshasa+urbanisme&hl=fr&gl=CD&ceid=CD:fr",
    source: "Google News",
  },
];

interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  image?: string;
}

// Parse XML RSS simplement (pas de lib externe)
function parseRSSItems(xml: string, sourceName: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const title = extractTag(itemXml, "title");
    const link = extractTag(itemXml, "link");
    const description = extractTag(itemXml, "description");
    const pubDate = extractTag(itemXml, "pubDate");
    const mediaUrl = extractMediaUrl(itemXml);
    const realSource = extractTag(itemXml, "source") || sourceName;

    if (title && link) {
      const cleanDesc = cleanHtml(description || "");
      // Skip if description is just a link or empty after cleaning
      const finalDesc = cleanDesc.startsWith("http") || cleanDesc.length < 10 ? "" : cleanDesc.slice(0, 200);
      items.push({
        title: cleanHtml(title),
        link,
        description: finalDesc,
        pubDate: pubDate || new Date().toISOString(),
        source: cleanHtml(realSource),
        image: mediaUrl,
      });
    }
  }

  return items;
}

function extractTag(xml: string, tag: string): string {
  // Handle CDATA
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, "i");
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  // Handle regular content
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : "";
}

function extractMediaUrl(xml: string): string | undefined {
  // media:content url
  const mediaMatch = xml.match(/url="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i);
  if (mediaMatch) return mediaMatch[1];

  // enclosure url
  const encMatch = xml.match(/<enclosure[^>]+url="(https?:\/\/[^"]+)"/i);
  if (encMatch) return encMatch[1];

  // img in description
  const imgMatch = xml.match(/src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i);
  if (imgMatch) return imgMatch[1];

  return undefined;
}

function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // Fetch all RSS feeds in parallel
    const feedPromises = RSS_FEEDS.map(async (feed) => {
      try {
        const res = await fetch(feed.url, {
          headers: { "User-Agent": "Senzedy-News-Bot/1.0" },
        });
        if (!res.ok) return [];
        const xml = await res.text();
        return parseRSSItems(xml, feed.source);
      } catch {
        return [];
      }
    });

    const results = await Promise.all(feedPromises);
    const allItems = results.flat();

    // Deduplicate by title similarity
    const seen = new Set<string>();
    const unique = allItems.filter((item) => {
      const key = item.title.toLowerCase().slice(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by date (newest first)
    unique.sort((a, b) => {
      try {
        return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
      } catch {
        return 0;
      }
    });

    // Return top 20
    const news = unique.slice(0, 20);

    return new Response(JSON.stringify({ news, count: news.length }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    return new Response(JSON.stringify({ error: message, news: [] }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
