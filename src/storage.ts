import type { StudyQuestion } from "./questions";

export interface StoredQuizSession {
  code: string;
  userId: string;
  channelId: string;
  questionIds: string[];
  title: string;
  createdAt: string;
}

export interface AttemptRecord {
  questionId: string;
  isCorrect: boolean;
  answeredAt: string;
}

export interface DailySubscription {
  userId: string;
  channelId: string;
  questionCount: number;
}

export interface DailySubscriptionStatus {
  enabled: boolean;
  questionCount: number;
}

interface ReviewRow {
  question_id: string;
  wrong_count: number;
  next_review_at: string;
}

interface ReviewStateRow {
  wrong_count: number;
  correct_count: number;
  correct_streak: number;
  interval_days: number;
}

export async function saveQuizSession(
  db: D1Database,
  session: StoredQuizSession,
  questions: StudyQuestion[]
): Promise<void> {
  const statements = [
    db
      .prepare(
        `INSERT INTO quiz_sessions
          (session_code, user_id, channel_id, question_ids, title, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        session.code,
        session.userId,
        session.channelId,
        JSON.stringify(session.questionIds),
        session.title,
        session.createdAt
      ),
    ...questions.map((question) =>
      db
        .prepare(
          `INSERT INTO served_questions
            (user_id, question_id, session_code, served_at)
           VALUES (?, ?, ?, ?)`
        )
        .bind(session.userId, question.id, session.code, session.createdAt)
    )
  ];

  await db.batch(statements);
}

export async function loadQuizSession(db: D1Database, code: string): Promise<StoredQuizSession | null> {
  const row = await db
    .prepare(
      `SELECT session_code, user_id, channel_id, question_ids, title, created_at
       FROM quiz_sessions
       WHERE session_code = ?`
    )
    .bind(code)
    .first<{
      session_code: string;
      user_id: string;
      channel_id: string;
      question_ids: string;
      title: string;
      created_at: string;
    }>();

  if (!row) return null;

  try {
    return {
      code: row.session_code,
      userId: row.user_id,
      channelId: row.channel_id,
      questionIds: JSON.parse(row.question_ids) as string[],
      title: row.title,
      createdAt: row.created_at
    };
  } catch {
    return null;
  }
}

export async function getRecentlyServedQuestionIds(db: D1Database, userId: string): Promise<Set<string>> {
  const result = await db
    .prepare(
      `SELECT question_id
       FROM served_questions
       WHERE user_id = ?
       ORDER BY served_at DESC
       LIMIT 100`
    )
    .bind(userId)
    .all<{ question_id: string }>();

  return new Set((result.results ?? []).map((row) => row.question_id));
}

export async function recordGrade(
  db: D1Database,
  userId: string,
  questionId: string,
  isCorrect: boolean,
  sessionCode: string
): Promise<{ nextReviewDays: number | null; wrongCount: number }> {
  const now = new Date();
  const nowIso = now.toISOString();
  const existing = await db
    .prepare(
      `SELECT wrong_count, correct_count, correct_streak, interval_days
       FROM review_queue
       WHERE user_id = ? AND question_id = ?`
    )
    .bind(userId, questionId)
    .first<ReviewStateRow>();

  const wrongCount = (existing?.wrong_count ?? 0) + (isCorrect ? 0 : 1);
  const correctCount = (existing?.correct_count ?? 0) + (isCorrect ? 1 : 0);
  const correctStreak = isCorrect ? (existing?.correct_streak ?? 0) + 1 : 0;
  const intervalDays = isCorrect ? reviewIntervalForStreak(correctStreak) : 1;
  const nextReviewAt = new Date(now.getTime() + intervalDays * 86_400_000).toISOString();

  await db.batch([
    db
      .prepare(
        `INSERT INTO attempts
          (user_id, question_id, is_correct, session_code, answered_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(userId, questionId, isCorrect ? 1 : 0, sessionCode, nowIso),
    db
      .prepare(
        `INSERT INTO review_queue
          (user_id, question_id, wrong_count, correct_count, correct_streak,
           interval_days, next_review_at, last_result, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, question_id) DO UPDATE SET
           wrong_count = excluded.wrong_count,
           correct_count = excluded.correct_count,
           correct_streak = excluded.correct_streak,
           interval_days = excluded.interval_days,
           next_review_at = excluded.next_review_at,
           last_result = excluded.last_result,
           updated_at = excluded.updated_at`
      )
      .bind(
        userId,
        questionId,
        wrongCount,
        correctCount,
        correctStreak,
        intervalDays,
        nextReviewAt,
        isCorrect ? 1 : 0,
        nowIso
      )
  ]);

  return {
    nextReviewDays: wrongCount > 0 && correctStreak < 3 ? intervalDays : null,
    wrongCount
  };
}

export async function getReviewQuestionIds(
  db: D1Database,
  userId: string,
  count: number,
  weakFirst: boolean
): Promise<string[]> {
  const order = weakFirst
    ? "wrong_count DESC, next_review_at ASC"
    : "CASE WHEN datetime(next_review_at) <= datetime('now') THEN 0 ELSE 1 END, next_review_at ASC, wrong_count DESC";
  const result = await db
    .prepare(
      `SELECT question_id, wrong_count, next_review_at
       FROM review_queue
       WHERE user_id = ? AND wrong_count > 0 AND correct_streak < 3
       ORDER BY ${order}
       LIMIT ?`
    )
    .bind(userId, count)
    .all<ReviewRow>();

  return (result.results ?? []).map((row) => row.question_id);
}

export async function removeFromReviewQueue(
  db: D1Database,
  userId: string,
  questionId: string
): Promise<boolean> {
  const result = await db
    .prepare(
      `DELETE FROM review_queue
       WHERE user_id = ? AND question_id = ?`
    )
    .bind(userId, questionId)
    .run();

  return (result.meta.changes ?? 0) > 0;
}

export async function getAttempts(db: D1Database, userId: string, todayOnly = false): Promise<AttemptRecord[]> {
  const todayClause = todayOnly
    ? "AND date(answered_at, '+9 hours') = date('now', '+9 hours')"
    : "";
  const result = await db
    .prepare(
      `SELECT question_id, is_correct, answered_at
       FROM attempts
       WHERE user_id = ? ${todayClause}
       ORDER BY answered_at DESC
       LIMIT 1000`
    )
    .bind(userId)
    .all<{ question_id: string; is_correct: number; answered_at: string }>();

  return (result.results ?? []).map((row) => ({
    questionId: row.question_id,
    isCorrect: row.is_correct === 1,
    answeredAt: row.answered_at
  }));
}

export async function setDailySubscription(
  db: D1Database,
  userId: string,
  channelId: string,
  enabled: boolean,
  questionCount = 5
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO daily_subscriptions
        (user_id, channel_id, enabled, question_count, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, channel_id) DO UPDATE SET
         enabled = excluded.enabled,
         question_count = excluded.question_count,
         updated_at = excluded.updated_at`
    )
    .bind(userId, channelId, enabled ? 1 : 0, questionCount, new Date().toISOString())
    .run();
}

export async function getDailySubscriptions(db: D1Database): Promise<DailySubscription[]> {
  const result = await db
    .prepare(
      `SELECT user_id, channel_id, question_count
       FROM daily_subscriptions
       WHERE enabled = 1`
    )
    .all<{ user_id: string; channel_id: string; question_count: number }>();

  return (result.results ?? []).map((row) => ({
    userId: row.user_id,
    channelId: row.channel_id,
    questionCount: row.question_count
  }));
}

export async function getDailySubscriptionStatus(
  db: D1Database,
  userId: string,
  channelId: string
): Promise<DailySubscriptionStatus | null> {
  const row = await db
    .prepare(
      `SELECT enabled, question_count
       FROM daily_subscriptions
       WHERE user_id = ? AND channel_id = ?`
    )
    .bind(userId, channelId)
    .first<{ enabled: number; question_count: number }>();

  if (!row) return null;
  return {
    enabled: row.enabled === 1,
    questionCount: row.question_count
  };
}

function reviewIntervalForStreak(streak: number): number {
  if (streak <= 1) return 3;
  if (streak === 2) return 7;
  if (streak === 3) return 14;
  return 30;
}
