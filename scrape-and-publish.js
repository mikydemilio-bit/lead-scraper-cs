// Automazione completa: scraping Apify per gruppo -> filtro keyword -> dedup contro
// lo storico -> aggiorna il file pubblico anonimizzato -> commit + push su GitHub.
// Pensato per essere lanciato da Task Scheduler ogni 10 giorni, senza intervento umano.
// Uso: node --env-file=.env scrape-and-publish.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
if (!APIFY_TOKEN) throw new Error('APIFY_API_TOKEN mancante in .env');

const HISTORY_FILE = path.join(__dirname, 'leads-history.json'); // privato, gitignored
const PUBLIC_FILE = path.join(__dirname, 'docs', 'leads-public.json'); // pubblico, anonimizzato

const GROUPS = [
  { url: 'https://www.facebook.com/groups/socialmediamanagercercasi', label: 'Social Media Manager Cercasi' },
  { url: 'https://www.facebook.com/groups/757319187715411', label: 'Gruppo 2' },
  { url: 'https://www.facebook.com/groups/938715264834960/', label: 'Gruppo 3' },
  { url: 'https://www.facebook.com/groups/296669701653491/', label: 'Gruppo 4' },
  { url: 'https://www.facebook.com/groups/WebSocialMediaItaly/', label: 'Web Social Media Italy' },
  { url: 'https://www.facebook.com/groups/SocialMediaDigitalMarketingItalia/', label: 'Social Media Digital Marketing Italia' },
  { url: 'https://www.facebook.com/groups/889148605325724/', label: 'Gruppo 7' },
  { url: 'https://www.facebook.com/groups/363711387628868/', label: 'Gruppo 8' },
  { url: 'https://www.facebook.com/groups/680871813080420/', label: 'Gruppo 9' },
  { url: 'https://www.facebook.com/groups/1960974571497940/', label: 'Gruppo 10' },
];

const COOKIES = [
  { name: 'c_user', value: process.env.FB_COOKIE_C_USER, domain: '.facebook.com' },
  { name: 'xs', value: process.env.FB_COOKIE_XS, domain: '.facebook.com' },
  { name: 'fr', value: process.env.FB_COOKIE_FR, domain: '.facebook.com' },
  { name: 'datr', value: process.env.FB_COOKIE_DATR, domain: '.facebook.com' },
].filter(c => c.value);

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

function normalizePostUrl(url) {
  return (url || '').replace(/\/\/posts\//, '/posts/');
}

function matchesCriteria(text) {
  const t = (text || '').toLowerCase();
  const hasMateria = KEYWORDS_MATERIA.some(k => t.includes(k));
  const hasRichiesta = KEYWORDS_RICHIESTA.some(k => t.includes(k));
  const hasEsclusione = KEYWORDS_ESCLUSIONE.some(k => t.includes(k));
  return hasMateria && hasRichiesta && !hasEsclusione;
}

async function apiFetch(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Apify API error ${res.status}: ${body}`);
  }
  return res.json();
}

async function runActorForGroup(groupUrl) {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const input = {
    startUrls: [{ url: groupUrl }],
    maxPosts: 30, // per singolo gruppo: il campo si applica all'intera run, quindi una run per gruppo
    onlyPostsNewerThan: fourteenDaysAgo,
    includeComments: false,
    includeMedia: false,
    includeGroupInfo: false,
    cookies: COOKIES,
  };

  const startData = await apiFetch(
    `https://api.apify.com/v2/acts/whoareyouanas~facebook-group-scraper/runs?token=${APIFY_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }
  );

  const runId = startData.data.id;
  const maxWaitMs = 5 * 60 * 1000;
  const pollIntervalMs = 5000;
  const startTime = Date.now();
  let status = startData.data.status;
  let datasetId = startData.data.defaultDatasetId;

  while (!['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
    if (Date.now() - startTime > maxWaitMs) {
      throw new Error('Timeout: la run Apify non è terminata entro 5 minuti');
    }
    await new Promise(r => setTimeout(r, pollIntervalMs));
    const statusData = await apiFetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
    status = statusData.data.status;
    datasetId = statusData.data.defaultDatasetId;
  }

  if (status !== 'SUCCEEDED') {
    throw new Error(`Run terminata con stato ${status}`);
  }

  return apiFetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&format=json`);
}

function loadHistory() {
  if (!fs.existsSync(HISTORY_FILE)) return [];
  return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
}

function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
}

function savePublicData(history) {
  const publicData = history
    .map(h => ({ postUrl: h.postUrl, groupLabel: h.groupLabel, firstSeenAt: h.firstSeenAt }))
    .sort((a, b) => new Date(b.firstSeenAt) - new Date(a.firstSeenAt));
  fs.mkdirSync(path.dirname(PUBLIC_FILE), { recursive: true });
  fs.writeFileSync(PUBLIC_FILE, JSON.stringify(publicData, null, 2), 'utf-8');
}

function publishToGitHub() {
  const cwd = __dirname;
  const status = execSync('git status --porcelain', { cwd }).toString();
  if (!status.trim()) {
    console.log('Nessuna modifica da pubblicare.');
    return;
  }
  execSync('git add docs/leads-public.json', { cwd });
  execSync(`git commit -m "Aggiorna lead (${new Date().toISOString().slice(0, 10)})"`, { cwd });
  execSync('git push', { cwd });
  console.log('Pubblicato su GitHub Pages.');
}

(async () => {
  const history = loadHistory();
  const seenUrls = new Set(history.map(h => h.postUrl));

  const errors = [];
  let newCount = 0;

  for (const g of GROUPS) {
    console.log(`--- Gruppo: ${g.label} ---`);
    try {
      const posts = await runActorForGroup(g.url);
      const matched = posts.filter(p => matchesCriteria(p.text));
      let newInGroup = 0;
      for (const p of matched) {
        const postUrl = normalizePostUrl(p.postUrl);
        if (seenUrls.has(postUrl)) continue; // già visto in un run precedente
        seenUrls.add(postUrl);
        history.push({
          postUrl,
          groupLabel: g.label,
          author: p.authorName || 'N/D',
          date: p.formattedDate || p.timestamp || 'N/D',
          snippet: (p.text || '').slice(0, 200).replace(/\s+/g, ' '),
          firstSeenAt: new Date().toISOString(),
        });
        newInGroup++;
      }
      newCount += newInGroup;
      console.log(`  Post estratti: ${posts.length}, match: ${matched.length}, nuovi: ${newInGroup}`);
    } catch (err) {
      console.error(`  Errore: ${err.message}`);
      errors.push({ group: g.label, url: g.url, error: err.message });
    }
  }

  saveHistory(history);
  savePublicData(history);
  publishToGitHub();

  console.log(`\nLead nuovi in questo run: ${newCount}`);
  console.log(`Lead totali nello storico: ${history.length}`);
  if (errors.length) {
    console.log(`Gruppi con errori: ${errors.map(e => e.group).join(', ')}`);
  }
})().catch(err => {
  console.error('Errore fatale:', err.message);
  process.exit(1);
});
