# 문제은행 폴더 구조

자격증별로 최상위 폴더를 하나씩 만들고, 그 안에서 문제 영역을 나눈다.

```text
question-bank/
├─ types.ts
├─ index.ts
├─ 정보처리기사/
│  ├─ 프로그래밍.ts
│  ├─ 데이터베이스-SQL.ts
│  ├─ 소프트웨어공학-테스트.ts
│  ├─ 운영체제-네트워크-리눅스.ts
│  ├─ 자료구조-알고리즘.ts
│  ├─ 웹-API-인터페이스.ts
│  ├─ 보안.ts
│  ├─ 신기술.ts
│  └─ index.ts
└─ SQLD/
   └─ index.ts
```

## 파일 역할

- `types.ts`: 모든 자격증이 공통으로 사용하는 문제 형식
- `index.ts`: 자격증 ID와 문제은행을 연결하는 전체 목록
- `정보처리기사/프로그래밍.ts`: C, Java, Python 코드 문제
- `정보처리기사/데이터베이스-SQL.ts`: SQL, 정규화, 트랜잭션 문제
- `정보처리기사/소프트웨어공학-테스트.ts`: UML, 설계, 테스트 문제
- `정보처리기사/운영체제-네트워크-리눅스.ts`: 스케줄링, 프로토콜, 명령어 문제
- `정보처리기사/자료구조-알고리즘.ts`: 트리, 정렬, 탐색 문제
- `정보처리기사/웹-API-인터페이스.ts`: HTTP, REST, 인터페이스 문제
- `정보처리기사/보안.ts`: 공격, 암호화, 인증 문제
- `정보처리기사/신기술.ts`: 클라우드, AI 등 최신기술 문제
- 각 자격증의 `index.ts`: 해당 폴더의 문제를 하나의 배열로 합치는 파일

## SQLD 문제를 추가하는 방법

1. `SQLD` 폴더에 영역별 파일을 만든다.
   - `fundamentals.ts`
   - `sql-practice.ts`
   - `mock-exam.ts`
2. 각 파일은 `StudyQuestion[]` 형식으로 문제를 내보낸다.
3. `SQLD/index.ts`에서 배열을 합친다.
4. Slack 채널 ID를 자격증 ID `sqld`와 연결한다.

다른 자격증도 `한국사`, `ADsP`, `공기업-NCS`처럼 같은 방식으로 폴더를 추가한다.

## 문제 작성 형식

```ts
import type { StudyQuestion } from "../types";

export const SAMPLE_QUESTIONS: StudyQuestion[] = [
  {
    id: "sqld-select-01",
    kind: "sql",
    topic: "SQL 기본",
    difficulty: "기초",
    tags: ["sql", "select"],
    prompt: "문제 내용",
    answer: "정답",
    hint: "정답을 직접 드러내지 않는 힌트",
    explanation: "쉬운 풀이",
    confusion: "헷갈리는 개념 비교"
  }
];
```

`id`는 모든 자격증 문제를 합쳐도 중복되지 않도록 자격증·영역 접두사를 붙인다.
