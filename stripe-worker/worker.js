// TechMind AI Stripe Checkout Worker (Cloudflare Workers)
// Configure STRIPE_SECRET_KEY as a Worker secret, and ALLOWED_ORIGIN as a variable.
// Set STRIPE_PRICE_FEATURED and STRIPE_PRICE_CATEGORY to recurring Stripe Price IDs.
// Configure SUCCESS_URL and CANCEL_URL to your site's approved destinations.
// Do not store secrets in GitHub.
const plans = {featured: 'STRIPE_PRICE_FEATURED', category: 'STRIPE_PRICE_CATEGORY'};
const json = (body, status=200, origin='') => new Response(JSON.stringify(body), {status, headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':origin,'Vary':'Origin'}});
export default {
 async fetch(request, env) {
  const origin=request.headers.get('Origin')||'';
  const allowed=env.ALLOWED_ORIGIN||'';
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':allowed,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'}});
  if(new URL(request.url).pathname!=='/create-checkout-session' || request.method!=='POST') return json({error:'Not found'},404);
  if(!allowed || origin!==allowed) return json({error:'Origin not allowed'},403);
  if(!env.STRIPE_SECRET_KEY || !env.SUCCESS_URL || !env.CANCEL_URL) return json({error:'Checkout not configured'},503,allowed);
  let payload; try { payload=await request.json(); } catch {return json({error:'Invalid JSON'},400,allowed);}
  const key=plans[payload?.plan]; if(!key || !env[key]) return json({error:'Unknown or unavailable plan'},400,allowed);
  const form=new URLSearchParams({'mode':'subscription','line_items[0][price]':env[key],'line_items[0][quantity]':'1','success_url':env.SUCCESS_URL,'cancel_url':env.CANCEL_URL});
  let response;
  try {response=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:'Bearer '+env.STRIPE_SECRET_KEY,'Content-Type':'application/x-www-form-urlencoded'},body:form});}
  catch {return json({error:'Payment provider unreachable'},502,allowed);}
  const result=await response.json();
  if(!response.ok || !result.url) return json({error:'Unable to start checkout'},502,allowed);
  return json({url:result.url},200,allowed);
 }
};