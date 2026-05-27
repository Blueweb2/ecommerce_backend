import { PromoCode } from "./promo.model";
import { CreatePromoDTO, UpdatePromoDTO } from "./promo.types";
import { AppError } from "../../utils/AppError";

import { User } from "../user/user.model";
import { sendEmail } from "../../utils/sendEmail";
import { env } from "../../config/env";

export const createPromo = async (data: CreatePromoDTO) => {
  const existing = await PromoCode.findOne({
    code: data.code.toUpperCase(),
  });

  if (existing) {
    throw new AppError("Promo code already exists", 400);
  }

  return await PromoCode.create(data);
};

export const updatePromo = async (id: string, data: UpdatePromoDTO) => {
  const promo = await PromoCode.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!promo) {
    throw new AppError("Promo code not found", 404);
  }

  return promo;
};

export const getAllPromos = async () => {
  return await PromoCode.find().sort({ createdAt: -1 });
};

export const getPromoById = async (id: string) => {
  const promo = await PromoCode.findById(id);

  if (!promo) {
    throw new AppError("Promo code not found", 404);
  }

  return promo;
};

export const deletePromo = async (id: string) => {
  const promo = await PromoCode.findByIdAndDelete(id);

  if (!promo) {
    throw new AppError("Promo code not found", 404);
  }

  return promo;
};

export const validatePromoCode = async (
  code: string,
  subtotal: number
) => {
  const promo = await PromoCode.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });

  if (!promo) {
    throw new AppError("Invalid or inactive promo code", 400);
  }

  // Expiry Check
  if (new Date() > promo.expiresAt) {
    throw new AppError("Promo code has expired", 400);
  }

  // Usage Limit Check
  if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
    throw new AppError("Promo code usage limit reached", 400);
  }

  // Minimum Order Check
  if (subtotal < promo.minOrderValue) {
    throw new AppError(
      `Minimum order value of ₹${promo.minOrderValue} required`,
      400
    );
  }

  // Discount Calculation
  let discountAmount = 0;

  if (promo.type === "percentage") {
    discountAmount = (subtotal * promo.value) / 100;

    if (promo.maxDiscount && discountAmount > promo.maxDiscount) {
      discountAmount = promo.maxDiscount;
    }
  } else {
    discountAmount = promo.value;
  }

  discountAmount = Math.min(discountAmount, subtotal);

  return {
    promoId: promo._id,
    code: promo.code,
    discountAmount,
    type: promo.type,
    value: promo.value,
  };
};

export const incrementPromoUsage = async (id: string) => {
  await PromoCode.findByIdAndUpdate(id, {
    $inc: {
      usedCount: 1,
    },
  });
};

export const sendPromoMail = async (id: string) => {
  const promo = await PromoCode.findById(id);

  if (!promo) {
    throw new AppError("Promo not found", 404);
  }

  const users = await User.find({
    isActive: true,
  }).select("name email");

  for (const user of users) {
   await sendEmail(
  user.email,
  `Exclusive Offer — ${promo.code}`,
  `
    <div style="font-family:sans-serif;padding:40px">
      <h1>${promo.code}</h1>

      <p>Hello ${user.name || "Customer"},</p>

      <p>
        Enjoy ${
          promo.type === "percentage"
            ? `${promo.value}% OFF`
            : `₹${promo.value} OFF`
        }
      </p>

      <p>
        Valid till:
        ${new Date(promo.expiresAt).toLocaleDateString()}
      </p>

      <a
        href="${env.CLIENT_URL}"
        style="
          display:inline-block;
          padding:14px 24px;
          background:black;
          color:white;
          text-decoration:none;
          margin-top:20px;
        "
      >
        Shop Now
      </a>
    </div>
  `
);
  }

  return true;
};