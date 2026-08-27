export type SessionDraft = {
  title: string;
  subject: string;
  description: string;
  startsAt: number;
  endsAt: number;
  capacity: number;
  location?: string | null;
  onlineLink?: string | null;
};

export function validateSessionDraft(input: SessionDraft): string[] {
  const errors: string[] = [];
  if (input.title.trim().length < 4) errors.push("A session title must contain at least 4 characters.");
  if (input.subject.trim().length < 2) errors.push("Please choose a subject.");
  if (input.description.trim().length < 12) errors.push("Add a short description so participants know what to expect.");
  if (input.startsAt <= Date.now()) errors.push("The session must start in the future.");
  if (input.endsAt <= input.startsAt) errors.push("The end time must be after the start time.");
  if (!Number.isInteger(input.capacity) || input.capacity < 2 || input.capacity > 40) {
    errors.push("Capacity must be a whole number from 2 to 40.");
  }
  if (!input.location?.trim() && !input.onlineLink?.trim()) {
    errors.push("Add a location or an online link.");
  }
  return errors;
}

export function enrollmentOutcome({
  capacity,
  seatsTaken,
  isAlreadyActive,
  isAlreadyWaitlisted,
}: {
  capacity: number;
  seatsTaken: number;
  isAlreadyActive: boolean;
  isAlreadyWaitlisted: boolean;
}) {
  if (isAlreadyActive) return "already_joined" as const;
  if (isAlreadyWaitlisted) return "already_waitlisted" as const;
  return seatsTaken < capacity ? ("joined" as const) : ("waitlisted" as const);
}
