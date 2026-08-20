import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const CHECK_ONLY = process.argv.includes("--check");
const TEXT_EXTENSIONS = new Set([".html", ".md"]);
const SKIP_DIRECTORIES = new Set([".git", "assets"]);

const replacements = [
  [
    "Avenida Pires do Rio, 3369 - Jardim Norma - São Paulo/SP",
    "Avenida Pires do Rio, 3369, salas 4 e 5 - Jardim Norma - São Paulo/SP"
  ],
  [
    "Avenida Pires do Rio, 3369 - Jardim Norma",
    "Avenida Pires do Rio, 3369, salas 4 e 5 - Jardim Norma"
  ],
  [
    "Avenida Pires do Rio, 3369 — Jardim Norma",
    "Avenida Pires do Rio, 3369, salas 4 e 5 — Jardim Norma"
  ],
  [
    "Avenida Pires do Rio, 3369, Jardim Norma",
    "Avenida Pires do Rio, 3369, salas 4 e 5, Jardim Norma"
  ],
  [
    "Avenida Pires do Rio, 3369, no Jardim Norma",
    "Avenida Pires do Rio, 3369, salas 4 e 5, no Jardim Norma"
  ],
  [
    "Avenida Pires do Rio, 3369, com atendimento",
    "Avenida Pires do Rio, 3369, salas 4 e 5, com atendimento"
  ],
  [
    "Avenida Pires do Rio, 3369, Itaquera",
    "Avenida Pires do Rio, 3369, salas 4 e 5 - Jardim Norma, Itaquera"
  ],
  [
    "Avenida Pires do Rio, 3369.",
    "Avenida Pires do Rio, 3369, salas 4 e 5 - Jardim Norma - São Paulo/SP."
  ],
  [
    "de segunda a sexta-feira, das 9h às 18h, e aos sábados conforme disponibilidade confirmada pelo WhatsApp.",
    "de segunda a sexta-feira, das 9h às 18h. Confirme a disponibilidade pelo WhatsApp."
  ],
  [
    "Atendimento de segunda a sexta, das 9h às 18h, e aos sábados mediante agendamento.",
    "Atendimento de segunda a sexta, das 9h às 18h. Confirme a disponibilidade pelo WhatsApp."
  ]
];

async function listTextFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && SKIP_DIRECTORIES.has(entry.name)) continue;
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listTextFiles(absolutePath)));
    } else if (TEXT_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(absolutePath);
    }
  }

  return files;
}

function normalize(source) {
  return replacements.reduce(
    (result, [legacy, canonical]) => result.replaceAll(legacy, canonical),
    source
  );
}

const changedFiles = [];
for (const file of await listTextFiles(ROOT)) {
  const source = await readFile(file, "utf8");
  const normalized = normalize(source);
  if (normalized === source) continue;

  changedFiles.push(path.relative(ROOT, file));
  if (!CHECK_ONLY) await writeFile(file, normalized, "utf8");
}

if (CHECK_ONLY && changedFiles.length) {
  throw new Error(
    `Informações locais fora do padrão em: ${changedFiles.join(", ")}. Execute node scripts/normalize-local-seo.mjs.`
  );
}

console.log(
  changedFiles.length
    ? `${CHECK_ONLY ? "Pendências encontradas" : "Arquivos normalizados"}: ${changedFiles.length}`
    : "As informações locais já estão padronizadas."
);
