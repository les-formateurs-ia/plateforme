
export interface ExtractedPdf {
  name: string;
  content: string;
}

export interface TenderPlanningItem {
  id: string;
  name: string;
  parentId?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  estimatedDurationDays: number;
  level: number;
  isParent: boolean;
  responsible?: string; // New field for the person responsible for the task
  comments?: string; // New field for any comments related to the task
}

export interface GeminiDateExtractionResponse {
  submissionDeadline: string; // YYYY-MM-DD
  siteVisitDate: string | null; // YYYY-MM-DD
  launchMeetingDate: string | null; // YYYY-MM-DD
}

export interface RetroPlanningData {
  weeklyTasks: { [weekNumber: number]: TenderPlanningItem[] }; // This is technically not used as intended in RetroPlanning, a flat list is passed. But keeping for potential future enhancement.
  allTasks: TenderPlanningItem[]; // Flat list of all tasks with dates
  startDate: Date | null;
  endDate: Date | null;
  numWeeks: number;
}

export interface ChatMessage {
  sender: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
}

export interface LaunchSummaryReport {
  objectifsCollectivite: string[];
  criteresNotationPonderes: string[];
  contraintesTrace: string[];
}

export interface RiskReport {
  clausesAPenalites: string[];
  garantiesPerformance: string[];
  autresRisques: string[];
}

export interface ScoringCriterion {
  critere: string;
  besoinCache: string;
  killerArgument: string;
}

export interface ScoringCriteriaReport {
  criteres: ScoringCriterion[];
}