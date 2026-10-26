export interface StudyTask {
  id: number;
  subject: string;
  description: string;
  dueAt: number;
  completedAt: number | null;
}
