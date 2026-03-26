export interface CategoryImageDTO {
  url: string;
  altText?: string;
}

export interface CreateCategoryDTO {
  name: string;
  description?: string;
  image?: CategoryImageDTO;
  isActive?: boolean;
}

export interface UpdateCategoryDTO extends Partial<CreateCategoryDTO> {}

export interface CategoryResponse extends CreateCategoryDTO {
  _id: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}
