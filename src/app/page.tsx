export default function Home() {
  const cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "Austin"];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-50">
      {/* Navigation */}
      <nav className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black py-4 px-8 flex justify-between items-center">
        <div className="text-2xl font-bold tracking-tighter">RealTLD</div>
        <div className="space-x-6 text-sm font-medium">
          <a href="#cities" className="hover:text-blue-500">Markets</a>
          <a href="#pricing" className="hover:text-blue-500">Pricing</a>
          <a href="#" className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:opacity-80 transition">Sign In</a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-24 flex flex-col items-center text-center">
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6">
          Dominate Your <span className="text-blue-600">Real Estate</span> Market.
        </h1>
        <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mb-10">
          The ultimate data-scraping engine for high-intent real estate leads and services. 
          Select your city, pull the data, and close the deal.
        </p>
        <div className="flex gap-4">
          <a href="#pricing" className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition">
            Start Generating Leads
          </a>
          <a href="#seo-content" className="px-8 py-4 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg font-semibold text-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
            Read Case Studies
          </a>
        </div>
      </main>

      {/* City Selection (For Local SEO & Scraping Targets) */}
      <section id="cities" className="py-20 bg-white dark:bg-black border-y border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-10 text-center">Select Your Market</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {cities.map((city) => (
              <div key={city} className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-blue-500 hover:shadow-lg transition cursor-pointer flex items-center justify-center text-center font-medium">
                {city} Data
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold mb-4 text-center">Premium Intelligence. Transparent Pricing.</h2>
        <p className="text-center text-zinc-600 dark:text-zinc-400 mb-12">We tested the market. Our data is worth the premium, but we offer scalable entry points.</p>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Growth Tier (Lower price test) */}
          <div className="p-8 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-black flex flex-col">
            <h3 className="text-xl font-bold mb-2">Market Challenger</h3>
            <p className="text-zinc-500 text-sm mb-6">For aggressive upstarts testing the waters.</p>
            <div className="text-5xl font-bold mb-6">$499<span className="text-lg font-normal text-zinc-500">/mo</span></div>
            <ul className="space-y-4 mb-8 flex-1 text-sm">
              <li>✓ Access to 1 Major City</li>
              <li>✓ 5,000 Verified Leads/mo</li>
              <li>✓ Standard Support</li>
            </ul>
            <button className="w-full py-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-800 transition">Select Tier</button>
          </div>

          {/* Enterprise Tier ($1000/mo) */}
          <div className="p-8 border border-blue-500 rounded-2xl bg-blue-50 dark:bg-blue-950/20 flex flex-col relative">
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">MOST POPULAR</div>
            <h3 className="text-xl font-bold mb-2 text-blue-900 dark:text-blue-100">Enterprise Dominator</h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm mb-6">Unlimited scraping power across all major cities.</p>
            <div className="text-5xl font-bold mb-6 text-blue-900 dark:text-blue-100">$1,000<span className="text-lg font-normal text-blue-700 dark:text-blue-300">/mo</span></div>
            <ul className="space-y-4 mb-8 flex-1 text-sm text-blue-900 dark:text-blue-100">
              <li>✓ Access to ALL Major Cities</li>
              <li>✓ Unlimited Leads & Scraping</li>
              <li>✓ Priority API Access</li>
              <li>✓ Dedicated Account Manager</li>
            </ul>
            <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">Get Started</button>
          </div>
        </div>
      </section>

      {/* SEO Footer / Content Area */}
      <footer id="seo-content" className="py-12 bg-zinc-100 dark:bg-zinc-900 text-center text-sm text-zinc-500">
        <p className="max-w-3xl mx-auto">
          RealTLD provides enterprise-grade data extraction for the real estate industry. Discover off-market properties, motivated sellers, and local service providers across the nation. 
          By combining advanced web scraping with SEO-optimized lead funnels, we deliver the highest quality data for top-tier investors and agencies.
        </p>
        <p className="mt-6">© {new Date().getFullYear()} RealTLD Corporation. All rights reserved.</p>
      </footer>
    </div>
  );
}
