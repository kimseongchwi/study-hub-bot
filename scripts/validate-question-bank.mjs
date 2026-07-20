import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src/question-bank");
const files = walk(root).filter(
  (file) => file.endsWith(".ts") && !file.endsWith("types.ts") && !file.endsWith("index.ts")
);
const required = ["id", "kind", "topic", "difficulty", "tags", "prompt", "answer", "hint", "explanation", "confusion"];
const validKinds = new Set(["code", "sql", "concept", "choice"]);
const validDifficulties = new Set(["기초", "실전", "심화"]);
const ids = new Map();
const errors = [];
const certificationCounts = new Map();
let count = 0;

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const blocks = extractQuestionBlocks(source);

  for (const block of blocks) {
    count += 1;
    const certification = path.relative(root, file).split(path.sep)[0];
    certificationCounts.set(certification, (certificationCounts.get(certification) ?? 0) + 1);
    const line = source.slice(0, block.start).split("\n").length;
    const display = `${path.relative(process.cwd(), file)}:${line}`;
    const values = new Map();

    for (const key of required) {
      const pattern = new RegExp(`^\\s{4}${key}:\\s*([^\\n]+)`, "m");
      const match = block.text.match(pattern);
      if (!match) errors.push(`${display} 필수 필드 누락: ${key}`);
      else values.set(key, match[1].trim());
    }

    const id = unquote(values.get("id"));
    if (!id) {
      errors.push(`${display} id가 비어 있습니다.`);
    } else if (ids.has(id)) {
      errors.push(`${display} 중복 id: ${id} (처음: ${ids.get(id)})`);
    } else {
      ids.set(id, display);
    }

    const kind = unquote(values.get("kind"));
    const difficulty = unquote(values.get("difficulty"));
    if (kind && !validKinds.has(kind)) errors.push(`${display} 잘못된 kind: ${kind}`);
    if (difficulty && !validDifficulties.has(difficulty)) errors.push(`${display} 잘못된 difficulty: ${difficulty}`);

    for (const key of ["topic", "answer", "hint", "explanation", "confusion"]) {
      const raw = values.get(key);
      if (raw && /^(["'`])\s*\1[,]?$/.test(raw)) errors.push(`${display} ${key}가 비어 있습니다.`);
    }

    if (kind === "choice" && !/^\s{4}choices:\s*\[[^\]]*,[^\]]*\]/m.test(block.text)) {
      errors.push(`${display} 보기형 문제에는 choices가 2개 이상 필요합니다.`);
    }
  }
}

if (count === 0) errors.push("검사할 문제를 찾지 못했습니다.");
if (certificationCounts.get("정보처리기사") !== 171) {
  errors.push(`정보처리기사 문제 수가 171개가 아닙니다: ${certificationCounts.get("정보처리기사") ?? 0}개`);
}
if (certificationCounts.get("SQLD") !== 100) {
  errors.push(`SQLD 문제 수가 100개가 아닙니다: ${certificationCounts.get("SQLD") ?? 0}개`);
}

if (errors.length > 0) {
  console.error(`문제은행 검증 실패 (${errors.length}건)`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `문제은행 검증 완료: ${count}문제 (정보처리기사 ${certificationCounts.get("정보처리기사")}개, SQLD ${certificationCounts.get("SQLD")}개), 중복 ID 없음, 필수 필드 정상`
);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function extractQuestionBlocks(source) {
  const matches = [...source.matchAll(/^  \{\n/gm)];
  return matches.flatMap((match) => {
    const start = match.index;
    const endMatch = /^  \},?$/gm;
    endMatch.lastIndex = start + match[0].length;
    const end = endMatch.exec(source);
    return end ? [{ start, text: source.slice(start, end.index + end[0].length) }] : [];
  });
}

function unquote(value) {
  if (!value) return null;
  const match = value.match(/^["'`](.*?)["'`],?$/);
  return match ? match[1] : null;
}
