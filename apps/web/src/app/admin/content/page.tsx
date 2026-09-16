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

const PANEL_CLASS =
  "rounded-2xl border border-[#C5D5EE] bg-white p-6 shadow-[0_4px_24px_rgba(91,143,204,0.10)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]";

const SUBPANEL_CLASS =
  "rounded-xl border border-[#C5D5EE] bg-[#F8FAFD] dark:border-[#2D3F55] dark:bg-[#16202E]";

const INPUT_CLASS =
  "w-full rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-sm text-[#1A2B4A] outline-none transition placeholder:text-[#9BAEC8] focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA] dark:placeholder:text-[#4A6080] dark:focus:border-[#5B8FCC]";

const PRIMARY_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600";

const SECONDARY_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-xl border border-[#C5D5EE] bg-white px-4 py-3 text-sm font-medium text-[#6B7C99] transition hover:bg-[#F4F8FF] hover:text-[#1A2B4A] focus:outline-none focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#8FA0BC] dark:hover:bg-[#16202E] dark:hover:text-[#E8F0FA]";

const DANGER_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-xl border border-[#F2C0BC] bg-white px-4 py-3 text-sm font-medium text-[#D9534F] transition hover:bg-[#FFF4F3] focus:outline-none focus:ring-2 focus:ring-red-400/20 dark:border-red-700 dark:bg-[#1E2A3A] dark:text-red-300 dark:hover:bg-red-900/20";

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

  if (cleaned.length === 0) {
    return "";
  }

  return JSON.stringify(cleaned, null, 2);
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5B8FCC] dark:text-[#7AAEE0]">
            {eyebrow}
          </p>
        ) : null}

        <h3 className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
          {title}
        </h3>

        {description ? (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
            {description}
          </p>
        ) : null}
      </div>

      {action ? (
        <div className="shrink-0">{action}</div>
      ) : null}
    </div>
  );
}

function FieldLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
      {children}
    </label>
  );
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
    <article className={`${SUBPANEL_CLASS} p-5`}>
      <div className="flex flex-col gap-3 border-b border-[#C5D5EE] pb-4 dark:border-[#2D3F55] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#5B8FCC] dark:text-[#7AAEE0]">
            Notification template
          </p>

          <h4 className="mt-1 text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            {template.key || "New template"}
          </h4>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className={DANGER_BUTTON_CLASS}
        >
          Remove template
        </button>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <FieldLabel>Template key</FieldLabel>

          <input
            type="text"
            value={template.key}
            onChange={(event) =>
              onChange({
                ...template,
                key: event.target.value,
              })
            }
            className={`mt-2 ${INPUT_CLASS}`}
            placeholder="withdrawal_approved"
          />
        </div>

        <div>
          <FieldLabel>Template title</FieldLabel>

          <input
            type="text"
            value={template.title}
            onChange={(event) =>
              onChange({
                ...template,
                title: event.target.value,
              })
            }
            className={`mt-2 ${INPUT_CLASS}`}
            placeholder="Withdrawal approved"
          />
        </div>
      </div>

      <div className="mt-5">
        <FieldLabel>Template body</FieldLabel>

        <textarea
          value={template.body}
          onChange={(event) =>
            onChange({
              ...template,
              body: event.target.value,
            })
          }
          rows={5}
          className={`mt-2 ${INPUT_CLASS} resize-y`}
          placeholder="Your withdrawal request has been approved."
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
          <input
            type="checkbox"
            checked={template.isEnabled}
            onChange={(event) =>
              onChange({
                ...template,
                isEnabled: event.target.checked,
              })
            }
            className="rounded border-[#C5D5EE] text-[#5B8FCC] focus:ring-[#5B8FCC] dark:border-[#2D3F55]"
          />

          <span>Enabled</span>
        </label>
      </div>
    </article>
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
    <article className={`${SUBPANEL_CLASS} p-5`}>
      <div className="flex flex-col gap-3 border-b border-[#C5D5EE] pb-4 dark:border-[#2D3F55] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#5B8FCC] dark:text-[#7AAEE0]">
            FAQ
          </p>

          <h4 className="mt-1 text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            FAQ item {index + 1}
          </h4>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className={DANGER_BUTTON_CLASS}
        >
          Remove
        </button>
      </div>

      <div className="mt-5">
        <FieldLabel>Question</FieldLabel>

        <input
          type="text"
          value={item.question}
          onChange={(event) =>
            onChange({
              ...item,
              question: event.target.value,
            })
          }
          className={`mt-2 ${INPUT_CLASS}`}
          placeholder="How do I become verified?"
        />
      </div>

      <div className="mt-5">
        <FieldLabel>Answer</FieldLabel>

        <textarea
          value={item.answer}
          onChange={(event) =>
            onChange({
              ...item,
              answer: event.target.value,
            })
          }
          rows={6}
          className={`mt-2 ${INPUT_CLASS} resize-y`}
          placeholder="Complete the verification form, upload the required documents, and wait for admin review."
        />
      </div>

      <div className="mt-5">
        <FieldLabel>YouTube link</FieldLabel>

        <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
          Optional.
        </p>

        <input
          type="url"
          value={item.youtubeUrl}
          onChange={(event) =>
            onChange({
              ...item,
              youtubeUrl: event.target.value,
            })
          }
          className={`mt-2 ${INPUT_CLASS}`}
          placeholder="https://www.youtube.com/watch?v=..."
        />
      </div>
    </article>
  );
}

