// src/modules/story/story.model.ts

import mongoose from "mongoose";
import slugify from "slugify";
import { IStory } from "./story.types";

const storySectionSchema = new mongoose.Schema({
  layout: {
    type: String,
    enum: ["image-left", "image-right", "full-image", "text"],
    required: true,
  },
  heading: { type: String },
  content: { type: String },
  image: {
    url: { type: String },
    public_id: { type: String },
    alt: { type: String },
  },
  caption: { type: String },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  order: { type: Number, required: true, default: 0 },
});

const storySchema = new mongoose.Schema<IStory>(
  {
    title: { type: String, required: true },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    excerpt: { type: String },
    author: { type: String },
    publishDate: { type: Date },
    featured: { type: Boolean, default: false },
    heroImage: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
      alt: { type: String },
    },
    sections: [storySectionSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

storySchema.pre("validate", async function () {
  if (!this.isNew || !this.isModified("title") || this.isModified("slug")) {
    return;
  }

  const baseSlug = slugify(this.title, {
    lower: true,
    strict: true,
  });

  let slug = baseSlug;
  let count = 1;
  const StoryModel = mongoose.models.Story;

  if (StoryModel) {
    while (await StoryModel.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${count++}`;
    }
  }

  this.slug = slug;
});

export const Story = mongoose.model<IStory>("Story", storySchema);
