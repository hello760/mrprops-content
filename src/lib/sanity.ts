import { createClient } from "next-sanity";

export const sanityConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "oz1kchg8",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: process.env.NODE_ENV === "production",
};

export const sanityClient = createClient(sanityConfig);

export async function sanityFetch<T>(
  query: string,
  params?: Record<string, unknown>
): Promise<T> {
  return sanityClient.fetch<T>(query, params || {});
}
