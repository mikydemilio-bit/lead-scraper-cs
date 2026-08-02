# Regola: usare sempre Skill Creator per le nuove skill

- Ogni volta che nel progetto serve una nuova skill (una procedura riutilizzabile,
  automatizzabile, che Claude Code dovrà richiamare più volte), non scriverla a mano:
  interpella la skill `skill-creator` disponibile in `.claude/skills/skill-creator/`.
- Lo stesso vale quando bisogna modificare, migliorare o testare una skill già esistente
  nel progetto: passa sempre da `skill-creator`, così restano coerenti il formato,
  la qualità delle descrizioni (fondamentali per il triggering) e il processo di test.
- `skill-creator` deve essere installato all'inizio di ogni nuovo progetto Claude Code,
  come parte dello scaffold iniziale, non aggiunto solo quando serve.
