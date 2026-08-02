// Seed una tantum: rilegge i dataset delle run già pagate (nessun costo aggiuntivo) e
// inizializza leads-history.json + docs/leads-public.json, cosi' la pagina parte gia'
// popolata e il dedup futuro di scrape-and-publish.js funziona da subito.
// Uso: node --env-file=.env seed-history.js

const fs = require('fs');
const path = require('path');
const APIFY_TOKEN = process.env.APIFY_API_TOKEN;

const RUNS = [
  { runId: 'ZscnHbU2DQGI0o8u0', label: 'Social Media Manager Cercasi' },
  { runId: 'cruUI5UT5SP1ZcmvF', label: 'Gruppo 2' },
  { runId: 'CuBdO88pilj4feNrV', label: 'Gruppo 3' },
  { runId: 'xJjf4YSjvurVfDPvj', label: 'Gruppo 4' },
  { runId: 'h37jWWblcdz0slPgP', label: 'Social Media Digital Marketing Italia' },
  { runId: 'Uv7AleXXZkbRO6D5v', label: 'Gruppo 7' },
  { runId: 'ncErfcHqZDLbwQGYB', label: 'Gruppo 8' },
  { runId: '906HRqGKXCNsl3nWc', label: 'Gruppo 9' },
  { runId: 'PcB5az5ELRhNwB3ko', label: 'Gruppo 10' },
];

const KEYWORDS_MATERIA = [
  'social media manager', 'smm', 'social media', 'content creator', 'content creation',
  'videomaker', 'video editor', 'montaggio video', 'editing video', 'reel', 'reels',
  'copywriter', 'copy', 'grafica social', 'grafica per social', 'visual content',
  'meta ads', 'google ads', 'tiktok ads', 'facebook ads', 'instagram ads',
  'campagne ads', 'campagne advertising', 'campagne sponsorizzate', 'sponsorizzate',
  'gestione ads', 'gestione campagne', 'performance marketing',
  'community manager', 'gestione social', 'gestione profili social',
  'piano editoriale', 'calendario editoriale', 'strategia social',
  'automazioni ai', 'ai marketing', 'intelligenza artificiale marketing',
  'contenuti ai', 'immagini ai', 'video ai', 'testo generato ai',
  'digital marketing', 'comunicazione digitale', 'web agency', 'agenzia comunicazione',
  'agenzia marketing', 'brand identity', 'identità visiva',
];

const KEYWORDS_RICHIESTA = [
  'cerco', 'cerchiamo', 'sto cercando', 'stiamo cercando', 'siamo alla ricerca di',
  'ho bisogno', 'avrei bisogno', 'abbiamo bisogno', 'mi serve', 'ci serve',
  'qualcuno che', 'qualcuno disponibile', "chi puo' aiutarmi", 'chi può aiutarmi',
  'consigliate', 'raccomandatemi', 'consiglio',
  'alla ricerca di', 'siamo in cerca di', 'selezioniamo', 'stiamo selezionando',
  'cerco collaborazione', 'cerco freelance', 'cerco professionista',
  'cerco agenzia', 'partnership', 'subappalto', 'collaborazione esterna',
  'collaborazione con partita iva', 'collaborazione a progetto',
  'figura professionale', 'risorsa esterna', 'supporto esterno',
  'apertura candidature', 'candidature aperte', 'inviare candidatura',
  'recluta', 'recruta', 'stiamo reclutando',
];

const KEYWORDS_ESCLUSIONE = [
  'offro servizi', 'sono disponibile per', 'sono disponibile a',
  'sono social media manager di', 'sono content creator', 'sono videomaker',
  'sono freelance e offro', 'do lezioni', 'cerco clienti', 'cerco lavoro come',
  'metto a disposizione', 'mi presento e offro', 'mi chiamo e sono',
  'offerta di lavoro dipendente', 'contratto a tempo determinato',
  'contratto a tempo indeterminato', 'assunzione', 'contratto dipendente',
  'stage', 'tirocinio', 'praticantato', 'percorso formativo retribuito',
  'presenza in ufficio obbligatoria', 'presenza obbligatoria', 'lavoro in sede',
  'presenza fisica', 'devi essere in zona', 'solo milano', 'solo torino',
  'solo napoli', 'solo palermo', 'solo bologna', 'solo firenze',
  'vendo corso', 'masterclass', 'formazione', 'corso online', 'coaching',
  'network marketing', 'mlm', 'guadagna da casa', 'lavora con noi da casa',
  'provvigioni', 'sistema di affiliazione', 'ci penso io',
  'disponibile per collaborazioni', 'mi presento, sono', 'mi presento sono',
  'mi presento :', 'mi presento:',
  'sono un social media manager', 'sono una social media manager',
  'sono alla ricerca di', 'cercando i miei primi progetti',
  'in cerca di nuovi progetti', 'percentuale sui risultati', 'prezzi ottimi',
];

function dedupeByTextPrefix(posts) {
  const seen = new Set();
  const result = [];
  for (const p of posts) {
    const key = (p.text || '').trim().slice(0, 70);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(p);
  }
  return result;
}

function matchesCriteria(text) {
  const t = (text || '').toLowerCase();
  const hasMateria = KEYWORDS_MATERIA.some(k => t.includes(k));
  const hasRichiesta = KEYWORDS_RICHIESTA.some(k => t.includes(k));
  const hasEsclusione = KEYWORDS_ESCLUSIONE.some(k => t.includes(k));
  return hasMateria && hasRichiesta && !hasEsclusione;
}

async function apiFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Apify API error ${res.status}: ${await res.text()}`);
  return res.json();
}

(async () => {
  const allPosts = [];
  for (const r of RUNS) {
    const runData = await apiFetch(`https://api.apify.com/v2/actor-runs/${r.runId}?token=${APIFY_TOKEN}`);
    const datasetId = runData.data.defaultDatasetId;
    const items = await apiFetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&format=json`);
    allPosts.push(...items.map(p => ({ ...p, groupLabel: r.label })));
  }

  const matchedRaw = allPosts.filter(p => matchesCriteria(p.text));
  const matched = dedupeByTextPrefix(matchedRaw);

  const now = new Date().toISOString();
  const history = matched.map(p => ({
    postUrl: p.postUrl,
    groupLabel: p.groupLabel,
    author: p.authorName || 'N/D',
    date: p.formattedDate || p.timestamp || 'N/D',
    snippet: (p.text || '').slice(0, 200).replace(/\s+/g, ' '),
    firstSeenAt: now,
  }));

  fs.writeFileSync(path.join(__dirname, 'leads-history.json'), JSON.stringify(history, null, 2), 'utf-8');

  const publicData = history
    .map(h => ({ postUrl: h.postUrl, groupLabel: h.groupLabel, firstSeenAt: h.firstSeenAt }))
    .sort((a, b) => new Date(b.firstSeenAt) - new Date(a.firstSeenAt));
  fs.mkdirSync(path.join(__dirname, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'docs', 'leads-public.json'), JSON.stringify(publicData, null, 2), 'utf-8');

  console.log(`Seed completato: ${history.length} lead in leads-history.json e docs/leads-public.json`);
})().catch(err => {
  console.error('Errore:', err.message);
  process.exit(1);
});
