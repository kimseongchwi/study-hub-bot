import type { StudyQuestion } from "../types";

export const WEB_API_INTERFACE_QUESTIONS: StudyQuestion[] = [
  {
    id: "rest-stateless-01",
    kind: "concept",
    topic: "인터페이스",
    difficulty: "기초",
    tags: ["software", "interface", "rest", "서버"],
    prompt: "REST의 제약조건 중 서버가 이전 요청의 클라이언트 상태를 저장하지 않고 각 요청이 필요한 정보를 모두 포함해야 한다는 성질을 쓰시오.",
    answer: "무상태성(Stateless)",
    hint: "각 요청을 독립적으로 처리할 수 있어야 합니다.",
    explanation: "무상태성은 서버가 클라이언트의 세션 문맥에 의존하지 않아 확장성과 요청 처리의 독립성을 높입니다.",
    confusion: "무상태라는 말은 데이터베이스를 사용하지 않는다는 뜻이 아니라 클라이언트 세션 상태를 요청 사이에 보관하지 않는다는 뜻입니다."
  },
  {
    id: "rest-idempotent-01",
    kind: "choice",
    topic: "인터페이스",
    difficulty: "실전",
    tags: ["software", "interface", "rest", "http"],
    prompt: "같은 요청을 여러 번 수행해도 서버의 최종 상태가 한 번 수행했을 때와 같은 성질을 고르시오.",
    choices: ["① 멱등성", "② 무상태성", "③ 캐시 가능성", "④ 계층화"],
    answer: "① 멱등성",
    hint: "PUT과 DELETE의 대표적인 성질로 설명됩니다.",
    explanation: "멱등성은 동일 요청을 한 번 또는 여러 번 적용해도 의도된 최종 상태가 같다는 성질입니다.",
    confusion: "무상태성은 서버가 요청 사이의 클라이언트 문맥을 저장하지 않는다는 REST 제약입니다."
  },
  {
    id: "web-http-get-01",
    kind: "choice",
    topic: "웹/API",
    difficulty: "기초",
    tags: ["web", "api", "http", "method"],
    prompt: "HTTP GET 메서드의 일반적인 용도로 가장 알맞은 것을 고르시오.",
    choices: ["① 자원 조회", "② 자원 전체 교체만 가능", "③ 서버 프로세스 강제 종료", "④ 암호키 생성"],
    answer: "① 자원 조회",
    hint: "서버의 표현을 가져오는 안전한 메서드입니다.",
    explanation: "GET은 지정한 자원의 표현을 조회하는 데 사용하며 일반적으로 서버 상태를 변경하지 않는 안전한 메서드로 설계합니다.",
    confusion: "GET 요청에 부작용을 넣으면 캐시나 재시도 과정에서 예상치 못한 상태 변경이 생길 수 있습니다."
  },
  {
    id: "web-status-01",
    kind: "concept",
    topic: "웹/API",
    difficulty: "기초",
    tags: ["web", "api", "http", "status"],
    prompt: "HTTP에서 요청한 자원을 찾을 수 없음을 나타내는 상태 코드를 쓰시오.",
    answer: "404 Not Found",
    hint: "클라이언트 오류를 나타내는 4xx 코드입니다.",
    explanation: "404는 서버가 요청 URI에 해당하는 자원을 찾지 못했음을 나타냅니다.",
    confusion: "403은 자원은 이해했지만 접근을 거부한 경우이고 500은 서버 내부 오류입니다."
  },
  {
    id: "web-cookie-session-01",
    kind: "choice",
    topic: "웹/API",
    difficulty: "실전",
    tags: ["web", "http", "cookie", "session"],
    prompt: "쿠키와 서버 세션의 관계로 가장 알맞은 것을 고르시오.",
    choices: ["① 브라우저 쿠키에 세션 식별자를 저장할 수 있다", "② 세션 데이터는 반드시 모두 브라우저에 저장한다", "③ 쿠키는 서버가 읽을 수 없다", "④ HTTP는 기본적으로 모든 요청의 상태를 자동 보관한다"],
    answer: "① 브라우저 쿠키에 세션 식별자를 저장할 수 있다",
    hint: "클라이언트는 식별자를 보내고 서버가 해당 세션 데이터를 찾습니다.",
    explanation: "일반적인 서버 세션 방식은 쿠키에 세션 ID를 두고 실제 세션 상태는 서버 저장소에서 관리합니다.",
    confusion: "쿠키와 세션은 반대 개념이 아니라 함께 사용될 수 있으며 민감한 정보를 쿠키에 직접 저장할 때는 보안을 고려해야 합니다."
  },
  {
    id: "web-cors-01",
    kind: "concept",
    topic: "웹/API",
    difficulty: "실전",
    tags: ["web", "api", "http", "cors"],
    prompt: "브라우저가 다른 출처의 자원 요청을 허용할지 서버의 HTTP 헤더를 통해 제어하는 체계를 쓰시오.",
    answer: "CORS(Cross-Origin Resource Sharing)",
    hint: "동일 출처 정책의 예외를 안전하게 허용합니다.",
    explanation: "CORS는 서버가 허용할 출처·메서드·헤더 등을 응답 헤더로 알려 브라우저의 교차 출처 요청을 제어합니다.",
    confusion: "CORS는 브라우저 보안 정책이며 서버 간 직접 요청에는 같은 방식으로 강제되지 않습니다."
  },
  {
    id: "api-rest-resource-01",
    kind: "choice",
    topic: "웹/API",
    difficulty: "기초",
    tags: ["api", "rest", "interface", "web"],
    prompt: "REST API URI 설계 예시로 가장 알맞은 것을 고르시오.",
    choices: ["① GET /users/10", "② GET /getUserById?id=10만 가능", "③ POST /deleteUser/10", "④ URI에 데이터베이스 비밀번호 포함"],
    answer: "① GET /users/10",
    hint: "URI는 자원을 나타내고 행위는 HTTP 메서드로 표현합니다.",
    explanation: "REST 스타일에서는 /users/10처럼 명사형 URI로 자원을 식별하고 GET·POST·PUT·DELETE 등 메서드로 행위를 표현합니다.",
    confusion: "REST는 URI 모양 하나만이 아니라 무상태성, 캐시, 계층화 같은 제약을 함께 포함합니다."
  },
  {
    id: "api-put-patch-01",
    kind: "concept",
    topic: "웹/API",
    difficulty: "실전",
    tags: ["api", "http", "method", "web"],
    prompt: "HTTP에서 자원의 일부 속성만 변경할 때 일반적으로 사용하는 메서드를 쓰시오.",
    answer: "PATCH",
    hint: "PUT은 자원의 전체 표현 교체 의미로 자주 사용됩니다.",
    explanation: "PATCH는 자원의 부분 변경을 표현하는 데 사용하며 PUT은 지정 URI의 자원을 전체 표현으로 교체하는 의미로 설계하는 경우가 많습니다.",
    confusion: "실제 API 계약에 따라 동작이 달라질 수 있으므로 서버 문서를 확인해야 합니다."
  },
  {
    id: "api-jwt-01",
    kind: "concept",
    topic: "웹/API",
    difficulty: "심화",
    tags: ["api", "security", "jwt", "web"],
    prompt: "일반적인 JWT의 세 부분을 순서대로 쓰시오.",
    answer: "Header, Payload, Signature",
    hint: "점(.)으로 구분되는 세 부분입니다.",
    explanation: "JWT는 알고리즘 등의 Header, 클레임을 담는 Payload, 무결성을 검증하는 Signature로 구성됩니다.",
    confusion: "서명된 JWT의 Payload는 기본적으로 암호화된 것이 아니므로 민감정보를 그대로 넣으면 안 됩니다."
  },
  {
    id: "web-websocket-01",
    kind: "choice",
    topic: "웹/API",
    difficulty: "실전",
    tags: ["web", "api", "websocket", "network"],
    prompt: "하나의 연결에서 클라이언트와 서버가 양방향으로 메시지를 주고받는 실시간 통신 기술을 고르시오.",
    choices: ["① WebSocket", "② DNS", "③ ARP", "④ FTP Passive Mode"],
    answer: "① WebSocket",
    hint: "HTTP 연결 업그레이드를 통해 지속적인 양방향 채널을 만들 수 있습니다.",
    explanation: "WebSocket은 연결을 유지하면서 클라이언트와 서버가 필요할 때 서로 메시지를 보낼 수 있는 전이중 통신을 지원합니다.",
    confusion: "일반 HTTP 요청·응답 반복과 달리 연결을 유지하므로 채팅이나 실시간 알림에 적합합니다."
  }
];
