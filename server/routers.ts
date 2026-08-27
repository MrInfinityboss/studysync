import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { validateSessionDraft } from "./studyRules";

const sessionInput = z.object({
  title: z.string().min(1).max(160),
  subject: z.string().min(1).max(80),
  description: z.string().min(1).max(5000),
  startsAt: z.number().int().positive(),
  endsAt: z.number().int().positive(),
  location: z.string().max(255).optional().nullable(),
  onlineLink: z.string().url().max(500).optional().or(z.literal("")).nullable(),
  format: z.enum(["in_person", "online", "hybrid"]),
  capacity: z.number().int().min(2).max(40),
  status: z.enum(["draft", "published"]),
  tags: z.array(z.string().min(1).max(48)).max(6),
});

function assertValidSession(input: z.infer<typeof sessionInput>) {
  const errors = validateSessionDraft(input);
  if (errors.length) throw new TRPCError({ code: "BAD_REQUEST", message: errors[0] });
}

function databaseError(error: unknown): never {
  const message = error instanceof Error ? error.message : "The request could not be completed.";
  throw new TRPCError({ code: "BAD_REQUEST", message });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  profile: router({
    get: protectedProcedure.query(({ ctx }) => db.getProfile(ctx.user.id)),
    update: protectedProcedure.input(z.object({
      displayName: z.string().min(2).max(80),
      bio: z.string().max(500).optional(),
      timezone: z.string().min(2).max(64),
      studyInterests: z.string().max(500).optional(),
    })).mutation(({ ctx, input }) => db.updateProfile(ctx.user.id, input)),
  }),
  dashboard: router({
    get: protectedProcedure.query(({ ctx }) => db.getDashboard(ctx.user.id)),
  }),
  sessions: router({
    list: protectedProcedure.input(z.object({
      query: z.string().max(100).optional(),
      subject: z.string().max(80).optional(),
      location: z.string().max(120).optional(),
      format: z.enum(["in_person", "online", "hybrid"]).optional(),
      availableOnly: z.boolean().optional(),
      from: z.number().int().positive().optional(),
      to: z.number().int().positive().optional(),
    })).query(({ input }) => db.listStudySessions(input)),
    detail: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ ctx, input }) => db.getSessionDetail(input.id, ctx.user.id)),
    create: protectedProcedure.input(sessionInput).mutation(async ({ ctx, input }) => {
      assertValidSession(input);
      try { return { id: await db.createStudySession(ctx.user.id, input) }; } catch (error) { return databaseError(error); }
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: sessionInput })).mutation(async ({ ctx, input }) => {
      assertValidSession(input.data);
      try { await db.updateStudySession(input.id, ctx.user.id, input.data); return { success: true }; } catch (error) { return databaseError(error); }
    }),
    cancel: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      try { await db.cancelStudySession(input.id, ctx.user.id); return { success: true }; } catch (error) { return databaseError(error); }
    }),
    enroll: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      try { return await db.enrollInStudySession(input.id, ctx.user.id); } catch (error) { return databaseError(error); }
    }),
    leave: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      try { return await db.cancelEnrollment(input.id, ctx.user.id); } catch (error) { return databaseError(error); }
    }),
  }),
});

export type AppRouter = typeof appRouter;
