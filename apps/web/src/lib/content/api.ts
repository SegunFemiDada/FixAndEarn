const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

type PublicFaqItem = {
  question: string;
  answer: string;
  youtubeUrl?: string | null;
};

export type PublicTextContentResponse = {
  title: string;
  content: string;
};

export type PublicFaqResponse = {
  title: string;
  mode: "structured" | "plain";
  rawContent: string;
  items: PublicFaqItem[];
};

export type PublicSkillsResponse = {
  skills: string[];
};

const PUBLIC_CONTENT_REVALIDATE_SECONDS = 300;

export async function getPublicTextContent(
  kind: "terms" | "privacy" | "support"
): Promise<PublicTextContentResponse> {
  if (!API_BASE_URL) {
    return {
      title:
        kind === "terms"
          ? "User Agreement"
          : kind === "privacy"
            ? "Privacy Policy"
            : "Support",
      content: "",
    };
  }

  const response = await fetch(`${API_BASE_URL}/content/${kind}`, {
    method: "GET",
    next: {
      revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load public content: ${kind}`);
  }

  return response.json();
}

export async function getPublicFaq(): Promise<PublicFaqResponse> {
  if (!API_BASE_URL) {
    return {
      title: "FAQ",
      mode: "plain",
      rawContent: "",
      items: [],
    };
  }

  const response = await fetch(`${API_BASE_URL}/content/faq`, {
    method: "GET",
    next: {
      revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load FAQ content");
  }

  return response.json();
}

export async function getPublicSkills(): Promise<PublicSkillsResponse> {
  if (!API_BASE_URL) {
    return {
      skills: [],
    };
  }

  const response = await fetch(`${API_BASE_URL}/content/skills`, {
    method: "GET",
    next: {
      revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load public skills");
  }

  return response.json();
}