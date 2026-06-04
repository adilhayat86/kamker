export const workerAvailabilityOptions = [
  { value: "weekdays", label: "Weekdays" },
  { value: "weekends", label: "Weekends" },
  { value: "seven_days", label: "7 days a week" },
] as const;

export type WorkerAvailability = (typeof workerAvailabilityOptions)[number]["value"];

const workerAvailabilityLabels = new Map<string, string>([
  ...workerAvailabilityOptions.map((option) => [option.value, option.label] as const),
  ["Weekdays", "Weekdays"],
  ["Weekends", "Weekends"],
  ["7 days a week", "7 days a week"],
  ["Full Time", "7 days a week"],
  ["Part Time Morning", "Weekdays"],
  ["Part Time Evening", "Weekdays"],
]);

export function isWorkerAvailability(value: string): value is WorkerAvailability {
  return workerAvailabilityOptions.some((option) => option.value === value);
}

export function workerAvailabilityLabel(value: string | null | undefined) {
  if (!value) {
    return "Availability not added yet";
  }

  return workerAvailabilityLabels.get(value) ?? value;
}
