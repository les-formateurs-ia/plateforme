// Import d'un programme de formation (PDF ou Word) dans un dossier : Claude
// relève ses rubriques dans un JSON que le navigateur fusionne dans la fiche
// programme (mergeImportedProgramme). Mécanique commune (admin seul, envoi
// puis suivi) : _shared/claude-document-task.ts.
import { serveClaudeDocumentTask } from "../_shared/claude-document-task.ts";
import { PROGRAMME_IMPORT_PROMPT } from "./prompt.ts";

serveClaudeDocumentTask({
  name: "import-programme",
  systemPrompt: PROGRAMME_IMPORT_PROMPT,
  intro: (fileName) => `Programme à relever (fichier « ${fileName} ») :`,
});
