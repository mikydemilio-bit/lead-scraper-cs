# Regola: non committare mai i segreti

- Non includere mai il contenuto del file `.env` nei commit.
- Verifica sempre che `.env` sia presente ed elencato nel `.gitignore` prima di eseguire `git add`.
- Se devi mostrare un esempio di variabili d'ambiente, crea/aggiorna un file `.env.example` con chiavi finte (senza valori reali), mai il `.env` vero.
- Se noti che `.env` risulta già tracciato da Git, segnalalo subito e proponi di rimuoverlo dal tracking (`git rm --cached .env`) prima di continuare.
