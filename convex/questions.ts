import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a question for a client
export const createQuestion = mutation({
  args: {
    trainerId: v.string(),
    clientId: v.string(),
    question: v.string(),
  },
  handler: async (ctx, args) => {
    const questionId = await ctx.db.insert("clientQuestions", {
      trainerId: args.trainerId,
      clientId: args.clientId,
      question: args.question,
      createdAt: Date.now(),
    });
    return questionId;
  },
});

// Get questions for a specific client (trainer view)
export const getClientQuestions = query({
  args: {
    trainerId: v.string(),
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clientQuestions")
      .withIndex("by_trainer_client", (q) =>
        q.eq("trainerId", args.trainerId).eq("clientId", args.clientId)
      )
      .order("desc")
      .collect();
  },
});

// Get all questions for a client (client view - from all trainers)
export const getQuestionsForClient = query({
  args: {
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clientQuestions")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .collect();
  },
});

// Get unanswered questions count for a client
export const getUnansweredQuestionsCount = query({
  args: {
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("clientQuestions")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    return questions.filter((q) => !q.answer).length;
  },
});

// Answer a question (client)
export const answerQuestion = mutation({
  args: {
    questionId: v.id("clientQuestions"),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.questionId, {
      answer: args.answer,
      answeredAt: Date.now(),
    });
  },
});

// Delete a question (trainer)
export const deleteQuestion = mutation({
  args: {
    questionId: v.id("clientQuestions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.questionId);
  },
});

// Update a question (trainer)
export const updateQuestion = mutation({
  args: {
    questionId: v.id("clientQuestions"),
    question: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.questionId, {
      question: args.question,
    });
  },
});

// Create a question with answer (for offline meetings - trainer fills both)
export const createQuestionWithAnswer = mutation({
  args: {
    trainerId: v.string(),
    clientId: v.string(),
    question: v.string(),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    const questionId = await ctx.db.insert("clientQuestions", {
      trainerId: args.trainerId,
      clientId: args.clientId,
      question: args.question,
      answer: args.answer,
      answeredAt: Date.now(),
      createdAt: Date.now(),
    });
    return questionId;
  },
});

// Update question and answer (trainer - for offline meeting notes)
export const updateQuestionWithAnswer = mutation({
  args: {
    questionId: v.id("clientQuestions"),
    question: v.string(),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.questionId, {
      question: args.question,
      answer: args.answer,
      answeredAt: Date.now(),
    });
  },
});

// Get a single question by ID
export const getQuestionById = query({
  args: {
    questionId: v.id("clientQuestions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.questionId);
  },
});
