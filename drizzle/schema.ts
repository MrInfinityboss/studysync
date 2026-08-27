import {
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const profiles = mysqlTable("profiles", {
  userId: int("userId").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  displayName: varchar("displayName", { length: 80 }).notNull(),
  bio: text("bio"),
  timezone: varchar("timezone", { length: 64 }).default("UTC").notNull(),
  studyInterests: text("studyInterests"),
  avatarUrl: text("avatarUrl"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const authIdentities = mysqlTable("authIdentities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 32 }).notNull(),
  providerSubject: varchar("providerSubject", { length: 128 }).notNull(),
  email: varchar("email", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  unique("auth_identity_provider_subject_unique").on(table.provider, table.providerSubject),
  index("auth_identity_user_idx").on(table.userId),
]);

export const studySessions = mysqlTable("studySessions", {
  id: int("id").autoincrement().primaryKey(),
  hostId: int("hostId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 160 }).notNull(),
  subject: varchar("subject", { length: 80 }).notNull(),
  description: text("description").notNull(),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),
  location: varchar("location", { length: 255 }),
  onlineLink: varchar("onlineLink", { length: 500 }),
  format: mysqlEnum("format", ["in_person", "online", "hybrid"]).default("in_person").notNull(),
  capacity: int("capacity").notNull(),
  seatsTaken: int("seatsTaken").default(0).notNull(),
  status: mysqlEnum("status", ["draft", "published", "cancelled", "completed"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("sessions_host_idx").on(table.hostId),
  index("sessions_discovery_idx").on(table.status, table.startsAt),
  index("sessions_subject_idx").on(table.subject),
]);

export const tags = mysqlTable("tags", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 48 }).notNull().unique(),
});

export const sessionTags = mysqlTable("sessionTags", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().references(() => studySessions.id, { onDelete: "cascade" }),
  tagId: int("tagId").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (table) => [
  unique("session_tag_unique").on(table.sessionId, table.tagId),
]);

export const enrollments = mysqlTable("enrollments", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().references(() => studySessions.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", ["active", "cancelled"]).default("active").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  cancelledAt: timestamp("cancelledAt"),
}, (table) => [
  unique("enrollment_session_user_unique").on(table.sessionId, table.userId),
  index("enrollments_session_idx").on(table.sessionId, table.status),
  index("enrollments_user_idx").on(table.userId, table.status),
]);

export const waitlistEntries = mysqlTable("waitlistEntries", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().references(() => studySessions.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  position: int("position").notNull(),
  status: mysqlEnum("status", ["waiting", "promoted", "cancelled"]).default("waiting").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  unique("waitlist_session_user_unique").on(table.sessionId, table.userId),
  index("waitlist_order_idx").on(table.sessionId, table.status, table.position),
]);

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionId: int("sessionId").references(() => studySessions.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["joined", "waitlisted", "promoted", "cancelled", "updated", "reminder"]).notNull(),
  message: varchar("message", { length: 255 }).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const auditEvents = mysqlTable("auditEvents", {
  id: int("id").autoincrement().primaryKey(),
  actorId: int("actorId").references(() => users.id, { onDelete: "set null" }),
  sessionId: int("sessionId").references(() => studySessions.id, { onDelete: "cascade" }),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type StudySession = typeof studySessions.$inferSelect;
