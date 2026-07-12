import { SQLD_QUESTIONS } from "./SQLD";
import type { CertificationId, QuestionBank } from "./types";
import { INFORMATION_PROCESSING_ENGINEER_QUESTIONS } from "./정보처리기사";

export const DEFAULT_CERTIFICATION_ID: CertificationId = "information-processing-engineer";

export const QUESTION_BANKS: Record<CertificationId, QuestionBank> = {
  "information-processing-engineer": {
    id: "information-processing-engineer",
    name: "정보처리기사 실기",
    aliases: ["정보처리기사", "정처기", "정보처리기사 실기"],
    questions: INFORMATION_PROCESSING_ENGINEER_QUESTIONS
  },
  sqld: {
    id: "sqld",
    name: "SQLD",
    aliases: ["SQLD", "SQL 개발자"],
    questions: SQLD_QUESTIONS
  }
};

export const DEFAULT_QUESTIONS = QUESTION_BANKS[DEFAULT_CERTIFICATION_ID].questions;

export function getQuestionBank(certificationId: CertificationId): QuestionBank {
  return QUESTION_BANKS[certificationId];
}

export type { CertificationId, Difficulty, QuestionBank, QuestionKind, StudyQuestion } from "./types";
