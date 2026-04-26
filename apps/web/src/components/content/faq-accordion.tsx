//path: apps/web/src/components/content/faq-accordion.tsx
"use client";

import * as React from "react";

type FaqItem = {
  question: string;
  answer: string;
  youtubeUrl?: string | null;
};

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <article
            key={`${item.question}-${index}`}
            className="overflow-hidden rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A]"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA] sm:text-base">
                {item.question}
              </span>
              <span className="text-lg font-semibold text-[#6B7C99] dark:text-[#8FA0BC]">
                {isOpen ? "−" : "+"}
              </span>
            </button>

            {isOpen ? (
              <div className="border-t border-[#C5D5EE] dark:border-[#2D3F55] px-5 py-4">
                <div className="whitespace-pre-wrap text-sm leading-7 text-[#6B7C99] dark:text-[#8FA0BC] sm:text-base">
                  {item.answer}
                </div>

                {item.youtubeUrl ? (
                  <div className="mt-4">
                    <a
                      href={item.youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 px-4 py-2 text-sm font-medium text-[#D9534F] dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                    >
                      Watch on YouTube
                    </a>
                  </div>
                ) : null}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}