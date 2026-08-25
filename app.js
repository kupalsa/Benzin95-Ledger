import { monthKeyFor, totalForMonth, buildSummary } from './app-core.js';

const $ = (selector) => document.querySelector(selector);
const dbName = 'fuel-ledger-db';
let selectedFile = null;
let selectedPreviewUrl = null;
let toastTimer;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('checks', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function withStore(mode, operation) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('checks', mode);
    const request = operation(transaction.objectStore('checks'));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error);
  });
}
const allChecks = () => withStore('readonly', (store) => store.getAll());
const saveCheck = (check) => withStore('readwrite', (store) => store.put(check));
const removeCheck = (id) => withStore('readwrite', (store) => store.delete(id));

function money(value) { return new Intl.NumberFormat('en-IL', { style: 'currency', currency: 'ILS' }).format(Number(value) || 0); }
function displayMonth(key) { return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(`${key}-01T12:00:00`)); }
function fileExtension(type) { return ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic' })[type] || 'jpg'; }
function escapeHTML(value = '') { return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[char]); }
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3100); }

function setSelectedFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) { showToast('Please choose an image of a check.'); return; }
  selectedFile = file;
  if (selectedPreviewUrl) URL.revokeObjectURL(selectedPreviewUrl);
  selectedPreviewUrl = URL.createObjectURL(file);
  $('#imagePreview').src = selectedPreviewUrl;
  $('#checkForm').hidden = false;
  $('#emptyCaptureHint').hidden = true;
  $('#checkDate').value = new Date().toISOString().slice(0, 10);
  updateMonthHint();
}
function clearSelectedFile() {
  selectedFile = null;
  if (selectedPreviewUrl) URL.revokeObjectURL(selectedPreviewUrl);
  selectedPreviewUrl = null;
  $('#checkForm').reset();
  $('#checkForm').hidden = true;
  $('#emptyCaptureHint').hidden = false;
  $('#cameraInput').value = ''; $('#galleryInput').value = '';
}
function updateMonthHint() { const key = monthKeyFor($('#checkDate').value); $('#monthHint').textContent = key ? `This will be filed in ${displayMonth(key)}.` : 'Confirm the purchase date to choose a month.'; }

async function refresh() {
  const checks = (await allChecks()).sort((a, b) => b.date.localeCompare(a.date));
  const summary = buildSummary(checks);
  $('#grandTotal').textContent = money(summary.total);
  $('#checkCount').textContent = summary.count;
  const latestCalculated = summary.months.find((entry) => checks.some((check) => check.month === entry.month && check.calculatedAt));
  $('#latestMonth').textContent = latestCalculated ? `${displayMonth(latestCalculated.month)} confirmed: ${money(latestCalculated.amount)}` : 'No months calculated yet.';
  renderMonths(checks, summary.months);
  renderCalendar(checks, summary.months);
}

