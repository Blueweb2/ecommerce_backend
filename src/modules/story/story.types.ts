// src/modules/story/story.types.ts

import { Document } from "mongoose";

export interface IStoryImage {
  url: string;
  public_id: string;
  alt?: string;
}

export interface IStorySection {
  layout: "image-left" | "image-right" | "full-image" | "text";
  heading?: string;
  content?: string;
  image?: IStoryImage;
  caption?: string;
  products: import("mongoose").Types.ObjectId[];
  order: number;
}

export interface IStory extends Document {
  title: string;
  slug: string;
  excerpt?: string;
  author?: string;
  publishDate?: Date;
  featured: boolean;
  heroImage: IStoryImage;
  sections: IStorySection[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}