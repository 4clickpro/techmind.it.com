const TECHMIND_LEADS_ENDPOINT="https://script.google.com/macros/s/AKfycbymav3yMRgB97pOr75kzGj1z2BQ5aiZ4CAkXLvrGew0QTwGg20QHpOPPtI_g-xuwOna/exec";
document.querySelectorAll('[data-package]').forEach(a=>a.addEventListener('click',()=>{document.querySelector('#package').value=a.dataset.package;}));
document.querySelector('#inquiry-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const form=e.currentTarget,status=document.querySelector('#inquiry-status'),button=form.querySelector('button[type="submit"]');
  const fields={name:document.querySelector('#contact-name').value.trim(),email:document.querySelector('#contact-email').value.trim(),phone:document.querySelector('#contact-phone').value.trim(),business:document.querySelector('#business').value.trim(),package:document.querySelector('#package').value,workflow:document.querySelector('#workflow').value.trim(),website:document.querySelector('#website').value};
  if(!fields.name||!fields.email||!fields.business||!fields.workflow||!form.reportValidity())return;
  button.disabled=true;status.textContent='Sending inquiry…';
  try{
    // Apps Script does not expose a browser-readable cross-origin response.
    // An opaque response means the browser sent the request, not that Sheets saved it.
    await fetch(TECHMIND_LEADS_ENDPOINT,{method:'POST',mode:'no-cors',body:new URLSearchParams(fields)});
    status.textContent='Your inquiry was sent for processing. If you do not hear back, email 4clickpro@gmail.com directly. Thank you!';
    form.reset();
  }catch(err){
    status.textContent='We could not send your inquiry. Please email 4clickpro@gmail.com directly.';
  }finally{button.disabled=false;}
});