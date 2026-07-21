// src/modules/story/story.service.ts

import mongoose from "mongoose";
import slugify from "slugify";
import cloudinary from "../../config/cloudinary";
import {
  DEFAULT_STORY_CATEGORY,
  StoryCategory,
} from "../../constants/storyCategories";
import { AppError } from "../../utils/AppError";
import { deleteImageFromCloudinary } from "../cloudinary/cloudinary.service";
import { Story } from "./story.model";
import { IStoryImage } from "./story.types";
import { CreateStoryInput, UpdateStoryInput } from "./story.validation";

export const createStoryService = async (data: CreateStoryInput) => {
  const story = await Story.create(data);
  return story;
};

export interface GetStoriesFilters {
  category?: StoryCategory;
  featured?: boolean;
  isActive?: boolean;
}

const STORY_LIST_SORT = {
  publishDate: -1 as const,
  createdAt: -1 as const,
};

const STORY_NEWEST_SORT = {
  publishDate: -1 as const,
  createdAt: -1 as const,
};

const buildCategoryFilter = (
  category?: StoryCategory
): Record<string, unknown> | undefined => {
  if (!category) {
    return undefined;
  }

  if (category === DEFAULT_STORY_CATEGORY) {
    return {
      $or: [
        { category: DEFAULT_STORY_CATEGORY },
        { category: { $exists: false } },
        { category: null },
      ],
    };
  }

  return { category };
};

const buildStoryFilters = (
  filters: GetStoriesFilters = {}
): Record<string, unknown> => {
  const query: Record<string, unknown> = {};
  const categoryFilter = buildCategoryFilter(filters.category);

  if (categoryFilter) {
    Object.assign(query, categoryFilter);
  }

  if (filters.featured !== undefined) {
    query.featured = filters.featured;
  }

  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }

  return query;
};

export const getStoryBySlugService = async (slug: string) => {
  const story = await Story.findOne({ slug, isActive: true }).populate(
    "sections.products"
  );

  if (!story) {
    throw new Error("Story not found");
  }

  return story;
};

export const getStoriesService = async (
  filters: GetStoriesFilters = {}
) => {
  const stories = await Story.find(buildStoryFilters(filters)).sort(
    STORY_LIST_SORT
  );

  return stories;
};

export const getFeaturedStoryByCategory = async (category: StoryCategory) => {
  const featuredStory = await Story.findOne(
    buildStoryFilters({
      category,
      featured: true,
      isActive: true,
    })
  )
    .sort(STORY_NEWEST_SORT)
    .populate("sections.products");

  return featuredStory;
};

export const getStoriesByCategoryService = async (category: StoryCategory) => {
  const featuredStory = await getFeaturedStoryByCategory(category);
  const baseFilters = buildStoryFilters({
    category,
    isActive: true,
  });

  const stories = await Story.find(
    featuredStory
      ? {
          ...baseFilters,
          _id: { $ne: featuredStory._id },
        }
      : baseFilters
  )
    .sort(STORY_NEWEST_SORT)
    .populate("sections.products");

  return featuredStory ? [featuredStory, ...stories] : stories;
};

export const getRelatedStoriesService = async (
  currentSlug: string,
  category: StoryCategory,
  limit = 3
) => {
  const relatedStories = await Story.find(
    buildStoryFilters({ category, isActive: true }),
    { title: 1, slug: 1, excerpt: 1, heroImage: 1, category: 1, publishDate: 1, createdAt: 1, featured: 1 }
  )
    .sort(STORY_NEWEST_SORT)
    .where("slug")
    .ne(currentSlug)
    .limit(limit);

  return relatedStories;
};

export const deleteStoryService = async (id: string) => {
  const story = await Story.findById(id);

  if (!story) {
    throw new Error("Story not found");
  }

  if (story.heroImage?.public_id) {
    await cloudinary.uploader.destroy(story.heroImage.public_id);
  }

  await story.deleteOne();

  return true;
};

const normalizeStorySlug = (value: string) =>
  slugify(value.trim(), {
    lower: true,
    strict: true,
  });