function renderMonths(checks, months) {
  const list = $('#monthList');
  if (!months.length) { list.innerHTML = '<div class="empty-state">No checks saved yet. Start with a photo in <a href="#capture">Capture</a>.</div>'; return; }
  list.innerHTML = months.map((month) => {
    const monthChecks = checks.filter((check) => check.month === month.month);
    const finalized = monthChecks.some((check) => check.calculatedAt);
    return `<article class="month-card"><div class="month-top"><div class="month-label">${displayMonth(month.month)}</div><div class="month-meta">${month.count} ${month.count === 1 ? 'check' : 'checks'}${finalized ? ' · total confirmed' : ' · open month'}</div><div class="month-total">${money(month.amount)}</div><button class="calculate-button" data-calculate="${month.month}">${finalized ? 'Recalculate' : 'Calculate total'}</button></div><div class="check-rows">${monthChecks.map((check) => `<div class="check-row"><img class="thumb" src="${URL.createObjectURL(check.image)}" alt="Check from ${check.date}"><div class="check-info"><b>${check.note ? escapeHTML(check.note) : 'Fuel check'}</b><span>${new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${check.date}T12:00:00`))}</span></div><div class="check-amount">${money(check.amount)}</div><button class="delete-button" data-delete="${check.id}">Remove</button></div>`).join('')}</div></article>`;
  }).join('');
}
function renderCalendar(checks, months) {
  const year = new Date().getFullYear();
  $('#calendarYear').textContent = String(year);
  const calculated = new Map();
  for (const month of months) {
    const monthChecks = checks.filter((check) => check.month === month.month);
    if (monthChecks.some((check) => check.calculatedAt)) calculated.set(month.month, totalForMonth(checks, month.month));
  }
  $('#calendarGrid').innerHTML = Array.from({ length: 12 }, (_, index) => {
    const key = `${year}-${String(index + 1).padStart(2, '0')}`;
    const amount = calculated.get(key);
    return `<div class="calendar-month ${amount !== undefined ? 'has-spend' : ''}"><b>${new Intl.DateTimeFormat('en', { month: 'short' }).format(new Date(year, index, 1)).toUpperCase()}</b>${amount !== undefined ? `<div class="spent">${money(amount)}</div><small>confirmed fuel spend</small>` : '<div class="spent">—</div><small>not calculated</small>'}</div>`;
  }).join('');
}

function navigate() {
  const page = location.hash.slice(1) || 'capture';
  document.querySelectorAll('[data-page]').forEach((section) => section.hidden = section.dataset.page !== page);
  document.querySelectorAll('[data-route]').forEach((link) => link.classList.toggle('active', link.dataset.route === page));
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); }
  return (crc ^ 0xffffffff) >>> 0;
}
function u16(value) { return Uint8Array.of(value & 255, (value >>> 8) & 255); }
function u32(value) { return Uint8Array.of(value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255); }
function concat(parts) { const size = parts.reduce((sum, part) => sum + part.length, 0); const output = new Uint8Array(size); let offset = 0; for (const part of parts) { output.set(part, offset); offset += part.length; } return output; }
async function makeZip(entries) {
  const encoder = new TextEncoder(); let offset = 0; const local = []; const central = [];
  for (const entry of entries) {
    const name = encoder.encode(entry.name); const data = entry.data instanceof Blob ? new Uint8Array(await entry.data.arrayBuffer()) : encoder.encode(entry.data); const crc = crc32(data);
    const header = concat([u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),name]);
    local.push(header, data);
    central.push(concat([u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]));
    offset += header.length + data.length;
  }
  const centralData = concat(central);
  return new Blob([...local, centralData, concat([u32(0x06054b50),u16(0),u16(0),u16(entries.length),u16(entries.length),u32(centralData.length),u32(offset),u16(0)])], { type: 'application/zip' });
}
async function exportArchive(withTotals) {
  const checks = (await allChecks()).sort((a, b) => a.date.localeCompare(b.date));
  if (!checks.length) { showToast('There are no checks to export yet.'); return; }
  const entries = checks.map((check, index) => ({ name: `checks/${check.month}/${check.date}-${String(index + 1).padStart(2, '0')}.${fileExtension(check.image.type)}`, data: check.image }));
  if (withTotals) {
    const summary = buildSummary(checks);
    const rows = ['month,checks,total_ils,calculated'];
    for (const month of summary.months) { const calculated = checks.filter((check) => check.month === month.month).some((check) => check.calculatedAt); rows.push(`${month.month},${month.count},${month.amount.toFixed(2)},${calculated ? 'yes' : 'no'}`); }
    entries.push({ name: 'monthly-fuel-summary.csv', data: rows.join('\n') });
    entries.push({ name: 'checks-detail.csv', data: ['date,month,total_ils,note', ...checks.map((check) => `${check.date},${check.month},${Number(check.amount).toFixed(2)},"${String(check.note || '').replaceAll('"', '""')}"`)].join('\n') });
  }
  const blob = await makeZip(entries); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `fuel-ledger-${new Date().toISOString().slice(0, 10)}.zip`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); $('#exportDialog').close(); showToast('Your ZIP archive is downloading.');
}

$('#cameraInput').addEventListener('change', (event) => setSelectedFile(event.target.files[0]));
$('#galleryInput').addEventListener('change', (event) => setSelectedFile(event.target.files[0]));
$('#clearImage').addEventListener('click', clearSelectedFile);
$('#checkDate').addEventListener('change', updateMonthHint);
$('#checkForm').addEventListener('submit', async (event) => {
  event.preventDefault(); if (!selectedFile) return;
  const date = $('#checkDate').value; const amount = Number($('#checkAmount').value); if (!date || !Number.isFinite(amount) || amount < 0) { showToast('Add a valid purchase date and total.'); return; }
  await saveCheck({ id: crypto.randomUUID(), date, month: monthKeyFor(date), amount, note: $('#checkNote').value.trim(), image: selectedFile, createdAt: new Date().toISOString(), calculatedAt: null });
  clearSelectedFile(); await refresh(); location.hash = 'records'; showToast('Check saved to the monthly archive.');
});
$('#monthList').addEventListener('click', async (event) => {
  const deleteId = event.target.dataset.delete; const month = event.target.dataset.calculate;
  if (deleteId) { if (confirm('Remove this saved check?')) { await removeCheck(deleteId); await refresh(); showToast('Check removed.'); } }
  if (month) { const checks = await allChecks(); const timestamp = new Date().toISOString(); await Promise.all(checks.filter((check) => check.month === month).map((check) => saveCheck({ ...check, calculatedAt: timestamp }))); await refresh(); showToast(`${displayMonth(month)} total confirmed: ${money(totalForMonth(checks, month))}.`); }
});
for (const button of [$('#exportButton'), $('#exportButtonSecondary')]) button.addEventListener('click', () => $('#exportDialog').showModal());
$('#downloadArchive').addEventListener('click', () => exportArchive(document.querySelector('input[name="export-mode"]:checked').value === 'full'));
window.addEventListener('hashchange', navigate);
window.addEventListener('beforeunload', () => { if (selectedPreviewUrl) URL.revokeObjectURL(selectedPreviewUrl); });
navigate(); refresh();
