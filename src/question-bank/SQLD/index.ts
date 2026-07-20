import type { StudyQuestion } from "../types";
import { SQLD_MANAGEMENT_QUESTIONS } from "./관리구문";
import { SQLD_MODELING_QUESTIONS } from "./데이터모델링";
import { SQLD_EXAM_STYLE_SQL_QUESTIONS } from "./실전형_SQL";
import { SQLD_EXAM_STYLE_MODELING_QUESTIONS } from "./실전형_모델링";
import { SQLD_ADVANCED_QUESTIONS } from "./SQL활용";
import { SQLD_BASIC_QUESTIONS } from "./SQL기본";

export const SQLD_QUESTIONS: StudyQuestion[] = [
  ...SQLD_MODELING_QUESTIONS,
  ...SQLD_BASIC_QUESTIONS,
  ...SQLD_ADVANCED_QUESTIONS,
  ...SQLD_MANAGEMENT_QUESTIONS,
  ...SQLD_EXAM_STYLE_MODELING_QUESTIONS,
  ...SQLD_EXAM_STYLE_SQL_QUESTIONS
];