const ensureUniqueSlug = async (slug: string, storyId: string) => {
  const existingStory = await Story.findOne({
    slug,
    _id: { $ne: storyId },
  }).select("_id");

  if (existingStory) {
    throw new AppError("A story with this slug already exists", 409);
  }
};

const uploadStoryImage = async (
  file: Express.Multer.File,
  alt?: string
): Promise<IStoryImage> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "ecommerce/stories",
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          return reject(
            new AppError(
              error?.message || "Failed to upload story image",
              500
            )
          );
        }

        return resolve({
          url: result.secure_url || result.url,
          public_id: result.public_id,
          alt: alt?.trim() || file.originalname,
        });
      }
    );

    stream.end(file.buffer);
  });
};

export const updateStoryService = async (
  id: string,
  data: UpdateStoryInput,
  file?: Express.Multer.File
) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid story id", 400);
  }

  const story = await Story.findById(id);

  if (!story) {
    throw new AppError("Story not found", 404);
  }

  const previousImage = story.heroImage
    ? {
        url: story.heroImage.url,
        public_id: story.heroImage.public_id,
        alt: story.heroImage.alt,
      }
    : null;

  const hasOwn = <K extends keyof UpdateStoryInput>(key: K) =>
    Object.prototype.hasOwnProperty.call(data, key);

  const nextTitle = hasOwn("title") ? data.title : story.title;
  const nextSlugSource = hasOwn("slug")
    ? data.slug
    : hasOwn("title")
      ? data.title
      : undefined;

  let uploadedImage: IStoryImage | null = null;
  let didPersistStory = false;

  try {
    if (hasOwn("title") && data.title !== undefined) {
      story.title = data.title;
    }

    if (hasOwn("excerpt") && data.excerpt !== undefined) {
      story.excerpt = data.excerpt;
    }

    if (hasOwn("category") && data.category !== undefined) {
      story.category = data.category;
    }

    if (hasOwn("author") && data.author !== undefined) {
      story.author = data.author;
    }

    if (hasOwn("publishDate") && data.publishDate !== undefined) {
      story.publishDate = data.publishDate ? new Date(data.publishDate) : undefined;
    }

    if (hasOwn("featured") && data.featured !== undefined) {
      story.featured = data.featured;
    }

    if (hasOwn("sections") && data.sections !== undefined) {
      story.sections = data.sections as any;
    }

    if (hasOwn("isActive") && data.isActive !== undefined) {
      story.isActive = data.isActive;
    }

    if (nextSlugSource !== undefined) {
      const normalizedSlug = normalizeStorySlug(nextSlugSource);

      if (!normalizedSlug) {
        throw new AppError("Slug cannot be empty", 400);
      }

      await ensureUniqueSlug(normalizedSlug, id);
      story.slug = normalizedSlug;
    }

    if (file) {
      uploadedImage = await uploadStoryImage(
        file,
        data.imageAlt || nextTitle || previousImage?.alt
      );
      story.heroImage = uploadedImage;
    } else if (hasOwn("imageAlt")) {
      story.heroImage.alt =
        data.imageAlt?.trim() || previousImage?.alt || story.title;
    }

    await story.save();
    didPersistStory = true;

    if (
      file &&
      previousImage?.public_id &&
      previousImage.public_id !== story.heroImage.public_id
    ) {
      try {
        await deleteImageFromCloudinary(previousImage.public_id);
      } catch (_error) {
        if (uploadedImage?.public_id) {
          await deleteImageFromCloudinary(uploadedImage.public_id).catch(
            () => undefined
          );
        }

        story.heroImage = previousImage as IStoryImage;
        await story.save();

        throw new AppError("Failed to replace story image", 500);
      }
    }

    return story;
  } catch (error: any) {
    if (uploadedImage?.public_id && !didPersistStory) {
      await deleteImageFromCloudinary(uploadedImage.public_id).catch(
        () => undefined
      );
    }

    if (error?.code === 11000 && error?.keyPattern?.slug) {
      throw new AppError("A story with this slug already exists", 409);
    }

    if (error instanceof AppError) {
      throw error;
    }

    if (error?.name === "ValidationError") {
      throw new AppError(error.message || "Failed to update story", 400);
    }

    throw new AppError(error?.message || "Failed to update story", 500);
  }
};
