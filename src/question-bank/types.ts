export type QuestionKind = "code" | "sql" | "concept" | "choice";
export type Difficulty = "기초" | "실전" | "심화";

export interface StudyQuestion {
  id: string;
  kind: QuestionKind;
  topic: string;
  difficulty: Difficulty;
  tags: string[];
  prompt: string;
  choices?: string[];
  answer: string;
  hint: string;
  explanation: string;
  confusion: string;
}

export interface QuestionBank {
  id: CertificationId;
  name: string;
  aliases: string[];
  questions: StudyQuestion[];
}

export type CertificationId = "information-processing-engineer" | "sqld";
