/* TechMind checkout: public URL only; never place Stripe secret keys here. */
const TECHMIND_CHECKOUT_ENDPOINT = ""; // Set to deployed Worker URL ending /create-checkout-session after sandbox verification.
const plans = new Set(["featured","category"]);
for (const link of document.querySelectorAll("[data-stripe-product]")) {
  const plan = link.getAttribute("data-stripe-product");
  if (!plans.has(plan) || !TECHMIND_CHECKOUT_ENDPOINT) continue;
  let endpoint;
  try { endpoint = new URL(TECHMIND_CHECKOUT_ENDPOINT); } catch { continue; }
  if (endpoint.protocol !== "https:" || !endpoint.hostname.endsWith(".workers.dev") || endpoint.username || endpoint.password) continue;
  link.textContent = "Subscribe securely with Stripe";
  link.addEventListener("click", async event => {
    event.preventDefault();
    if (link.dataset.busy === "true") return;
    link.dataset.busy = "true";
    const original = link.textContent;
    link.textContent = "Opening secure checkout…";
    try {
      const response = await fetch(endpoint.href, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({plan})});
      if (!response.ok) throw new Error("Checkout unavailable");
      const data = await response.json();
      const checkout = new URL(data.url);
      if (checkout.protocol !== "https:" || !["checkout.stripe.com","checkout.stripe.dev"].includes(checkout.hostname)) throw new Error("Invalid checkout URL");
      window.location.assign(checkout.href);
    } catch {
      link.textContent = "Checkout unavailable — inquire instead";
      link.href = plan === "featured" ? "mailto:hello@techmind.it.com?subject=Featured%20Listing%20Inquiry" : "mailto:hello@techmind.it.com?subject=Category%20Sponsorship%20Inquiry";
    } finally {
      link.dataset.busy = "false";
      if (link.textContent === "Opening secure checkout…") link.textContent = original;
    }
  });
}
