const fs = require('fs');
const path = require('path');

const BANK_DIR = path.join(__dirname, '..', 'bank');
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'lib');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'questions.json');

// Normalize answers like 'd' -> 4, or '1' -> 1
function normalizeAnswer(ans) {
  ans = ans.trim().toLowerCase();
  if (ans === 'a') return 1;
  if (ans === 'b') return 2;
  if (ans === 'c') return 3;
  if (ans === 'd') return 4;
  const parsed = parseInt(ans, 10);
  if (!isNaN(parsed)) return parsed;
  return null;
}

function parseMarkdownFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Find the title (e.g., # Topic Name)
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : path.basename(filePath, '.md');

  // Split by question delimiter '## '
  // Using split with regex for ## at the start of a line
  const rawBlocks = content.split(/\r?\n##\s+/);
  
  // The first block contains the # Title, which we skip for questions
  const questionBlocks = rawBlocks.slice(1);
  const questions = [];

  questionBlocks.forEach((block, index) => {
    const lines = block.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const text = lines[0]; // First line is the question text
    const options = [];
    let correctAnswer = null;

    lines.slice(1).forEach(line => {
      // Check for answer options: e.g. "1. Option text"
      const optionMatch = line.match(/^([1-4])\.\s*(.+)$/);
      if (optionMatch) {
        const id = parseInt(optionMatch[1], 10);
        const text = optionMatch[2].trim();
        options.push({ id, text });
      }

      // Check for correct answer: e.g. ">> 3" or "> > 3" or ">> d"
      const answerMatch = line.match(/^>\s*>\s*([1-4a-dA-D])$/) || line.match(/^>>\s*([1-4a-dA-D])$/);
      if (answerMatch) {
        correctAnswer = normalizeAnswer(answerMatch[1]);
      }
    });

    if (options.length !== 4) {
      console.warn(`[Warning] Question "${text.substring(0, 40)}..." in file ${path.basename(filePath)} does not have exactly 4 options (found ${options.length}).`);
    }

    if (correctAnswer === null) {
      console.warn(`[Warning] Question "${text.substring(0, 40)}..." in file ${path.basename(filePath)} has no valid correct answer.`);
    }

    questions.push({
      id: `${path.basename(filePath, '.md')}_${index + 1}`,
      text,
      options,
      correctAnswer
    });
  });

  return {
    id: path.basename(filePath, '.md'),
    title,
    questions
  };
}

function main() {
  // Ordered files according to Roman numerals: I, II, III, IV, V, VI
  const filesOrder = ['I.md', 'II.md', 'III.md', 'IV.md', 'V.md', 'VI.md'];
  const data = [];

  filesOrder.forEach(filename => {
    const filePath = path.join(BANK_DIR, filename);
    if (fs.existsSync(filePath)) {
      console.log(`Parsing ${filename}...`);
      const parsed = parseMarkdownFile(filePath);
      data.push(parsed);
      console.log(`Parsed ${parsed.questions.length} questions from ${filename}`);
    } else {
      console.warn(`File ${filename} not found in bank directory.`);
    }
  });

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Save as JSON
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Saved parsed data to ${OUTPUT_FILE}`);
}

main();
