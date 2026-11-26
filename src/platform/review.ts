import { Capacitor, registerPlugin } from "@capacitor/core";

export const REVIEW_PROMPT_STAGES = ["06", "12"] as const;
export type ReviewPromptStageId = (typeof REVIEW_PROMPT_STAGES)[number];

export interface TapReviewResult {
  opened?: boolean;
  invoked?: boolean;
  tapInstalled?: boolean;
  reason?: string;
  message?: string;
}

export interface TapReviewBridge {
  openReview(): Promise<TapReviewResult>;
}

export function isReviewPromptStage(stageId: string): stageId is ReviewPromptStageId {
  return (REVIEW_PROMPT_STAGES as readonly string[]).includes(stageId);
}

export function sanitizeReviewPrompts(value: unknown): ReviewPromptStageId[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<ReviewPromptStageId>();
  for (const item of value) {
    if (typeof item === "string" && isReviewPromptStage(item)) seen.add(item);
  }
  return [...seen];
}

export class ReviewPromptController {
  readonly supported: boolean;
  private readonly native?: TapReviewBridge;
  private readonly enabled: () => boolean;
  private pendingStage: ReviewPromptStageId | null = null;

  constructor(native?: TapReviewBridge, enabled: () => boolean = () => true) {
    this.native = native;
    this.enabled = enabled;
    this.supported = Boolean(native);
  }

  noteStageCleared(
    stageId: string,
    prompted: readonly string[],
    opened = false,
  ): boolean {
    if (!this.enabled() || opened || !isReviewPromptStage(stageId) || prompted.includes(stageId)) return false;
    this.pendingStage = stageId;
    return true;
  }

  peekPending(prompted: readonly string[], opened = false): ReviewPromptStageId | null {
    if (!this.enabled() || opened || !this.pendingStage || prompted.includes(this.pendingStage)) return null;
    return this.pendingStage;
  }

  consumePending(prompted: readonly string[], opened = false): ReviewPromptStageId | null {
    const stage = this.peekPending(prompted, opened);
    this.pendingStage = null;
    return stage;
  }

  async openReview(): Promise<TapReviewResult> {
    if (!this.enabled()) return { opened: false, reason: "consent" };
    if (!this.native) return { opened: false, reason: "unsupported" };
    try {
      return await this.native.openReview();
    } catch (error) {
      return {
        opened: false,
        reason: "failed",
        message: error instanceof Error ? error.message : undefined,
      };
    }
  }
}

export function createReviewController(enabled: () => boolean = () => true): ReviewPromptController {
  return new ReviewPromptController(
    Capacitor.getPlatform() === "android" && Capacitor.isPluginAvailable("TapReview")
      ? registerPlugin<TapReviewBridge>("TapReview")
      : undefined,
    enabled,
  );
}
