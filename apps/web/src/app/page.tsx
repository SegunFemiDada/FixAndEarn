// apps/web/src/app/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FixAndEarn – Hire Trusted Fixers in Nigeria",
  description:
  "FixAndEarn connects clients with verified skilled workers across Nigeria. Secure online payments, verified identities, in-app chat, and transparent payouts for every completed job.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827]">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">

            {/* Left – text */}
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
                🔧 FixAndEarn
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#1A2B4A] dark:text-[#E8F0FA] sm:text-5xl lg:text-6xl">
                Hire trusted fixers. <br />
                Get the job done.
              </h1>
              <p className="mt-6 text-lg leading-8 text-[#6B7C99] dark:text-[#8FA0BC]">
                FixAndEarn connects clients with verified skilled workers across Nigeria.
                Every user is verified before participating, payments are made securely
                online, jobs are managed from start to finish inside the platform, and
                fixers receive their earnings after approved job completion.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="rounded-2xl bg-[#5B8FCC] hover:bg-[#4A7DBB] px-6 py-3 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5B8FCC] focus:ring-offset-2"
                >
                  Get started
                </Link>
                <Link
                  href="/login"
                  className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-6 py-3 text-sm font-semibold text-[#1A2B4A] dark:text-[#C5D8F0] shadow-sm hover:bg-[#F4F8FF] dark:hover:bg-[#243040] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5B8FCC] focus:ring-offset-2"
                >
                  Log in
                </Link>
              </div>
            </div>

            {/* Right – illustration card */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.15)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                <svg
                  viewBox="0 0 400 300"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-auto"
                >
                  <circle cx="200" cy="150" r="120" fill="url(#gradient)" opacity="0.1" />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#5B8FCC" />
                      <stop offset="100%" stopColor="#7AAEE0" />
                    </linearGradient>
                  </defs>

                  {/* Client */}
                  <g transform="translate(60, 80)">
                    <circle cx="30" cy="30" r="22" fill="#5B8FCC" fillOpacity="0.2" stroke="#5B8FCC" strokeWidth="2" />
                    <path d="M20 45 L40 45 L38 40 L22 40 Z" fill="#5B8FCC" />
                    <rect x="25" y="20" width="10" height="15" rx="2" fill="#5B8FCC" />
                    <path d="M18 20 L42 20 L42 25 L18 25 Z" fill="#5B8FCC" fillOpacity="0.6" />
                    <text x="30" y="65" textAnchor="middle" fontSize="10" fill="#5B8FCC" fontWeight="bold">Client</text>
                  </g>

                  {/* Fixer */}
                  <g transform="translate(280, 80)">
                    <circle cx="30" cy="30" r="22" fill="#7AAEE0" fillOpacity="0.2" stroke="#7AAEE0" strokeWidth="2" />
                    <path d="M20 45 L40 45 L38 40 L22 40 Z" fill="#7AAEE0" />
                    <rect x="25" y="20" width="10" height="15" rx="2" fill="#7AAEE0" />
                    <path d="M28 18 L32 18 L32 22 L28 22 Z" fill="#7AAEE0" />
                    <circle cx="30" cy="15" r="3" fill="#7AAEE0" />
                    <text x="30" y="65" textAnchor="middle" fontSize="10" fill="#7AAEE0" fontWeight="bold">Fixer</text>
                  </g>

                  {/* Secure payment */}
                  <g transform="translate(185, 140)">
                    <path d="M15 0 L30 8 L30 22 C30 34 15 42 15 42 C15 42 0 34 0 22 L0 8 Z" fill="#10b981" fillOpacity="0.8" stroke="#10b981" strokeWidth="1.5" />
                    <path d="M8 18 L12 22 L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <text x="15" y="52" textAnchor="middle" fontSize="8" fill="#10b981" fontWeight="bold">Secure Pay</text>
                  </g>

                  {/* Connecting line */}
                  <path d="M120 110 L280 110" stroke="#C5D5EE" strokeWidth="2" strokeDasharray="6 6" />
                  <path d="M130 105 L120 110 L130 115" fill="none" stroke="#C5D5EE" strokeWidth="2" />
                  <path d="M270 105 L280 110 L270 115" fill="none" stroke="#C5D5EE" strokeWidth="2" />

                  <circle cx="140" cy="180" r="4" fill="#5B8FCC" fillOpacity="0.4" />
                  <circle cx="260" cy="180" r="4" fill="#5B8FCC" fillOpacity="0.4" />
                </svg>
                <p className="mt-4 text-center text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                  Verified users • Secure online payments • Real-time chat
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      {/* <section className="bg-white dark:bg-[#1E2A3A] py-12 shadow-[0_1px_0_rgba(91,143,204,0.1),0_-1px_0_rgba(91,143,204,0.1)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {[
              { value: "5,000+", label: "Verified Fixers" },
              { value: "10,000+", label: "Jobs Completed" },
              { value: "98%", label: "Client Satisfaction" },
              { value: "24/7", label: "Admin Support" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-3xl font-bold text-[#1A2B4A] dark:text-[#E8F0FA]">{value}</div>
                <div className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ── How It Works ── */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#1A2B4A] dark:text-[#E8F0FA] sm:text-4xl">
              How FixAndEarn works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[#6B7C99] dark:text-[#8FA0BC]">
              Everything happens in one place, from hiring to payment completion.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Post a job",
                desc: "Create a job or hire a fixer directly. Complete the required posting or urgent hire payment securely online.",
              },
              {
                step: "2",
                title: "Fixers apply & negotiate",
                desc: "Verified fixers apply or accept direct hires. Chat, negotiate when needed, and begin work after payment confirmation.",
              },
              {
                step: "3",
                title: "Job done, get paid",
                desc: "Approve completed work. The fixer's earnings are credited instantly and become available for withdrawal.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF0FB] dark:bg-[#1E2A3A] border border-[#C5D5EE] dark:border-[#2D3F55] text-[#5B8FCC] dark:text-[#7AAEE0] shadow-[0_2px_8px_rgba(91,143,204,0.15)]">
                  <span className="text-2xl font-bold">{step}</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{title}</h3>
                <p className="mt-2 text-[#6B7C99] dark:text-[#8FA0BC]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-16 dark:bg-[#111827]/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#1A2B4A] dark:text-[#E8F0FA] sm:text-4xl">
              Why choose FixAndEarn?
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "✅",
                title: "Verified users",
                desc: "Identity verification helps ensure clients and fixers interact with trusted users.",
              },
              {
                icon: "🔒",
                title: "Secure online payments",
                desc: "Clients pay securely through our payment provider while the platform manages the complete job workflow and payment records.",
              },
              {
                icon: "👩‍⚖️",
                title: "Admin oversight",
                desc: "Our admin team oversees verification, disputes, withdrawals, and platform integrity.",
              },
              {
                icon: "💬",
                title: "Real‑time chat",
                desc: "Discuss the job, negotiate pricing when applicable, and keep all communication inside the platform.",
              },
              {
                icon: "⭐",
                title: "Ratings & reviews",
                desc: "Build your reputation with genuine ratings and reviews after completed jobs.",
              },
              {
                icon: "📱",
                title: "Mobile‑first",
                desc: "Designed for phones, tablets, and desktops without requiring an app installation.",
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="rounded-3xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_2px_12px_rgba(91,143,204,0.08)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] transition-shadow hover:shadow-[0_4px_20px_rgba(91,143,204,0.15)]"
              >
                <div className="text-3xl">{icon}</div>
                <h3 className="mt-3 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{title}</h3>
                <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-[#1A2B4A] dark:text-[#E8F0FA] sm:text-4xl">
            Ready to hire a trusted fixer or earn from your skills?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#6B7C99] dark:text-[#8FA0BC]">
            Create your free account today and connect with verified clients and skilled professionals across Nigeria.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded-2xl bg-[#5B8FCC] hover:bg-[#4A7DBB] px-6 py-3 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)] transition-all duration-200"
            >
              Create free account
            </Link>
            <Link
              href="/login"
              className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-6 py-3 text-sm font-semibold text-[#1A2B4A] dark:text-[#C5D8F0] shadow-sm hover:bg-[#F4F8FF] dark:hover:bg-[#243040] transition-all duration-200"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}