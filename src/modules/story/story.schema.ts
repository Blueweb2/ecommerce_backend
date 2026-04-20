// src/modules/story/story.schema.ts

import mongoose, { Schema } from "mongoose";
import slugify from "slugify";
import { IStory } from "./story.types";

const getStoryModel = () =>
  mongoose.models.Story as mongoose.Model<IStory> | undefined;

const storySchema = new Schema<IStory>(
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



// Auto-generate slug (IMPORTANT)

storySchema.pre("validate", async function () {
  if (this.title) {
    const baseSlug = slugify(this.title, { lower: true, strict: true });
    let slug = baseSlug;
    let count = 1;

    const Story = getStoryModel();

    if (Story) {
      while (await Story.findOne({ slug })) {
        slug = `${baseSlug}-${count++}`;
      }
    }

    this.slug = slug;
  }
});



export const Story = mongoose.model<IStory>("Story", storySchema);
