#!/usr/bin/env node
// Vérifie que chaque thème de fiche prestataire (lib/themes.ts) respecte le
// contraste WCAG AA (4.5:1 minimum pour du texte normal) sur chaque paire
// fond/texte réellement utilisée. Les presets sont validés une fois pour
// toutes ici : aucune vérification en direct n'est nécessaire dans
// l'application pour un thème de cette liste (seul le mode personnalisé,
// à venir en PR2, en aura besoin).
//
// Usage : node scripts/check-theme-contrast.mjs
// Sort avec le code 1 (et un message clair) si un thème échoue.

import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);

// lib/themes.ts est du TypeScript : on relit son texte et on extrait le
// tableau THEMES sans dépendre d'un compilateur (pas de ts-node ici), pour
// que ce script tourne avec Node seul, sans dépendance supplémentaire.
const fs = await import("node:fs/promises");
const src = await fs.readFile(
  path.join(process.cwd(), "lib", "themes.ts"),
  "utf8"
);

function extractThemes(source) {
  const start = source.indexOf("export const THEMES");
  const arrayStart = source.indexOf("[", start);
  let depth = 0;
  let end = -1;
  for (let i = arrayStart; i < source.length; i++) {
    if (source[i] === "[") depth++;
    if (source[i] === "]") {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  const arrayLiteral = source.slice(arrayStart, end);
  // Pas de JSON.parse (commentaires + clés non quotées) : on évalue le
  // littéral JS directement, dans une fonction isolée, sans accès au
  // scope du module.
  // eslint-disable-next-line no-new-func
  return new Function(`"use strict"; return (${arrayLiteral});`)();
}

const THEMES = extractThemes(src);

function lin(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function ratio(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

const MIN_AA = 4.5;

let failed = false;

for (const theme of THEMES) {
  const c = theme.colors;
  const pairs = [
    ["ground/text", c.ground, c.text],
    ["ground/heading", c.ground, c.heading],
    ["ground/muted", c.ground, c.muted],
    ["surface/surfaceText", c.surface, c.surfaceText],
    ["buttonBg/buttonText", c.buttonBg, c.buttonText],
  ];
  for (const [label, bg, fg] of pairs) {
    const r = ratio(bg, fg);
    const ok = r >= MIN_AA;
    if (!ok) failed = true;
    console.log(
      `${ok ? "OK  " : "FAIL"} ${theme.id.padEnd(16)} ${label.padEnd(20)} ${bg} / ${fg} -> ${r.toFixed(2)}:1`
    );
  }
}

if (failed) {
  console.error(
    "\nAu moins un thème échoue au contraste AA (4.5:1 minimum). Corrige lib/themes.ts avant de livrer."
  );
  process.exit(1);
} else {
  console.log("\nTous les thèmes passent le contraste AA (4.5:1 minimum).");
}
