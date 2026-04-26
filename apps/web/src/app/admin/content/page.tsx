// Path: apps/web/src/app/admin/content/page.tsx
"use client";

import * as React from "react";
import { extractApiErrorMessage } from "@/lib/admin/queries";
import {
  useAdminContentOverview,
  useUpdateAdminContentOverview,
} from "@/lib/admin/content/queries";
import type { AdminNotificationTemplate } from "@/lib/admin/content/types";
import RichTextEditor from "@/components/admin/RichTextEditor";

type AdminFaqItem = {
  question: string;
  answer: string;
  youtubeUrl: string;
};

function parseMultilineList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinMultilineList(items: string[]) {
  return items.join("\n");
}

function parseFaqContent(value: string): {
  mode: "structured" | "plain";
  items: AdminFaqItem[];
  plainText: string;
} {
  const trimmed = value.trim();

  if (!trimmed) {
    return {
      mode: "structured",
      items: [],
      plainText: "",
    };
  }

  try {
    const parsed = JSON.parse(trimmed);

    if (!Array.isArray(parsed)) {
      return {
        mode: "plain",
        items: [],
        plainText: value,
      };
    }

    const items = parsed
      .map((item) => ({
        question: String(item?.question ?? "").trim(),
        answer: String(item?.answer ?? "").trim(),
        youtubeUrl: String(item?.youtubeUrl ?? "").trim(),
      }))
      .filter((item) => item.question && item.answer);

    if (items.length === 0) {
      return {
        mode: "plain",
        items: [],
        plainText: value,
      };
    }

    return {
      mode: "structured",
      items,
      plainText: "",
    };
  } catch {
    return {
      mode: "plain",
      items: [],
      plainText: value,
    };
  }
}

function serializeFaqItems(items: AdminFaqItem[]) {
  const cleaned = items
    .map((item) => ({
      question: item.question.trim(),
      answer: item.answer.trim(),
      youtubeUrl: item.youtubeUrl.trim() || undefined,
    }))
    .filter((item) => item.question && item.answer);

  if (cleaned.length === 0) return "";

  return JSON.stringify(cleaned, null, 2);
}

