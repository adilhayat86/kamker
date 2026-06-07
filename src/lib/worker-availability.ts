export const workerTimeAvailabilityOptions = [
  { value: "morning", label: "Morning" },
  { value: "evening", label: "Evening" },
  { value: "full_time", label: "Full Time" },
] as const;

export const workerDayAvailabilityOptions = [
  { value: "weekend", label: "Weekend" },
  { value: "weekdays", label: "Weekdays" },
  { value: "seven_days", label: "7 days a week" },
] as const;

export type WorkerTimeAvailability = (typeof workerTimeAvailabilityOptions)[number]["value"];
export type WorkerDayAvailability = (typeof workerDayAvailabilityOptions)[number]["value"];

const workerTimeAvailabilityLabels = new Map<string, string>([
  ...workerTimeAvailabilityOptions.map((option) => [option.value, option.label] as const),
  ["Morning", "Morning"],
  ["Evening", "Evening"],
  ["Full Time", "Full Time"],
  ["Part Time Morning", "Morning"],
  ["Part Time Evening", "Evening"],
]);

const workerDayAvailabilityLabels = new Map<string, string>([
  ...workerDayAvailabilityOptions.map((option) => [option.value, option.label] as const),
  ["Weekend", "Weekend"],
  ["Weekends", "Weekend"],
  ["Weekdays", "Weekdays"],
  ["7 days a week", "7 days a week"],
]);

export function isWorkerTimeAvailability(value: string): value is WorkerTimeAvailability {
  return workerTimeAvailabilityOptions.some((option) => option.value === value);
}

export function isWorkerDayAvailability(value: string): value is WorkerDayAvailability {
  return workerDayAvailabilityOptions.some((option) => option.value === value);
}

export function workerTimeAvailabilityLabel(value: string | null | undefined) {
  if (!value) {
    return "Time not added yet";
  }

  return workerTimeAvailabilityLabels.get(value) ?? value;
}

export function workerDayAvailabilityLabel(value: string | null | undefined) {
  if (!value) {
    return "Days not added yet";
  }

  return workerDayAvailabilityLabels.get(value) ?? value;
}

export function workerAvailabilitySummary(
  timeValue: string | null | undefined,
  dayValue: string | null | undefined,
) {
  const timeLabel = workerTimeAvailabilityLabel(timeValue);
  const dayLabel = workerDayAvailabilityLabel(dayValue);

  if (!timeValue && !dayValue) {
    return "Availability not added yet";
  }

  if (!timeValue) {
    return dayLabel;
  }

  if (!dayValue) {
    return timeLabel;
  }

  return `${timeLabel} · ${dayLabel}`;
}

export const workerAvailabilityOptions = workerDayAvailabilityOptions;
export const workerAvailabilityLabel = workerDayAvailabilityLabel;
