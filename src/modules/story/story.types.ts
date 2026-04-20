// src/modules/story/story.types.ts

import { Document } from "mongoose";

export interface IStoryImage {
  url: string;
  public_id: string;
  alt?: string;
}

export interface IStory extends Document {
  title: string;
  slug: string;
  description: string;
  category: string;

  image: IStoryImage;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}