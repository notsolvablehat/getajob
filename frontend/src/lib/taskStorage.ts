const TASK_ID_KEY = "gaj_task_id";
const TASK_JOBS_KEY = "gaj_task_jobs";

export interface TaskJobStub {
  id: string;
  title: string;
  company: string;
}

export function getTaskId(): string | null {
  return localStorage.getItem(TASK_ID_KEY);
}

export function setTask(taskId: string, jobs: TaskJobStub[]): void {
  localStorage.setItem(TASK_ID_KEY, taskId);
  localStorage.setItem(TASK_JOBS_KEY, JSON.stringify(jobs));
}

export function clearTask(): void {
  localStorage.removeItem(TASK_ID_KEY);
  localStorage.removeItem(TASK_JOBS_KEY);
}

export function getTaskJobs(): TaskJobStub[] {
  try {
    return JSON.parse(localStorage.getItem(TASK_JOBS_KEY) ?? "[]") as TaskJobStub[];
  } catch {
    return [];
  }
}
