/** TechMind inquiry receiver. Deploy as Google Apps Script Web App (execute as me). */
const SHEET_ID = '12cdkHO66sCbTskFFaxWSBK9Qt25aLQXN-p6erTUMW9U';
const NOTIFY_EMAIL = '4clickpro@gmail.com';
function doPost(e) {
  const p = (e && e.parameter) || {};
  // Honeypot field: normal visitors leave it empty.
  if (p.website) return ContentService.createTextOutput('OK');
  const clean = (key, max) => String(p[key] || '').trim().slice(0, max).replace(/[\u0000-\u001f]/g, ' ');
  const name = clean('name',120), email = clean('email',254), phone = clean('phone',40);
  const business = clean('business',120), pack = clean('package',60), workflow = clean('workflow',2000);
  if (!name || !business || !workflow || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return ContentService.createTextOutput('INVALID');
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return ContentService.createTextOutput('BUSY');
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Leads');
    if (!sheet) throw new Error('Leads tab missing');
    // Prefix formula-leading text to prevent spreadsheet formula injection.
    const safe = value => /^[=+\-@]/.test(value) ? "'" + value : value;
    sheet.appendRow([new Date(),safe(name),safe(email),safe(phone),safe(business),safe(pack),safe(workflow),'New','','','','TechMind website']);
    MailApp.sendEmail({to:NOTIFY_EMAIL,subject:'New TechMind inquiry: '+business,
      body:'New lead received. Open the private TechMind Lead Tracker to review it.\nPackage: '+pack+'\nBusiness: '+business});
    return ContentService.createTextOutput('OK');
  } finally { lock.releaseLock(); }
}
