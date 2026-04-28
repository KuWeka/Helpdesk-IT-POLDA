const fs = require('fs');
const path = require('path');

const root = process.cwd();
const srcRoot = path.join(root, 'documentations', 'file_md');
const dstRoot = path.join(root, 'documentations', 'file_md_V2');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && full.toLowerCase().endsWith('.md')) out.push(full);
  }
  return out;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return;
  }
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    fs.rmSync(full, { recursive: true, force: true });
  }
}

function titleFromFileName(fileName) {
  return fileName
    .replace(/\.md$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function getFirstHeading(content) {
  const m = content.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

function getFirstParagraph(content) {
  const lines = content.split(/\r?\n/);
  const buf = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      if (buf.length > 0) break;
      continue;
    }
    if (/^#{1,6}\s+/.test(t)) continue;
    if (/^Tanggal\s*:/i.test(t)) continue;
    if (/^[-*]\s+/.test(t) && buf.length === 0) continue;
    if (/^```/.test(t)) continue;
    buf.push(t);
    if (buf.join(' ').length > 240) break;
  }
  const p = buf.join(' ').trim();
  return p || 'Dokumen ini berisi informasi teknis dan operasional yang mendukung implementasi serta pemeliharaan sistem.';
}

function extractHeadings(content) {
  const headings = [];
  const re = /^##+\s+(.+)$/gm;
  let m;
  while ((m = re.exec(content)) !== null) {
    headings.push(m[1].trim());
    if (headings.length >= 8) break;
  }
  return headings;
}

function removeFrontHeadingAndDate(content) {
  let out = content.replace(/^\uFEFF/, '');
  out = out.replace(/^Tanggal\s*:.*(?:\r?\n)+/i, '');
  out = out.replace(/^#\s+.*(?:\r?\n)+/, '');
  out = out.replace(/\n{3,}/g, '\n\n').trim();
  return out;
}

function mapDestination(relPath) {
  const rel = relPath.replace(/\\/g, '/');

  if (rel.startsWith('archived-md/backend/')) {
    return rel.replace('archived-md/backend/', '02_Backend_Operational_Guides/');
  }
  if (rel.startsWith('archived-md/apps/web/docs/ui-rebuild/')) {
    return rel.replace('archived-md/apps/web/docs/ui-rebuild/', '03_Web_UI_Transformation/');
  }
  if (rel.startsWith('archived-md/')) {
    return rel.replace('archived-md/', '01_Legacy_Architecture/');
  }
  if (rel.startsWith('dokumentasi_final/')) {
    return rel.replace('dokumentasi_final/', '04_System_Reference/');
  }
  if (rel.startsWith('phase-master-internal/')) {
    return rel.replace('phase-master-internal/', '05_Delivery_Execution_Records/');
  }
  if (rel.startsWith('promt/')) {
    return rel.replace('promt/', '06_AI_Prompts_and_Workflows/');
  }
  if (rel.startsWith('REVISI_BESAR/')) {
    return rel
      .replace('REVISI_BESAR/', '07_Remediation_Program/')
      .replace(/Phase\s+(\d+)/g, (_, n) => `Workstream_${String(Number(n)).padStart(2, '0')}`);
  }
  if (rel.startsWith('UPDATE_V1.0/')) {
    return rel.replace('UPDATE_V1.0/', '08_Release_Notes_v1_0/');
  }

  return path.posix.join('99_Misc', rel);
}

function buildDoc({ title, relSrc, summary, headings, body, lastModified }) {
  const toc = headings.length
    ? headings.map((h, i) => `${i + 1}. ${h}`).join('\n')
    : '1. Ruang lingkup dokumen\n2. Implementasi\n3. Validasi\n4. Tindak lanjut';

  const quickPoints = [
    'Dokumen ini telah dinormalisasi agar mudah dipindai oleh tim teknis dan non-teknis.',
    'Struktur isi disusun ulang menjadi tujuan, ringkasan, daftar bahasan, konten inti, dan checklist verifikasi.',
    'Bagian teknis asli dipertahankan agar jejak keputusan dan implementasi tetap dapat diaudit.'
  ];

  return `# ${title}\n\nTanggal Dokumen: ${lastModified}\nVersi Dokumen: V2 Professional\nSumber Asli: ${relSrc}\n\n## Tujuan Dokumen\n\n${summary}\n\n## Ringkasan Eksekutif\n\n- ${quickPoints[0]}\n- ${quickPoints[1]}\n- ${quickPoints[2]}\n\n## Peta Isi\n\n${toc}\n\n## Konten Inti (Disusun Ulang)\n\n${body}\n\n## Checklist Review\n\n- [ ] Istilah teknis sudah konsisten antar dokumen\n- [ ] Referensi script/path masih valid terhadap struktur repo terbaru\n- [ ] Action item lanjutan sudah memiliki owner atau milestone\n- [ ] Dokumen siap dipakai untuk onboarding dan audit teknis\n`;
}

function main() {
  if (!fs.existsSync(srcRoot)) {
    console.error(`Source folder not found: ${srcRoot}`);
    process.exit(1);
  }

  cleanDir(dstRoot);

  const files = walk(srcRoot);
  const categoryCount = new Map();

  for (const file of files) {
    const relSrc = path.relative(srcRoot, file).replace(/\\/g, '/');
    const relDst = mapDestination(relSrc);
    const dst = path.join(dstRoot, relDst);
    ensureDir(path.dirname(dst));

    const stat = fs.statSync(file);
    const lastModified = stat.mtime.toISOString().slice(0, 10);
    const raw = fs.readFileSync(file, 'utf8');

    const title = getFirstHeading(raw) || titleFromFileName(path.basename(file));
    const summary = getFirstParagraph(raw);
    const headings = extractHeadings(raw);
    const body = removeFrontHeadingAndDate(raw);

    const finalDoc = buildDoc({
      title,
      relSrc,
      summary,
      headings,
      body,
      lastModified,
    });

    fs.writeFileSync(dst, finalDoc, 'utf8');

    const category = relDst.split('/')[0];
    categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
  }

  const indexLines = [];
  indexLines.push('# Documentation Suite V2');
  indexLines.push('');
  indexLines.push('Kumpulan dokumentasi versi profesional hasil restrukturisasi dari folder file_md.');
  indexLines.push('');
  indexLines.push(`Total dokumen: ${files.length}`);
  indexLines.push('');
  indexLines.push('## Kategori Dokumen');
  indexLines.push('');

  for (const [cat, count] of [...categoryCount.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    indexLines.push(`- ${cat}: ${count} dokumen`);
  }

  indexLines.push('');
  indexLines.push('## Standar Format V2');
  indexLines.push('');
  indexLines.push('- Metadata awal dokumen (tanggal, versi, sumber)');
  indexLines.push('- Ringkasan eksekutif dan peta isi');
  indexLines.push('- Konten inti yang dirapikan agar mudah ditelusuri');
  indexLines.push('- Checklist review untuk quality control dokumen');

  fs.writeFileSync(path.join(dstRoot, 'README.md'), indexLines.join('\n') + '\n', 'utf8');

  console.log(`generated_files=${files.length}`);
  console.log(`categories=${categoryCount.size}`);
}

main();
