import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a FAQ question template
export const createFaq = mutation({
  args: {
    trainerId: v.string(),
    question: v.string(),
  },
  handler: async (ctx, args) => {
    const existingFaqs = await ctx.db
      .query("faqQuestions")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .collect();

    const faqId = await ctx.db.insert("faqQuestions", {
      trainerId: args.trainerId,
      question: args.question,
      isActive: true,
      order: existingFaqs.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return faqId;
  },
});

// Get all FAQ questions for a trainer
export const getTrainerFaqs = query({
  args: {
    trainerId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("faqQuestions")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .collect();
  },
});

// Get active FAQ questions for a trainer
export const getActiveFaqs = query({
  args: {
    trainerId: v.string(),
  },
  handler: async (ctx, args) => {
    const faqs = await ctx.db
      .query("faqQuestions")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .collect();
    return faqs.filter((f) => f.isActive).sort((a, b) => (a.order || 0) - (b.order || 0));
  },
});

// Update a FAQ question
export const updateFaq = mutation({
  args: {
    faqId: v.id("faqQuestions"),
    question: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.faqId, {
      question: args.question,
      updatedAt: Date.now(),
    });
  },
});

// Toggle FAQ active status
export const toggleFaqActive = mutation({
  args: {
    faqId: v.id("faqQuestions"),
  },
  handler: async (ctx, args) => {
    const faq = await ctx.db.get(args.faqId);
    if (!faq) throw new Error("FAQ not found");
    
    await ctx.db.patch(args.faqId, {
      isActive: !faq.isActive,
      updatedAt: Date.now(),
    });
  },
});

// Delete a FAQ question
export const deleteFaq = mutation({
  args: {
    faqId: v.id("faqQuestions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.faqId);
  },
});

// Bulk create client questions from FAQs with answers
export const createClientQuestionsFromFaqs = mutation({
  args: {
    trainerId: v.string(),
    clientId: v.string(),
    questionsWithAnswers: v.array(
      v.object({
        question: v.string(),
        answer: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const questionIds = [];
    for (const qa of args.questionsWithAnswers) {
      const questionId = await ctx.db.insert("clientQuestions", {
        trainerId: args.trainerId,
        clientId: args.clientId,
        question: qa.question,
        answer: qa.answer || undefined,
        answeredAt: qa.answer ? Date.now() : undefined,
        createdAt: Date.now(),
      });
      questionIds.push(questionId);
    }
    return questionIds;
  },
});
