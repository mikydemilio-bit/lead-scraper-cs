# CLAUDE.md

Questo file fornisce contesto e istruzioni a Claude Code quando lavora su questo progetto.
Va aggiornato nel tempo man mano che il progetto evolve.

## Panoramica del progetto

<!-- Descrivi qui in breve cosa fa il progetto, il suo scopo e il pubblico a cui è rivolto -->

## Stack tecnologico

<!-- Elenca linguaggi, framework, librerie principali -->

## Struttura del progetto

<!-- Descrivi le cartelle principali e la loro funzione -->

## Comandi utili

<!-- Es. comandi per installare dipendenze, avviare il progetto, eseguire i test -->

## Convenzioni di coding

<!-- Stile del codice, naming, pattern architetturali da seguire -->

## Gestione delle skill

Ogni volta che serve creare, modificare o migliorare una skill per questo progetto,
usa sempre la skill `skill-creator` (presente in `.claude/skills/skill-creator/`)
invece di scrivere una skill "a mano" o improvvisata. È lo strumento standard di
questo progetto per progettare, testare e ottimizzare le skill.

## Agenti disponibili (.claude/agents/)

Il progetto ha tre subagent installati fin dall'inizio:

- **qa** — verifica qualità, correttezza e copertura di test dopo ogni modifica al codice.
- **researcher** — raccoglie informazioni (interne al codice o esterne, via web) prima di agire.
- **product** — trasforma richieste vaghe in requisiti chiari prima che si inizi a sviluppare.

Usa questi agenti invece di improvvisare gli stessi compiti nella conversazione principale:
mantengono il contesto principale pulito e restituiscono solo il risultato finale.

## Git e GitHub

Il progetto è versionato con Git fin dall'inizio. Le regole di collaborazione
(branch, commit, Pull Request, cosa non va mai fatto in autonomia) sono in
`.claude/rules/github-workflow.md` — seguile sempre quando lavori con Git.

## Note aggiuntive

<!-- Qualsiasi altra informazione utile a Claude Code per lavorare bene su questo progetto -->
