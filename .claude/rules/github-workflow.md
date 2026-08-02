# Regola: workflow Git e GitHub

- Prima di ogni `git add`/`git commit`, verifica che nessun file sensibile
  (`.env`, chiavi, token, credenziali) sia incluso: controlla `git status` e,
  in caso di dubbio, `git status --ignored`.
- Messaggi di commit brevi, in italiano o inglese in modo coerente con il resto
  del progetto, che spiegano il "cosa" e il "perché", non solo il "cosa"
  (es. `fix: gestisce il caso di risposta vuota dall'API` invece di `fix bug`).
- Non fare mai push diretto su `main`/`master` per modifiche non banali: crea un
  branch dedicato (es. `feature/nome-funzionalita`) e apri una Pull Request,
  così altri collaboratori possono rivedere le modifiche prima che vengano unite.
- Non eseguire mai autonomamente azioni irreversibili su GitHub (push forzato,
  cancellazione di branch o repository, modifica dei permessi dei collaboratori):
  queste azioni vanno sempre confermate esplicitamente dall'utente.
