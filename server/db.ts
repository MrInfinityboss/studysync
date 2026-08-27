import { and, asc, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  auditEvents,
  authIdentities,
  enrollments,
  InsertUser,
  notifications,
  profiles,
  sessionTags,
  studySessions,
  tags,
  users,
  waitlistEntries,
} from "../drizzle/schema";
import { enrollmentOutcome } from "./studyRules";
import { decideGoogleIdentityLink } from "./googleOAuth";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

function requireDb(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db) throw new Error("StudySync database is unavailable.");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  (['name', 'email', 'loginMethod'] as const).forEach((field) => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByExternalIdentity(provider: string, providerSubject: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({ user: users }).from(authIdentities).innerJoin(users, eq(authIdentities.userId, users.id)).where(and(eq(authIdentities.provider, provider), eq(authIdentities.providerSubject, providerSubject))).limit(1);
  return result[0]?.user;
}

export async function createOrLinkGoogleIdentity(identity: { sub: string; email: string; name?: string; picture?: string }) {
  const db = requireDb(await getDb());
  const existing = await getUserByExternalIdentity("google", identity.sub);
  const emailMatch = existing ? [] : await db.select().from(users).where(eq(users.email, identity.email)).limit(1);
  const decision = decideGoogleIdentityLink({ hasProviderIdentity: Boolean(existing), hasEmailMatch: Boolean(emailMatch[0]) });
  if (decision === "existing_identity" && existing) {
    await db.update(users).set({ name: identity.name || existing.name, email: identity.email, loginMethod: "google", lastSignedIn: new Date() }).where(eq(users.id, existing.id));
    return (await getUserByExternalIdentity("google", identity.sub))!;
  }

  if (decision === "create_google_user") {
    await upsertUser({ openId: `google:${identity.sub}`, name: identity.name || null, email: identity.email, loginMethod: "google", lastSignedIn: new Date() });
  }
  const linkedUser = emailMatch[0] ?? await getUserByOpenId(`google:${identity.sub}`);
  if (!linkedUser) throw new Error("Google identity could not be linked to a StudySync account.");
  await db.insert(authIdentities).values({ userId: linkedUser.id, provider: "google", providerSubject: identity.sub, email: identity.email }).onDuplicateKeyUpdate({ set: { userId: linkedUser.id, email: identity.email } });
  await db.update(users).set({ name: identity.name || linkedUser.name, email: identity.email, loginMethod: "google", lastSignedIn: new Date() }).where(eq(users.id, linkedUser.id));
  return (await getUserByExternalIdentity("google", identity.sub))!;
}

export async function getProfile(userId: number) {
  const db = requireDb(await getDb());
  const rows = await db.select({
    name: users.name,
    email: users.email,
    displayName: profiles.displayName,
    bio: profiles.bio,
    timezone: profiles.timezone,
    studyInterests: profiles.studyInterests,
    avatarUrl: profiles.avatarUrl,
  }).from(users).leftJoin(profiles, eq(users.id, profiles.userId)).where(eq(users.id, userId)).limit(1);
  return rows[0];
}

export async function updateProfile(userId: number, input: { displayName: string; bio?: string; timezone: string; studyInterests?: string }) {
  const db = requireDb(await getDb());
  await db.insert(profiles).values({
    userId,
    displayName: input.displayName,
    bio: input.bio ?? null,
    timezone: input.timezone,
    studyInterests: input.studyInterests ?? null,
  }).onDuplicateKeyUpdate({ set: {
    displayName: input.displayName,
    bio: input.bio ?? null,
    timezone: input.timezone,
    studyInterests: input.studyInterests ?? null,
  } });
  return getProfile(userId);
}

type SessionInput = {
  title: string;
  subject: string;
  description: string;
  startsAt: number;
  endsAt: number;
  location?: string | null;
  onlineLink?: string | null;
  format: "in_person" | "online" | "hybrid";
  capacity: number;
  status: "draft" | "published";
  tags: string[];
};

async function replaceSessionTags(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, sessionId: number, tagNames: string[]) {
  const cleanTags = Array.from(new Set(tagNames.map((tag) => tag.trim().toLowerCase()).filter(Boolean))).slice(0, 6);
  await db.delete(sessionTags).where(eq(sessionTags.sessionId, sessionId));
  for (const name of cleanTags) {
    await db.insert(tags).values({ name }).onDuplicateKeyUpdate({ set: { name } });
    const tagRow = await db.select({ id: tags.id }).from(tags).where(eq(tags.name, name)).limit(1);
    if (tagRow[0]) await db.insert(sessionTags).values({ sessionId, tagId: tagRow[0].id }).onDuplicateKeyUpdate({ set: { tagId: tagRow[0].id } });
  }
}

export async function createStudySession(hostId: number, input: SessionInput) {
  const db = requireDb(await getDb());
  const result = await db.insert(studySessions).values({
    hostId,
    title: input.title.trim(),
    subject: input.subject.trim(),
    description: input.description.trim(),
    startsAt: new Date(input.startsAt),
    endsAt: new Date(input.endsAt),
    location: input.location?.trim() || null,
    onlineLink: input.onlineLink?.trim() || null,
    format: input.format,
    capacity: input.capacity,
    status: input.status,
  });
  const sessionId = Number(result[0].insertId);
  await replaceSessionTags(db, sessionId, input.tags);
  await db.insert(auditEvents).values({ actorId: hostId, sessionId, eventType: "session_created" });
  return sessionId;
}

export async function updateStudySession(sessionId: number, hostId: number, input: SessionInput) {
  const db = requireDb(await getDb());
  const current = await db.select({ seatsTaken: studySessions.seatsTaken }).from(studySessions).where(and(eq(studySessions.id, sessionId), eq(studySessions.hostId, hostId))).limit(1);
  if (!current[0]) throw new Error("Only the host may update this session.");
  if (input.capacity < current[0].seatsTaken) {
    throw new Error("Capacity cannot be lower than the number of confirmed participants.");
  }
  const result = await db.update(studySessions).set({
    title: input.title.trim(), subject: input.subject.trim(), description: input.description.trim(),
    startsAt: new Date(input.startsAt), endsAt: new Date(input.endsAt),
    location: input.location?.trim() || null, onlineLink: input.onlineLink?.trim() || null,
    format: input.format, capacity: input.capacity, status: input.status,
  }).where(and(eq(studySessions.id, sessionId), eq(studySessions.hostId, hostId)));
  if (Number(result[0].affectedRows) === 0) throw new Error("Only the host may update this session.");
  await replaceSessionTags(db, sessionId, input.tags);
  await db.insert(auditEvents).values({ actorId: hostId, sessionId, eventType: "session_updated" });
}

export async function cancelStudySession(sessionId: number, hostId: number) {
  const db = requireDb(await getDb());
  const result = await db.update(studySessions).set({ status: "cancelled" }).where(and(eq(studySessions.id, sessionId), eq(studySessions.hostId, hostId)));
  if (Number(result[0].affectedRows) === 0) throw new Error("Only the host may cancel this session.");
  await db.insert(auditEvents).values({ actorId: hostId, sessionId, eventType: "session_cancelled" });
}

export async function listStudySessions(input: { query?: string; subject?: string; location?: string; format?: "in_person" | "online" | "hybrid"; availableOnly?: boolean; from?: number; to?: number }) {
  const db = requireDb(await getDb());
  const conditions = [eq(studySessions.status, "published"), gte(studySessions.startsAt, new Date())];
  if (input.query?.trim()) {
    const term = `%${input.query.trim()}%`;
    conditions.push(or(like(studySessions.title, term), like(studySessions.subject, term), like(studySessions.description, term))!);
  }
  if (input.subject) conditions.push(eq(studySessions.subject, input.subject));
  if (input.location?.trim()) conditions.push(like(studySessions.location, `%${input.location.trim()}%`));
  if (input.format) conditions.push(eq(studySessions.format, input.format));
  if (input.availableOnly) conditions.push(sql`${studySessions.seatsTaken} < ${studySessions.capacity}`);
  if (input.from) conditions.push(gte(studySessions.startsAt, new Date(input.from)));
  if (input.to) conditions.push(lte(studySessions.startsAt, new Date(input.to)));
  return db.select({
    id: studySessions.id, title: studySessions.title, subject: studySessions.subject, description: studySessions.description,
    startsAt: studySessions.startsAt, endsAt: studySessions.endsAt, location: studySessions.location, onlineLink: studySessions.onlineLink,
    format: studySessions.format, capacity: studySessions.capacity, seatsTaken: studySessions.seatsTaken, hostName: profiles.displayName,
  }).from(studySessions).leftJoin(profiles, eq(studySessions.hostId, profiles.userId)).where(and(...conditions)).orderBy(asc(studySessions.startsAt));
}

export async function getSessionDetail(sessionId: number, viewerId: number) {
  const db = requireDb(await getDb());
  const sessionRows = await db.select({
    id: studySessions.id, hostId: studySessions.hostId, title: studySessions.title, subject: studySessions.subject,
    description: studySessions.description, startsAt: studySessions.startsAt, endsAt: studySessions.endsAt,
    location: studySessions.location, onlineLink: studySessions.onlineLink, format: studySessions.format,
    capacity: studySessions.capacity, seatsTaken: studySessions.seatsTaken, status: studySessions.status,
    hostName: profiles.displayName, hostBio: profiles.bio,
  }).from(studySessions).leftJoin(profiles, eq(studySessions.hostId, profiles.userId)).where(eq(studySessions.id, sessionId)).limit(1);
  const session = sessionRows[0];
  if (!session) return null;
  const tagRows = await db.select({ name: tags.name }).from(sessionTags).innerJoin(tags, eq(sessionTags.tagId, tags.id)).where(eq(sessionTags.sessionId, sessionId));
  const activeEnrollment = await db.select({ id: enrollments.id }).from(enrollments).where(and(eq(enrollments.sessionId, sessionId), eq(enrollments.userId, viewerId), eq(enrollments.status, "active"))).limit(1);
  const waiting = await db.select({ position: waitlistEntries.position }).from(waitlistEntries).where(and(eq(waitlistEntries.sessionId, sessionId), eq(waitlistEntries.userId, viewerId), eq(waitlistEntries.status, "waiting"))).limit(1);
  const participants = session.hostId === viewerId ? await db.select({
    id: enrollments.id, status: enrollments.status, joinedAt: enrollments.joinedAt, name: profiles.displayName,
  }).from(enrollments).leftJoin(profiles, eq(enrollments.userId, profiles.userId)).where(eq(enrollments.sessionId, sessionId)).orderBy(desc(enrollments.joinedAt)) : [];
  const waitlist = session.hostId === viewerId ? await db.select({
    id: waitlistEntries.id, status: waitlistEntries.status, position: waitlistEntries.position, createdAt: waitlistEntries.createdAt, name: profiles.displayName,
  }).from(waitlistEntries).leftJoin(profiles, eq(waitlistEntries.userId, profiles.userId)).where(eq(waitlistEntries.sessionId, sessionId)).orderBy(asc(waitlistEntries.position)) : [];
  return { ...session, tags: tagRows.map((tag) => tag.name), userState: activeEnrollment[0] ? "joined" : waiting[0] ? "waitlisted" : "none", waitlistPosition: waiting[0]?.position ?? null, participants, waitlist };
}

export async function enrollInStudySession(sessionId: number, userId: number) {
  const db = requireDb(await getDb());
  return db.transaction(async (tx) => {
    const raw = await tx.execute(sql`SELECT id, hostId, capacity, seatsTaken, status FROM studySessions WHERE id = ${sessionId} FOR UPDATE`) as unknown as [Array<{ id: number; hostId: number; capacity: number; seatsTaken: number; status: string }>, unknown];
    const session = raw[0][0];
    if (!session || session.status !== "published") throw new Error("This session is not available for enrollment.");
    if (session.hostId === userId) throw new Error("Hosts cannot join their own session as a participant.");
    const existingActive = await tx.select({ id: enrollments.id }).from(enrollments).where(and(eq(enrollments.sessionId, sessionId), eq(enrollments.userId, userId), eq(enrollments.status, "active"))).limit(1);
    const existingWaitlist = await tx.select({ id: waitlistEntries.id }).from(waitlistEntries).where(and(eq(waitlistEntries.sessionId, sessionId), eq(waitlistEntries.userId, userId), eq(waitlistEntries.status, "waiting"))).limit(1);
    const outcome = enrollmentOutcome({ capacity: session.capacity, seatsTaken: session.seatsTaken, isAlreadyActive: Boolean(existingActive[0]), isAlreadyWaitlisted: Boolean(existingWaitlist[0]) });
    if (outcome === "already_joined") return { status: outcome, seatsRemaining: Math.max(session.capacity - session.seatsTaken, 0) };
    if (outcome === "already_waitlisted") return { status: outcome, seatsRemaining: 0 };
    if (outcome === "joined") {
      await tx.insert(enrollments).values({ sessionId, userId, status: "active" });
      await tx.update(studySessions).set({ seatsTaken: session.seatsTaken + 1 }).where(eq(studySessions.id, sessionId));
      await tx.insert(notifications).values({ userId, sessionId, type: "joined", message: "You are confirmed for this study session." });
      return { status: "joined" as const, seatsRemaining: session.capacity - session.seatsTaken - 1 };
    }
    const maxPosition = await tx.select({ value: sql<number>`coalesce(max(${waitlistEntries.position}), 0)` }).from(waitlistEntries).where(eq(waitlistEntries.sessionId, sessionId));
    const position = Number(maxPosition[0]?.value ?? 0) + 1;
    await tx.insert(waitlistEntries).values({ sessionId, userId, position, status: "waiting" });
    await tx.insert(notifications).values({ userId, sessionId, type: "waitlisted", message: `You are number ${position} on the waitlist.` });
    return { status: "waitlisted" as const, position, seatsRemaining: 0 };
  });
}

export async function cancelEnrollment(sessionId: number, userId: number) {
  const db = requireDb(await getDb());
  return db.transaction(async (tx) => {
    const raw = await tx.execute(sql`SELECT id, capacity, seatsTaken FROM studySessions WHERE id = ${sessionId} FOR UPDATE`) as unknown as [Array<{ id: number; capacity: number; seatsTaken: number }>, unknown];
    const session = raw[0][0];
    if (!session) throw new Error("Session not found.");
    const active = await tx.select({ id: enrollments.id }).from(enrollments).where(and(eq(enrollments.sessionId, sessionId), eq(enrollments.userId, userId), eq(enrollments.status, "active"))).limit(1);
    if (!active[0]) {
      const waiting = await tx.select({ id: waitlistEntries.id }).from(waitlistEntries).where(and(eq(waitlistEntries.sessionId, sessionId), eq(waitlistEntries.userId, userId), eq(waitlistEntries.status, "waiting"))).limit(1);
      if (!waiting[0]) throw new Error("You do not have an active enrollment or waitlist place for this session.");
      await tx.update(waitlistEntries).set({ status: "cancelled" }).where(eq(waitlistEntries.id, waiting[0].id));
      return { promotedUserId: null, seatsRemaining: Math.max(session.capacity - session.seatsTaken, 0), waitlistCancelled: true };
    }
    await tx.update(enrollments).set({ status: "cancelled", cancelledAt: new Date() }).where(eq(enrollments.id, active[0].id));
    const next = await tx.select().from(waitlistEntries).where(and(eq(waitlistEntries.sessionId, sessionId), eq(waitlistEntries.status, "waiting"))).orderBy(asc(waitlistEntries.position)).limit(1);
    if (next[0]) {
      await tx.update(waitlistEntries).set({ status: "promoted" }).where(eq(waitlistEntries.id, next[0].id));
      await tx.insert(enrollments).values({ sessionId, userId: next[0].userId, status: "active" });
      await tx.insert(notifications).values({ userId: next[0].userId, sessionId, type: "promoted", message: "A seat opened up—your waitlist place has been promoted." });
      return { promotedUserId: next[0].userId, seatsRemaining: 0, waitlistCancelled: false };
    }
    const seatsRemaining = Math.min(session.capacity, Math.max(session.capacity - session.seatsTaken + 1, 0));
    await tx.update(studySessions).set({ seatsTaken: Math.max(session.seatsTaken - 1, 0) }).where(eq(studySessions.id, sessionId));
    return { promotedUserId: null, seatsRemaining, waitlistCancelled: false };
  });
}

export async function getDashboard(userId: number) {
  const db = requireDb(await getDb());
  const now = new Date();
  const [joined, hosted, upcoming, activity] = await Promise.all([
    db.select({ id: studySessions.id, title: studySessions.title, subject: studySessions.subject, startsAt: studySessions.startsAt, location: studySessions.location, format: studySessions.format, hostName: profiles.displayName }).from(enrollments).innerJoin(studySessions, eq(enrollments.sessionId, studySessions.id)).leftJoin(profiles, eq(studySessions.hostId, profiles.userId)).where(and(eq(enrollments.userId, userId), eq(enrollments.status, "active"), gte(studySessions.startsAt, now), eq(studySessions.status, "published"))).orderBy(asc(studySessions.startsAt)).limit(4),
    db.select({ id: studySessions.id, title: studySessions.title, subject: studySessions.subject, startsAt: studySessions.startsAt, seatsTaken: studySessions.seatsTaken, capacity: studySessions.capacity, status: studySessions.status }).from(studySessions).where(and(eq(studySessions.hostId, userId), gte(studySessions.startsAt, now))).orderBy(asc(studySessions.startsAt)).limit(4),
    db.select({ id: studySessions.id, title: studySessions.title, subject: studySessions.subject, startsAt: studySessions.startsAt, seatsTaken: studySessions.seatsTaken, capacity: studySessions.capacity, hostName: profiles.displayName }).from(studySessions).leftJoin(profiles, eq(studySessions.hostId, profiles.userId)).where(and(eq(studySessions.status, "published"), gte(studySessions.startsAt, now), sql`${studySessions.seatsTaken} < ${studySessions.capacity}`)).orderBy(asc(studySessions.startsAt)).limit(4),
    db.select({ id: notifications.id, type: notifications.type, message: notifications.message, createdAt: notifications.createdAt, sessionTitle: studySessions.title }).from(notifications).leftJoin(studySessions, eq(notifications.sessionId, studySessions.id)).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(5),
  ]);
  return { joined, hosted, upcoming, activity };
}
