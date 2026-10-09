import { PortableTextBlock } from "sanity";

export interface SanityPlan {
  _id: string;
  _type: "plan";
  title: string;
  slug: { current: string };
  status: "draft" | "planned" | "active" | "completed";
  summary?: string;
  publishedAt: string;
  body: PortableTextBlock[];
}
