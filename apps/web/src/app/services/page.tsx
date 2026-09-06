import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/seo/breadcrumbs";
import { getPublicSkills } from "@/lib/content/api";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Find Skilled Workers in Nigeria",
  description:
    "Find verified skilled workers in Nigeria for repairs, maintenance, home services, technical work, and other on-demand jobs through FixAndEarn.",
  path: "/services",
});

const fallbackServices = [
  "Repairs and maintenance",
  "Home and property services",
  "Technical and installation work",
  "General skilled-worker jobs",
];

function normalizeSkills(skills: string[]) {
  return Array.from(
    new Set(
      skills
        .map((skill) => skill.trim())
        .filter(Boolean)
    )
  );
}

export default async function ServicesPage() {
  let skills: string[] = [];

  try {
    const response = await getPublicSkills();
    skills = normalizeSkills(response.skills);
  } catch {
    skills = [];
  }

  const displayedServices = skills.length > 0 ? skills : fallbackServices;

  const itemListJsonLd =
    skills.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "FixAndEarn Skilled Services",
          itemListElement: skills.map((skill, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: skill,
          })),
        }
      : null;

  return (
    <main className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827]">
      {itemListJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(itemListJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      ) : null}

      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <Breadcrumbs current="Services" currentPath="/services" />
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
              FixAndEarn Services
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#1A2B4A] dark:text-[#E8F0FA] sm:text-5xl">
              Find skilled workers in Nigeria
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[#6B7C99] dark:text-[#8FA0BC]">
              FixAndEarn connects clients with verified skilled workers for
              repairs, maintenance, home services, technical work, and other
              on-demand jobs across Nigeria.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-2xl bg-[#5B8FCC] px-6 py-3 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(91,143,204,0.35)] transition hover:bg-[#4A7DBB]"
              >
                Create an account
              </Link>

              <Link
                href="/faq"
                className="inline-flex items-center justify-center rounded-2xl border border-[#C5D5EE] bg-white px-6 py-3 text-sm font-semibold text-[#1A2B4A] shadow-sm transition hover:bg-[#F4F8FF] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#E8F0FA] dark:hover:bg-[#243040]"
              >
                Read the FAQ
              </Link>
            </div>
          </div>

          <section className="mt-16">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold text-[#1A2B4A] dark:text-[#E8F0FA]">
                Skilled services available on FixAndEarn
              </h2>

              <p className="mt-3 text-base leading-7 text-[#6B7C99] dark:text-[#8FA0BC]">
                Browse the skill categories currently supported by FixAndEarn.
                Clients can post jobs based on their needs, while verified
                fixers can discover suitable opportunities.
              </p>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {displayedServices.map((service) => (
                <div
                  key={service}
                  className="rounded-2xl border border-[#C5D5EE] bg-white p-5 shadow-[0_2px_12px_rgba(91,143,204,0.08)] dark:border-[#2D3F55] dark:bg-[#1E2A3A]"
                >
                  <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                    {service}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
                    Find or offer this type of skilled work through FixAndEarn.
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-16 rounded-3xl border border-[#C5D5EE] bg-white p-6 shadow-[0_4px_24px_rgba(91,143,204,0.1)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] sm:p-8">
            <h2 className="text-2xl font-bold text-[#1A2B4A] dark:text-[#E8F0FA]">
              How FixAndEarn works
            </h2>

            <div className="mt-8 grid gap-8 md:grid-cols-3">
              <div>
                <div className="text-sm font-bold text-[#5B8FCC] dark:text-[#7AAEE0]">
                  01
                </div>

                <h3 className="mt-2 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Describe the job
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
                  Add the skill category, location, budget, and useful job
                  details.
                </p>
              </div>

              <div>
                <div className="text-sm font-bold text-[#5B8FCC] dark:text-[#7AAEE0]">
                  02
                </div>

                <h3 className="mt-2 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Connect with a fixer
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
                  Verified fixers can apply for jobs or be hired directly.
                </p>
              </div>

              <div>
                <div className="text-sm font-bold text-[#5B8FCC] dark:text-[#7AAEE0]">
                  03
                </div>

                <h3 className="mt-2 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Complete the job
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
                  Manage communication, completion, payment confirmation, and
                  ratings through the platform.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Ready to get started?
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[#6B7C99] dark:text-[#8FA0BC]">
              Create your FixAndEarn account to post a job, hire a skilled
              worker, or offer your own professional skills.
            </p>

            <div className="mt-6">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-2xl bg-[#5B8FCC] px-6 py-3 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(91,143,204,0.35)] transition hover:bg-[#4A7DBB]"
              >
                Get started
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}