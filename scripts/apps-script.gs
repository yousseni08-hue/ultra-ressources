// Google Sheet « Leads Lead Magnets ULTRA » → Extensions > Apps Script → coller → Déployer > Application Web
// (Exécuter en tant que : moi · Accès : tout le monde). L'URL /exec va dans SHEET_WEBHOOK_URL.
const COLS = ['createdAt','firstName','lastName','phone','sector','ca','resource','source','keyword','instagram','priority','Appelé par','Résultat'];
function doPost(e) {
  const sh = SpreadsheetApp.getActive().getSheets()[0];
  if (sh.getLastRow() === 0) sh.appendRow(COLS);
  const d = JSON.parse(e.postData.contents);
  sh.appendRow(COLS.map(c => d[c] ?? ''));
  return ContentService.createTextOutput('ok');
}