function TemplateEditor({
  template,
  onChange,
  onRemove,
}: {
  template: AdminNotificationTemplate;
  onChange: (next: AdminNotificationTemplate) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Template key</label>
          <input
            type="text"
            value={template.key}
            onChange={(event) => onChange({ ...template, key: event.target.value })}
            className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
            placeholder="withdrawal_approved"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Template title</label>
          <input
            type="text"
            value={template.title}
            onChange={(event) => onChange({ ...template, title: event.target.value })}
            className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
            placeholder="Withdrawal approved"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Template body</label>
        <textarea
          value={template.body}
          onChange={(event) => onChange({ ...template, body: event.target.value })}
          rows={4}
          className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
          placeholder="Your withdrawal request has been approved."
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
          <input
            type="checkbox"
            checked={template.isEnabled}
            onChange={(event) => onChange({ ...template, isEnabled: event.target.checked })}
            className="rounded border-[#C5D5EE] text-[#5B8FCC] focus:ring-[#5B8FCC]"
          />
          Enabled
        </label>

        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center justify-center rounded-xl border border-[#F2C0BC] dark:border-red-700 bg-white dark:bg-[#1E2A3A] px-4 py-3 text-sm font-medium text-[#D9534F] dark:text-red-300 transition hover:bg-[#FFF4F3] dark:hover:bg-red-900/20"
        >
          Remove template
        </button>
      </div>
    </div>
  );
}

function FaqItemEditor({
  item,
  onChange,
  onRemove,
  index,
}: {
  item: AdminFaqItem;
  onChange: (next: AdminFaqItem) => void;
  onRemove: () => void;
  index: number;
}) {
  return (
    <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">FAQ item {index + 1}</h4>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center justify-center rounded-xl border border-[#F2C0BC] dark:border-red-700 bg-white dark:bg-[#1E2A3A] px-3 py-2 text-sm font-medium text-[#D9534F] dark:text-red-300 transition hover:bg-[#FFF4F3] dark:hover:bg-red-900/20"
        >
          Remove
        </button>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Question</label>
        <input
          type="text"
          value={item.question}
          onChange={(event) => onChange({ ...item, question: event.target.value })}
          className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
          placeholder="How do I become verified?"
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Answer</label>
        <textarea
          value={item.answer}
          onChange={(event) => onChange({ ...item, answer: event.target.value })}
          rows={5}
          className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
          placeholder="Complete the verification form, upload the required documents, and wait for admin review."
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">YouTube link (optional)</label>
        <input
          type="url"
          value={item.youtubeUrl}
          onChange={(event) => onChange({ ...item, youtubeUrl: event.target.value })}
          className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
          placeholder="https://www.youtube.com/watch?v=..."
        />
      </div>
    </div>
  );
}

export default function AdminContentPage() {
  const query = useAdminContentOverview(true);
  const updateMutation = useUpdateAdminContentOverview();

  const [userAgreement, setUserAgreement] = React.useState("");
  const [privacyPolicy, setPrivacyPolicy] = React.useState("");
  const [faqMode, setFaqMode] = React.useState<"structured" | "plain">("structured");
  const [faqItems, setFaqItems] = React.useState<AdminFaqItem[]>([]);
  const [faqPlainText, setFaqPlainText] = React.useState("");
  const [supportContent, setSupportContent] = React.useState("");
  const [skillsListText, setSkillsListText] = React.useState("");
  const [bankListText, setBankListText] = React.useState("");
  const [templates, setTemplates] = React.useState<AdminNotificationTemplate[]>([]);
  const [message, setMessage] = React.useState<{ type: "ok" | "err"; text: string } | null>(null);

  React.useEffect(() => {
    if (!query.data) return;

    setUserAgreement(query.data.userAgreement ?? "");
    setPrivacyPolicy(query.data.privacyPolicy ?? "");

    const parsedFaq = parseFaqContent(query.data.faqContent ?? "");
    setFaqMode(parsedFaq.mode);
    setFaqItems(parsedFaq.items);
    setFaqPlainText(parsedFaq.plainText);

    setSupportContent(query.data.supportContent ?? "");
    setSkillsListText(joinMultilineList(query.data.skillsList ?? []));
    setBankListText(joinMultilineList(query.data.bankList ?? []));
    setTemplates(query.data.notificationTemplates ?? []);
  }, [query.data]);

  function handleTemplateChange(index: number, next: AdminNotificationTemplate) {
    setTemplates((current) => current.map((item, i) => (i === index ? next : item)));
  }

  function handleTemplateRemove(index: number) {
    setTemplates((current) => current.filter((_, i) => i !== index));
  }

  function handleAddTemplate() {
    setTemplates((current) => [
      ...current,
      {
        key: "",
        title: "",
        body: "",
        isEnabled: true,
      },
    ]);
  }

  function handleFaqItemChange(index: number, next: AdminFaqItem) {
    setFaqItems((current) => current.map((item, i) => (i === index ? next : item)));
  }

  function handleFaqItemRemove(index: number) {
    setFaqItems((current) => current.filter((_, i) => i !== index));
  }

  function handleAddFaqItem() {
    setFaqItems((current) => [
      ...current,
      {
        question: "",
        answer: "",
        youtubeUrl: "",
      },
    ]);
  }

  function buildFaqPayload() {
    if (faqMode === "plain") {
      return faqPlainText;
    }

    return serializeFaqItems(faqItems);
  }

  function handleSave() {
    setMessage(null);

    updateMutation.mutate(
      {
        userAgreement,
        privacyPolicy,
        faqContent: buildFaqPayload(),
        supportContent,
        skillsList: parseMultilineList(skillsListText),
        bankList: parseMultilineList(bankListText),
        notificationTemplates: templates,
      },
      {
        onSuccess: (response) => {
          const parsedFaq = parseFaqContent(response.content.faqContent ?? "");
          setFaqMode(parsedFaq.mode);
          setFaqItems(parsedFaq.items);
          setFaqPlainText(parsedFaq.plainText);
          setMessage({ type: "ok", text: "Content updated successfully." });
        },
        onError: (error) => {
          setMessage({ type: "err", text: extractApiErrorMessage(error) });
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">Content</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Content management</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Manage public-facing policy text, support content, FAQ items, skills, banks, and internal notification templates using live backend persistence only.
        </p>
      </section>

      {query.isLoading ? (
        <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Loading content...</p>
        </section>
      ) : query.isError ? (
        <section className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <h3 className="text-lg font-semibold text-[#D9534F] dark:text-red-300">Failed to load content</h3>
          <p className="mt-2 text-sm text-[#D9534F] dark:text-red-300">{extractApiErrorMessage(query.error)}</p>
        </section>
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Terms of Service</h3>
              <RichTextEditor
                value={userAgreement}
                onChange={setUserAgreement}
                placeholder="Enter the Terms of Service..."
              />
            </div>

            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Privacy policy</h3>
              <RichTextEditor
                value={privacyPolicy}
                onChange={setPrivacyPolicy}
                placeholder="Enter the Privacy Policy..."
              />
            </div>

            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] xl:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">FAQ content</h3>
                  <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                    Use structured FAQ items for automatic accordion mode on the public FAQ page. Plain text mode is still available as fallback.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setFaqMode("structured")}
                    className={[
                      "inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition",
                      faqMode === "structured"
                        ? "bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] text-white shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)]"
                        : "border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] text-[#6B7C99] dark:text-[#8FA0BC] hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]",
                    ].join(" ")}
                  >
                    Structured FAQ
                  </button>

                  <button
                    type="button"
                    onClick={() => setFaqMode("plain")}
                    className={[
                      "inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition",
                      faqMode === "plain"
                        ? "bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] text-white shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)]"
                        : "border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] text-[#6B7C99] dark:text-[#8FA0BC] hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]",
                    ].join(" ")}
                  >
                    Plain text
                  </button>
                </div>
              </div>

              {faqMode === "structured" ? (
                <>
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddFaqItem}
                      className="inline-flex items-center justify-center rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-3 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]"
                    >
                      Add FAQ item
                    </button>
                  </div>

                  {faqItems.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                      No FAQ items yet. Add a question and answer to enable accordion mode on the public FAQ page.
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-4">
                      {faqItems.map((item, index) => (
                        <FaqItemEditor
                          key={`faq-item-${index}`}
                          item={item}
                          index={index}
                          onChange={(next) => handleFaqItemChange(index, next)}
                          onRemove={() => handleFaqItemRemove(index)}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <textarea
                  value={faqPlainText}
                  onChange={(event) => setFaqPlainText(event.target.value)}
                  rows={14}
                  className="mt-4 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  placeholder="Enter plain FAQ content. This will render as normal text instead of accordion items."
                />
              )}
            </div>

            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] xl:col-span-2">
              <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Support content</h3>
              <RichTextEditor
                value={supportContent}
                onChange={setSupportContent}
                placeholder="Enter the Support Content..."
              />
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Skills list</h3>
              <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">One skill per line.</p>
              <textarea
                value={skillsListText}
                onChange={(event) => setSkillsListText(event.target.value)}
                rows={16}
                className="mt-4 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
              />
            </div>

            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Bank list</h3>
              <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">One bank per line.</p>
              <textarea
                value={bankListText}
                onChange={(event) => setBankListText(event.target.value)}
                rows={16}
                className="mt-4 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Notification templates</h3>
                <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                  Manage reusable notification template definitions stored in admin content.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddTemplate}
                className="inline-flex items-center justify-center rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-3 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]"
              >
                Add template
              </button>
            </div>

            {templates.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                No notification templates added yet.
              </div>
            ) : (
              <div className="mt-4 grid gap-4">
                {templates.map((template, index) => (
                  <TemplateEditor
                    key={`${template.key || "template"}-${index}`}
                    template={template}
                    onChange={(next) => handleTemplateChange(index, next)}
                    onRemove={() => handleTemplateRemove(index)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            {message && (
              <div
                className={[
                  "rounded-2xl border p-3 text-sm",
                  message.type === "ok"
                    ? "border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200"
                    : "border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300",
                ].join(" ")}
              >
                {message.text}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="inline-flex items-center justify-center rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-4 py-3 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateMutation.isPending ? "Saving..." : "Save content"}
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}