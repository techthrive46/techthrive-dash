// Plans loader: uses Sanity if configured, otherwise falls back to markdown.
// (Docs live in the backend and are edited in-app; see components/docs.)
import { getAllPlans as getAllPlansFromMarkdown, getPlanBySlug as getPlanBySlugFromMarkdown } from "./content";
import { getAllPlans as getAllPlansFromSanity, getPlanBySlug as getPlanBySlugFromSanity } from "./sanity-content";

const useSanity = Boolean(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID &&
  process.env.NEXT_PUBLIC_SANITY_DATASET
);

export async function getAllPlans() {
  if (useSanity) {
    try {
      return await getAllPlansFromSanity();
    } catch (error) {
      console.error("Failed to fetch from Sanity, falling back to markdown:", error);
      return await getAllPlansFromMarkdown();
    }
  }
  return await getAllPlansFromMarkdown();
}

export async function getPlanBySlug(slug: string) {
  if (useSanity) {
    try {
      return await getPlanBySlugFromSanity(slug);
    } catch (error) {
      console.error("Failed to fetch from Sanity, falling back to markdown:", error);
      return await getPlanBySlugFromMarkdown(slug);
    }
  }
  return await getPlanBySlugFromMarkdown(slug);
}
