import type { CarRecord } from "./car";
import type { Preferences, ScoredCar } from "./preferences";

export interface RecommendationItem {
  car: CarRecord;
  scored: ScoredCar;
}

/** The canonical shape returned by POST /api/recommend and GET /api/sessions/[id]. */
export interface RecommendationResponse {
  sessionId: string;
  createdAt: string;
  preferences: Preferences;
  freeText: string | null;
  aiEnhanced: boolean;
  items: RecommendationItem[];
  total: number;
}
