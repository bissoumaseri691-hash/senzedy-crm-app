/**
 * Post-build PWA : copie les assets PWA dans dist/ et injecte les balises
 * (manifeste, theme-color, apple-touch-icon, meta iOS) + enregistre le SW
 * dans le index.html généré par Expo. Lancé après `npx expo export`.
 */
import { readFileSync, writeFileSync, copyFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const SRC = "pwa-assets";
const DIST = "dist";

// 1) Copier les assets PWA (icônes, manifest, sw) à la racine de dist/
for (const f of readdirSync(SRC)) {
  copyFileSync(join(SRC, f), join(DIST, f));
}
console.log("[pwa] assets copiés dans dist/");

// 2) Injecter les balises PWA dans dist/index.html
const idx = join(DIST, "index.html");
if (!existsSync(idx)) {
  console.error("[pwa] dist/index.html introuvable — injection ignorée");
  process.exit(0);
}
let html = readFileSync(idx, "utf8");

const TAGS = `
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="theme-color" content="#0E0705" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Senzedy" />
    <script>
      if ("serviceWorker" in navigator) {
        window.addEventListener("load", function () {
          navigator.serviceWorker.register("/sw.js").catch(function () {});
        });
      }
    </script>
`;

if (html.includes('rel="manifest"')) {
  console.log("[pwa] balises déjà présentes");
} else {
  html = html.replace("</head>", TAGS + "  </head>");
  writeFileSync(idx, html);
  console.log("[pwa] balises PWA injectées dans index.html");
}
