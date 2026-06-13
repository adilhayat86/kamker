export type WorkerStatusShape = {
  is_active?: boolean | null;
  is_banned?: boolean | null;
};

export type WorkerStatus = "pending" | "approved" | "banned";

export function getWorkerStatus(worker: WorkerStatusShape | null | undefined): WorkerStatus {
  if (worker?.is_banned) {
    return "banned";
  }

  return worker?.is_active ? "approved" : "pending";
}

export function isWorkerApproved(worker: WorkerStatusShape | null | undefined) {
  return getWorkerStatus(worker) === "approved";
}

export function isWorkerPending(worker: WorkerStatusShape | null | undefined) {
  return getWorkerStatus(worker) === "pending";
}

export function isWorkerBanned(worker: WorkerStatusShape | null | undefined) {
  return getWorkerStatus(worker) === "banned";
}

export function canWorkerPost(worker: WorkerStatusShape | null | undefined) {
  return isWorkerApproved(worker);
}

export function canWorkerAppearInSearch(worker: WorkerStatusShape | null | undefined) {
  return isWorkerApproved(worker);
}

export function canWorkerBeContacted(worker: WorkerStatusShape | null | undefined) {
  return isWorkerApproved(worker);
}

export function workerStatusLabel(worker: WorkerStatusShape | null | undefined) {
  const status = getWorkerStatus(worker);

  if (status === "approved") {
    return "Approved";
  }

  if (status === "banned") {
    return "Banned";
  }

  return "Pending Review";
}

export function workerPostingBlockedStatus(worker: WorkerStatusShape | null | undefined) {
  if (!worker) {
    return null;
  }

  const status = getWorkerStatus(worker);

  if (status === "banned") {
    return "banned";
  }

  if (status === "pending") {
    return "pending";
  }

  return null;
}
