import { describe, expect, it } from "vitest";
import { enrollmentOutcome, validateSessionDraft } from "./studyRules";

describe("StudySync domain rules", () => {
  const futureStart = Date.now() + 86_400_000;

  it("accepts a complete future session draft", () => {
    expect(validateSessionDraft({
      title: "Calculus II review",
      subject: "Mathematics",
      description: "We will practise integration techniques together.",
      startsAt: futureStart,
      endsAt: futureStart + 5_400_000,
      capacity: 6,
      location: "Library 204",
    })).toEqual([]);
  });

  it("rejects an invalid session schedule and missing meeting place", () => {
    expect(validateSessionDraft({
      title: "No",
      subject: "",
      description: "Short",
      startsAt: Date.now() - 1000,
      endsAt: Date.now() - 2000,
      capacity: 1,
    })).toHaveLength(7);
  });

  it("preserves enrollment and waitlist invariants", () => {
    expect(enrollmentOutcome({ capacity: 6, seatsTaken: 5, isAlreadyActive: false, isAlreadyWaitlisted: false })).toBe("joined");
    expect(enrollmentOutcome({ capacity: 6, seatsTaken: 6, isAlreadyActive: false, isAlreadyWaitlisted: false })).toBe("waitlisted");
    expect(enrollmentOutcome({ capacity: 6, seatsTaken: 1, isAlreadyActive: true, isAlreadyWaitlisted: false })).toBe("already_joined");
  });
});
