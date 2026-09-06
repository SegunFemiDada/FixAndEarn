type FaqItem = {
  question: string;
  answer: string;
  youtubeUrl?: string | null;
};

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <details
          key={`${item.question}-${index}`}
          open={index === 0}
          className="group overflow-hidden rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A]"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left marker:hidden">
            <span className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA] sm:text-base">
              {item.question}
            </span>

            <span
              aria-hidden="true"
              className="text-lg font-semibold text-[#6B7C99] transition-transform duration-200 group-open:rotate-45 dark:text-[#8FA0BC]"
            >
              +
            </span>
          </summary>

          <div className="border-t border-[#C5D5EE] px-5 py-4 dark:border-[#2D3F55]">
            <div className="whitespace-pre-wrap text-sm leading-7 text-[#6B7C99] dark:text-[#8FA0BC] sm:text-base">
              {item.answer}
            </div>

            {item.youtubeUrl ? (
              <div className="mt-4">
                <a
                  href={item.youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-[#F2C0BC] bg-[#FFF4F3] px-4 py-2 text-sm font-medium text-[#D9534F] transition hover:bg-red-50 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
                >
                  Watch on YouTube
                </a>
              </div>
            ) : null}
          </div>
        </details>
      ))}
    </div>
  );
}