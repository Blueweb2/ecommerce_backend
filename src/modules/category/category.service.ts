import { Category } from "./category.model";
import { AppError } from "../../utils/AppError";

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

export const createCategory = async (data: any) => {
  const slug = generateSlug(data.name);

  const existingCategory = await Category.findOne({ slug });
  if (existingCategory) {
    throw new AppError("Category already exists", 409);
  }

  return await Category.create({ ...data, slug });
};

export const getAllCategories = async () => {
  return await Category.find({ isActive: true }).sort({ name: 1 });
};

export const getCategoryById = async (id: string) => {
  return await Category.findById(id);
};

export const getCategoryBySlug = async (slug: string) => {
  return await Category.findOne({ slug });
};

export const updateCategory = async (id: string, data: any) => {
  return await Category.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

export const deleteCategory = async (id: string) => {
  return await Category.findByIdAndDelete(id);
};
