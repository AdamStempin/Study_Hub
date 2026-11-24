export interface StudyTask {
  id: string;
  subject: string;
  description: string;
  dueAt: number;
  completedAt: number | null;
}
