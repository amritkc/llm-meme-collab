/**
 * refine_from_csv.cjs
 * Reads a CSV of memes with three caption ideas and calls `hf-refine-caption` for each row.
 * - Default: dry-run (no file modification)
 * - Writes output CSV with final caption in `refined caption` column (when not dry-run)
 *
 * Usage:
 *   node supabase/refine_from_csv.cjs --input supabase/aiFirstMemes/meme_captions_tech.csv --output supabase/aiFirstMemes/meme_captions_tech.refined.csv --dry-run=true
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

// --- Utilities ---
function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  args.forEach(a => {
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      out[k] = v === undefined ? true : v;
    }
  });
  return out;
}

function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).filter(Boolean).map(line => {
    const values = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i] === undefined ? '' : values[i]);
    return obj;
  });
  return { headers, rows };
}

function parseCSVLine(line) {
  const res = [];
  let i = 0; let cur = ''; let inQuotes = false;
  while (i < line.length) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i+1] === '"') { cur += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      cur += ch; i++; continue;
    }
    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === ',') { res.push(cur); cur = ''; i++; continue; }
    cur += ch; i++;
  }
  res.push(cur);
  return res;
}

function stringifyCSV(headers, rows) {
  const esc = v => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const lines = [headers.map(esc).join(',')];
  rows.forEach(r => {
    const line = headers.map(h => esc(r[h] ?? '')).join(',');
    lines.push(line);
  });
  return lines.join('\n');
}

function loadImageAsBase64(relativePath) {
  const imagePath = path.join(__dirname, relativePath);
  const buff = fs.readFileSync(imagePath);
  return buff.toString('base64');
}

async function callEdgeFunction(functionName, requestBody) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return await response.json();
}

function findTemplatePathByFilename(filename) {
  const candidateDirs = [
    '../src/assets/templates/tech',
    '../src/assets/templates/student',
    '../src/assets/templates/daily',
  ];
  for (const d of candidateDirs) {
    const p = path.join(__dirname, d, filename);
    if (fs.existsSync(p)) return path.relative(__dirname, p).replace(/\\/g, '/');
  }
  return null;
}

// --- Main ---
(async function main(){
  const args = parseArgs();
  const input = args.input || 'supabase/aiFirstMemes/meme_captions_tech.csv';
  const output = args.output || (input.replace('.csv', '.refined.csv'));
  const dryRun = (args['dry-run'] === undefined) ? true : (String(args['dry-run']) !== 'false');
  const start = args.start ? parseInt(args.start, 10) : 1;
  const end = args.end ? parseInt(args.end, 10) : Infinity;

  console.log(`\n🔧 refine_from_csv starting (dryRun=${dryRun})`);
  console.log(`Input: ${input}`);
  console.log(`Output: ${output}\n`);

  if (!fs.existsSync(input)) {
    console.error(`Input CSV not found: ${input}`);
    process.exit(1);
  }

  // Backup original
  const backup = `${input}.bak.${Date.now()}`;
  fs.copyFileSync(input, backup);
  console.log(`Backup created: ${backup}`);

  const csvText = fs.readFileSync(input, 'utf8');
  const { headers, rows } = parseCSV(csvText);

  // Ensure 'refined caption' column exists
  const refinedCol = 'refined caption';
  if (!headers.includes(refinedCol)) headers.push(refinedCol);

  console.log(`Parsed ${rows.length} rows (headers: ${headers.join(', ')})`);

  let processed = 0;
  for (let idx = 0; idx < rows.length; idx++) {
    const rowNum = idx + 1; // 1-based relative to data rows
    if (rowNum < start) continue;
    if (rowNum > end) break;

    const row = rows[idx];
    const templateFile = (row.template || '').trim();
    const captions = [row.caption_1, row.caption_2, row.caption_3].filter(Boolean).map(s => s.trim()).filter(Boolean);
    if (!templateFile || captions.length === 0) {
      console.log(`Row ${rowNum}: missing template or captions, skipping`);
      continue;
    }

    const templatePath = findTemplatePathByFilename(templateFile);
    if (!templatePath) {
      console.warn(`Row ${rowNum}: template file not found locally: ${templateFile}, skipping`);
      continue;
    }

    const topic = templatePath.includes('/tech/') ? 'Technology/AI' : (templatePath.includes('/student/') ? 'Student Life' : 'Daily Struggles');

    console.log(`\n--- Row ${rowNum} — ${templateFile} — topic: ${topic}`);
    captions.forEach((c,i) => console.log(`  ${i+1}. ${c}`));

    let finalCaption = '';
    try {
      const templateBase64 = loadImageAsBase64(templatePath);
      const requestBody = {
        topic,
        templateBase64,
        templateMimeType: 'image/jpeg',
        humanCaptions: captions,
      };

      if (dryRun) {
        console.log('DRY-RUN: would call hf-refine-caption');
        finalCaption = ''; // leave empty in dry-run
      } else {
        const data = await callEdgeFunction('hf-refine-caption', requestBody);
        finalCaption = data?.finalCaption || '';
        console.log(`Result: ${finalCaption}`);
      }

      rows[idx][refinedCol] = finalCaption;
      processed++;

    } catch (err) {
      console.error(`Error processing row ${rowNum}:`, err.message);
      rows[idx][refinedCol] = '';
    }
  }

  // Write out
  if (!dryRun) {
    const outCsv = stringifyCSV(headers, rows);
    fs.writeFileSync(output, outCsv, 'utf8');
    console.log(`\n✅ Wrote output CSV: ${output}`);
  } else {
    console.log('\n⚠️ Dry-run mode enabled: no file changes written');
  }

  console.log(`\nDone — processed ${processed} rows`);
  process.exit(0);
})();