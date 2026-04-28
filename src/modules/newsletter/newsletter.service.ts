import { NewsletterSubscriber } from "./newsletter.model";
import { AppError } from "../../utils/AppError";
import { sendEmail } from "../../utils/sendEmail";

export const subscribe = async (email: string) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    throw new AppError("Invalid email address", 400);
  }

  const existing = await NewsletterSubscriber.findOne({ email: normalizedEmail });

  if (existing) {
    if (existing.isActive) {
      throw new AppError("You are already subscribed!", 400);
    } else {
      // Re-activate if they were unsubscribed
      existing.isActive = true;
      return await existing.save();
    }
  }

  return await NewsletterSubscriber.create({ email: normalizedEmail });
};

export const sendOfferToSubscribers = async (subject: string, content: string) => {
  const subscribers = await NewsletterSubscriber.find({ isActive: true });

  if (!subscribers.length) {
    throw new AppError("No active subscribers found", 404);
  }

  // ✅ Implement batching to avoid SMTP rate limits
  const BATCH_SIZE = 10;
  const DELAY_MS = 1000; // 1 second between batches

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);
    
    await Promise.all(
      batch.map((sub) =>
        sendEmail(sub.email, subject, content).catch((err) => {
          console.error(`Failed to send email to ${sub.email}:`, err);
          return null;
        })
      )
    );

    // Wait if there are more batches
    if (i + BATCH_SIZE < subscribers.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  return { total: subscribers.length };
};

export const getNewsletterStats = async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [total, active, newSubscribers] = await Promise.all([
    NewsletterSubscriber.countDocuments(),
    NewsletterSubscriber.countDocuments({ isActive: true }),
    NewsletterSubscriber.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
  ]);

  return {
    total,
    active,
    newSubscribers,
  };
};

export const getAllSubscribers = async (page = 1, limit = 10, search = "") => {
  const query: any = {};
  if (search) {
    query.email = { $regex: search, $options: "i" };
  }

  const skip = (page - 1) * limit;

  const [subscribers, total] = await Promise.all([
    NewsletterSubscriber.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    NewsletterSubscriber.countDocuments(query),
  ]);

  return {
    subscribers,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};
