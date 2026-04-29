// src/modules/story/story.model.ts

import mongoose from "mongoose";
import slugify from "slugify";
import { IStory } from "./story.types";

const getStoryModel = () =>
  mongoose.models.Story as mongoose.Model<IStory> | undefined;

const storySchema = new mongoose.Schema<IStory>(
  {
    title: { type: String, required: true },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: { type: String, required: true },

    category: { type: String, default: "FASHION" },

    image: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
      alt: { type: String },
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ✅ AUTO GENERATE SLUG
storySchema.pre("validate", async function () {
  if (this.isModified("title")) {
    const baseSlug = slugify(this.title, {
      lower: true,
      strict: true,
    });

    let slug = baseSlug;
    let count = 1;

    const StoryModel = mongoose.models.Story;

    if (StoryModel) {
      while (await StoryModel.findOne({ slug })) {
        slug = `${baseSlug}-${count++}`;
      }
    }

    this.slug = slug;
  }
});

// ✅ Add index for performance


export const Story = mongoose.model<IStory>("Story", storySchema);