export default function AdminContentPage() {
  const query = useAdminContentOverview(true);
  const updateMutation = useUpdateAdminContentOverview();

  const [userAgreement, setUserAgreement] = React.useState("");
  const [privacyPolicy, setPrivacyPolicy] = React.useState("");
  const [faqMode, setFaqMode] = React.useState<
    "structured" | "plain"
  >("structured");
  const [faqItems, setFaqItems] = React.useState<AdminFaqItem[]>([]);
  const [faqPlainText, setFaqPlainText] = React.useState("");
  const [supportContent, setSupportContent] = React.useState("");
  const [skillsListText, setSkillsListText] = React.useState("");
  const [bankListText, setBankListText] = React.useState("");
  const [templates, setTemplates] = React.useState<
    AdminNotificationTemplate[]
  >([]);
  const [message, setMessage] = React.useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  React.useEffect(() => {
    if (!query.data) {
      return;
    }

    setUserAgreement(query.data.userAgreement ?? "");
    setPrivacyPolicy(query.data.privacyPolicy ?? "");

    const parsedFaq = parseFaqContent(
      query.data.faqContent ?? "",
    );

    setFaqMode(parsedFaq.mode);
    setFaqItems(parsedFaq.items);
    setFaqPlainText(parsedFaq.plainText);

    setSupportContent(query.data.supportContent ?? "");
    setSkillsListText(
      joinMultilineList(query.data.skillsList ?? []),
    );
    setBankListText(
      joinMultilineList(query.data.bankList ?? []),
    );
    setTemplates(query.data.notificationTemplates ?? []);
  }, [query.data]);

  function handleTemplateChange(
    index: number,
    next: AdminNotificationTemplate,
  ) {
    setTemplates((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? next : item,
      ),
    );
  }

  function handleTemplateRemove(index: number) {
    setTemplates((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
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

  function handleFaqItemChange(
    index: number,
    next: AdminFaqItem,
  ) {
    setFaqItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? next : item,
      ),
    );
  }

  function handleFaqItemRemove(index: number) {
    setFaqItems((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
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
          const parsedFaq = parseFaqContent(
            response.content.faqContent ?? "",
          );

          setFaqMode(parsedFaq.mode);
          setFaqItems(parsedFaq.items);
          setFaqPlainText(parsedFaq.plainText);

          setMessage({
            type: "ok",
            text: "Content updated successfully.",
          });
        },
        onError: (error) => {
          setMessage({
            type: "err",
            text: extractApiErrorMessage(error),
          });
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <section className={PANEL_CLASS}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
              Content
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Content management
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
              Manage public-facing policy text, support content,
              FAQ items, skills, banks, and internal notification
              templates using live backend persistence only.
            </p>
          </div>

          <div className="hidden shrink-0 rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-right dark:border-[#2D3F55] dark:bg-[#16202E] xl:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6B7C99] dark:text-[#8FA0BC]">
              Publishing model
            </p>

            <p className="mt-1 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Manual save
            </p>
          </div>
        </div>
      </section>

      {/* Loading and error states */}
      {query.isLoading ? (
        <section className={PANEL_CLASS}>
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Loading content...
          </p>
        </section>
      ) : query.isError ? (
        <section className="rounded-2xl border border-[#F2C0BC] bg-[#FFF4F3] p-6 dark:border-red-700 dark:bg-red-900/20">
          <h3 className="text-lg font-semibold text-[#D9534F] dark:text-red-300">
            Failed to load content
          </h3>

          <p className="mt-2 text-sm text-[#D9534F] dark:text-red-300">
            {extractApiErrorMessage(query.error)}
          </p>
        </section>
      ) : (
        <>
          {/* Policies */}
          <section className={PANEL_CLASS}>
            <SectionHeader
              eyebrow="Public policies"
              title="Terms and privacy"
              description="Edit the policy content exposed to users."
            />

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <div className={`${SUBPANEL_CLASS} p-5`}>
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                    Terms of Service
                  </h4>

                  <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                    Public terms shown to users.
                  </p>
                </div>

                <RichTextEditor
                  value={userAgreement}
                  onChange={setUserAgreement}
                  placeholder="Enter the Terms of Service..."
                />
              </div>

              <div className={`${SUBPANEL_CLASS} p-5`}>
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                    Privacy policy
                  </h4>

                  <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                    Public privacy policy shown to users.
                  </p>
                </div>

                <RichTextEditor
                  value={privacyPolicy}
                  onChange={setPrivacyPolicy}
                  placeholder="Enter the Privacy Policy..."
                />
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className={PANEL_CLASS}>
            <SectionHeader
              eyebrow="Public support"
              title="FAQ content"
              description="Structured FAQ items enable accordion mode on the public FAQ page. Plain text remains available as a fallback."
              action={
                <div className="inline-flex overflow-hidden rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55]">
                  <button
                    type="button"
                    onClick={() =>
                      setFaqMode("structured")
                    }
                    className={[
                      "px-4 py-2.5 text-sm font-semibold transition",
                      faqMode === "structured"
                        ? "bg-blue-600 text-white dark:bg-blue-500"
                        : "bg-white text-[#6B7C99] hover:bg-[#F4F8FF] dark:bg-[#1E2A3A] dark:text-[#8FA0BC] dark:hover:bg-[#16202E]",
                    ].join(" ")}
                  >
                    Structured FAQ
                  </button>

                  <button
                    type="button"
                    onClick={() => setFaqMode("plain")}
                    className={[
                      "border-l border-[#C5D5EE] px-4 py-2.5 text-sm font-semibold transition dark:border-[#2D3F55]",
                      faqMode === "plain"
                        ? "bg-blue-600 text-white dark:bg-blue-500"
                        : "bg-white text-[#6B7C99] hover:bg-[#F4F8FF] dark:bg-[#1E2A3A] dark:text-[#8FA0BC] dark:hover:bg-[#16202E]",
                    ].join(" ")}
                  >
                    Plain text
                  </button>
                </div>
              }
            />

            {faqMode === "structured" ? (
              <div className="mt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                      FAQ items
                    </p>

                    <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                      Each item requires a question and answer.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddFaqItem}
                    className={PRIMARY_BUTTON_CLASS}
                  >
                    Add FAQ item
                  </button>
                </div>

                {faqItems.length === 0 ? (
                  <div className={`${SUBPANEL_CLASS} mt-4 p-5`}>
                    <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                      No FAQ items yet. Add a question and answer
                      to enable accordion mode on the public FAQ
                      page.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-4">
                    {faqItems.map((item, index) => (
                      <FaqItemEditor
                        key={`faq-item-${index}`}
                        item={item}
                        index={index}
                        onChange={(next) =>
                          handleFaqItemChange(index, next)
                        }
                        onRemove={() =>
                          handleFaqItemRemove(index)
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-6">
                <FieldLabel>Plain FAQ content</FieldLabel>

                <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                  This will render as normal text instead of
                  accordion items.
                </p>

                <textarea
                  value={faqPlainText}
                  onChange={(event) =>
                    setFaqPlainText(event.target.value)
                  }
                  rows={16}
                  className={`mt-3 ${INPUT_CLASS} resize-y`}
                  placeholder="Enter plain FAQ content. This will render as normal text instead of accordion items."
                />
              </div>
            )}
          </section>

          {/* Support */}
          <section className={PANEL_CLASS}>
            <SectionHeader
              eyebrow="Public support"
              title="Support content"
              description="Manage the support content presented to users."
            />

            <div className="mt-6">
              <RichTextEditor
                value={supportContent}
                onChange={setSupportContent}
                placeholder="Enter the Support Content..."
              />
            </div>
          </section>

          {/* Reference data */}
          <section className={PANEL_CLASS}>
            <SectionHeader
              eyebrow="Reference data"
              title="Skills and banks"
              description="Maintain the selectable skills and bank lists used by the application."
            />

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <div className={`${SUBPANEL_CLASS} p-5`}>
                <h4 className="text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Skills list
                </h4>

                <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                  One skill per line.
                </p>

                <textarea
                  value={skillsListText}
                  onChange={(event) =>
                    setSkillsListText(event.target.value)
                  }
                  rows={18}
                  className={`mt-4 ${INPUT_CLASS} resize-y`}
                />
              </div>

              <div className={`${SUBPANEL_CLASS} p-5`}>
                <h4 className="text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Bank list
                </h4>

                <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                  One bank per line.
                </p>

                <textarea
                  value={bankListText}
                  onChange={(event) =>
                    setBankListText(event.target.value)
                  }
                  rows={18}
                  className={`mt-4 ${INPUT_CLASS} resize-y`}
                />
              </div>
            </div>
          </section>

          {/* Notification templates */}
          <section className={PANEL_CLASS}>
            <SectionHeader
              eyebrow="System messaging"
              title="Notification templates"
              description="Manage reusable notification template definitions stored in admin content."
              action={
                <button
                  type="button"
                  onClick={handleAddTemplate}
                  className={SECONDARY_BUTTON_CLASS}
                >
                  Add template
                </button>
              }
            />

            {templates.length === 0 ? (
              <div className={`${SUBPANEL_CLASS} mt-6 p-5`}>
                <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                  No notification templates added yet.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {templates.map((template, index) => (
                  <TemplateEditor
                    key={`${template.key || "template"}-${index}`}
                    template={template}
                    onChange={(next) =>
                      handleTemplateChange(index, next)
                    }
                    onRemove={() =>
                      handleTemplateRemove(index)
                    }
                  />
                ))}
              </div>
            )}
          </section>

          {/* Save */}
          <section
            className={`${PANEL_CLASS} sticky bottom-4 z-20`}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5B8FCC] dark:text-[#7AAEE0]">
                  Publishing
                </p>

                <h3 className="mt-1 text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Save content changes
                </h3>

                <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                  Changes are persisted together when you save.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {message ? (
                  <div
                    className={[
                      "rounded-xl border px-4 py-3 text-sm",
                      message.type === "ok"
                        ? "border-[#B8D9B8] bg-[#F0FAF0] text-[#2E7D32] dark:border-green-700 dark:bg-green-900/20 dark:text-green-200"
                        : "border-[#F2C0BC] bg-[#FFF4F3] text-[#D9534F] dark:border-red-700 dark:bg-red-900/20 dark:text-red-300",
                    ].join(" ")}
                  >
                    {message.text}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className={PRIMARY_BUTTON_CLASS}
                >
                  {updateMutation.isPending
                    ? "Saving..."
                    : "Save content"}
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}