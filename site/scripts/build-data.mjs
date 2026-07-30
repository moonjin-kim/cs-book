import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import yaml from 'js-yaml';
import { glob } from 'glob';
import { normalizeWikiDoc } from './wiki-path.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.resolve(__dirname, '../public/data');

fs.rmSync(OUT_DIR, { recursive: true, force: true });

function readYaml(filePath) {
  return yaml.load(fs.readFileSync(filePath, 'utf-8'));
}

function extractTitle(mdContent) {
  const match = mdContent.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : '';
}

// ontology
const index = readYaml(path.join(ROOT, 'ontology/index.yaml'));

const domains = (index.domains ?? []).map((d) => {
  const aboxPath = path.join(ROOT, 'ontology', d.file);
  const abox = fs.existsSync(aboxPath) ? readYaml(aboxPath) : {};
  return {
    id: d.id,
    name: abox.domain?.name ?? d.id,
    path: d.path,
    summary: d.summary,
    repos: d.repos ?? [],
    infra: d.infra ?? [],
    wikiRoot: abox.domain?.wiki_root ?? '',
    entities: (abox.entities ?? []).map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      summary: typeof e.summary === 'string' ? e.summary.trim() : '',
      ...(e.wiki_doc && { wikiDoc: normalizeWikiDoc(e.wiki_doc) }),
      ...(e.repo && { repo: e.repo }),
      ...(e.package && { package: e.package }),
      ...(e.status && { status: e.status }),
    })),
    relations: (abox.relations ?? []).map((r) => ({
      from: r.from,
      to: r.to,
      type: r.type,
      ...(r.note && { note: typeof r.note === 'string' ? r.note.trim() : '' }),
    })),
  };
});

const infraPath = path.join(ROOT, 'ontology/abox/infra.yaml');
const infraYaml = fs.existsSync(infraPath) ? readYaml(infraPath) : {};
const sharedInfra = (infraYaml?.entities ?? []).map((e) => ({
  id: e.id,
  name: e.name,
  type: e.type,
  summary: typeof e.summary === 'string' ? e.summary.trim() : '',
}));

const crossPath = path.join(ROOT, 'ontology/abox/cross-domain.yaml');
const crossYaml = fs.existsSync(crossPath) ? readYaml(crossPath) : {};
const crossDomain = (crossYaml?.relations ?? []).map((r) => ({
  from: r.from,
  to: r.to,
  type: r.type,
  ...(r.note && { note: typeof r.note === 'string' ? r.note.trim() : '' }),
}));

// Git remote → repoBaseUrl
let repoBaseUrl = '';
try {
  const remote = execSync('git remote get-url origin', { cwd: ROOT, encoding: 'utf-8' }).trim();
  const match = remote.match(/^https?:\/\/([^/]+)\/([^/]+)/);
  if (match) repoBaseUrl = `https://${match[1]}/${match[2]}`;
} catch {}

const ontologyData = { domains, sharedInfra, crossDomain, repoBaseUrl };

// wiki index
const wikiRoot = path.join(ROOT, 'wiki');
const allowedWikiDomains = new Set(domains.map((d) => d.id));
const rootWikiDocs = new Set(['README.md', 'glossary.md', 'study-roadmap.md']);
const allMdFiles = await glob('**/*.md', { cwd: wikiRoot });
const mdFiles = allMdFiles.filter((relPath) => {
  if (rootWikiDocs.has(relPath)) return true;
  const [domain] = relPath.split('/');
  return allowedWikiDomains.has(domain);
});

const wikiDocs = mdFiles.map((relPath) => {
  const content = fs.readFileSync(path.join(wikiRoot, relPath), 'utf-8');
  const parts = relPath.split('/');
  const domain = parts.length > 1 ? parts[0] : '';
  return {
    path: relPath,
    title: extractTitle(content),
    domain,
  };
});

const wikiIndex = { docs: wikiDocs };

// quiz: 각 도메인 노트의 `| 질문 | 답변 |` 표를 파싱해 퀴즈 데이터로 추출
function parseQuiz(md) {
  const lines = md.split('\n');
  const questions = [];
  let group = '';
  for (let i = 0; i < lines.length; i++) {
    const heading = lines[i].match(/^###\s+(.+?)\s*$/);
    if (heading) {
      group = heading[1].trim();
      continue;
    }
    const isQuizHeader = /^\s*\|\s*질문\s*\|/.test(lines[i]);
    const isSeparator = i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1]);
    if (isQuizHeader && isSeparator) {
      let j = i + 2;
      while (j < lines.length && /^\s*\|/.test(lines[j])) {
        const cells = lines[j].split('|').map((c) => c.trim());
        const q = cells[1];
        const a = cells.slice(2, cells.length - 1).join(' | ').trim();
        if (q && a) questions.push({ q, a, group });
        j++;
      }
      i = j - 1;
    }
  }
  return questions;
}

const quizDomains = domains
  .map((d) => {
    const notePath = path.join(wikiRoot, d.id, 'README.md');
    if (!fs.existsSync(notePath)) return null;
    const questions = parseQuiz(fs.readFileSync(notePath, 'utf-8'));
    return { id: d.id, name: d.name, count: questions.length, questions };
  })
  .filter((d) => d && d.count > 0);

const quizData = { domains: quizDomains };

// wiki MD 복사
const wikiOutDir = path.join(OUT_DIR, 'wiki');
for (const relPath of mdFiles) {
  const src = path.join(wikiRoot, relPath);
  const dest = path.join(wikiOutDir, relPath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

// JSON 출력
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(
  path.join(OUT_DIR, 'ontology.json'),
  JSON.stringify(ontologyData, null, 2),
);
fs.writeFileSync(
  path.join(OUT_DIR, 'wiki-index.json'),
  JSON.stringify(wikiIndex, null, 2),
);
fs.writeFileSync(
  path.join(OUT_DIR, 'quiz.json'),
  JSON.stringify(quizData, null, 2),
);

const quizTotal = quizDomains.reduce((sum, d) => sum + d.count, 0);
console.log(`ontology.json: ${domains.length} domains, ${sharedInfra.length} infra`);
console.log(`wiki-index.json: ${wikiDocs.length} docs`);
console.log(`quiz.json: ${quizDomains.length} domains, ${quizTotal} questions`);
console.log(`wiki files copied to public/data/wiki/`);
