import Image from "next/image";

export default function LeadGen() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="max-w-2xl w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-10 shadow-2xl">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
          Early Access: <span className="text-blue-500">RealTLD AI Tools</span>
        </h1>
        <p className="text-zinc-400 text-lg mb-8">
          We are deploying 20 enterprise-grade AI tools for creators and agencies. 
          Join the waitlist to secure beta access and lifetime pricing before the Whop launch.
        </p>
        
        <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
          <input 
            type="email" 
            placeholder="Enter your executive email..." 
            required 
            className="flex-1 px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
          />
          <button 
            type="submit" 
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 font-bold rounded-lg transition"
          >
            Get Access
          </button>
        </form>
        
        <p className="mt-6 text-xs text-zinc-600">
          *No spam. Executive updates only. Powered by RealTLD.
        </p>
      </div>
    </div>
  );
}
