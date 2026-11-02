/* Public configuration only. Never put Stripe secret keys in this file. */
const TECHMIND_STRIPE_LINKS = Object.freeze({
  featured: "", // Stripe recurring Payment Link, $149/month
  category: "" // Stripe recurring Payment Link, $499/month
});
function isValidStripePaymentLink(value) {
  if (typeof value !== "string" || !value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "buy.stripe.com" && !url.username && !url.password;
  } catch { return false; }
}
for (const link of document.querySelectorAll("[data-stripe-product]")) {
  const product = link.getAttribute("data-stripe-product");
  const url = TECHMIND_STRIPE_LINKS[product];
  if (isValidStripePaymentLink(url)) {
    link.href = url;
    link.textContent = "Subscribe securely with Stripe";
    link.rel = "noopener noreferrer";
  }
}
