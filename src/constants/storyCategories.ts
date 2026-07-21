export const STORY_CATEGORIES = [
  "fashion",
  "beauty",
  "jewelry-watches",
  "reporter",
  "cover-stories",
  "incredible-women",
  "lifestyle",
  "video",
] as const;

export type StoryCategory = (typeof STORY_CATEGORIES)[number];

export const DEFAULT_STORY_CATEGORY: StoryCategory = STORY_CATEGORIES[0];
