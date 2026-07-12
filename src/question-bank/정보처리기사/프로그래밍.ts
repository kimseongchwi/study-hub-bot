import type { StudyQuestion } from "../types";

export const PROGRAMMING_QUESTIONS: StudyQuestion[] = [
  {
    id: "c-loop-01",
    kind: "code",
    topic: "C언어",
    difficulty: "기초",
    tags: ["code", "c", "제어문", "반복문"],
    prompt: [
      "다음 C 프로그램의 출력값을 쓰시오.",
      "```c",
      "int sum = 0;",
      "for (int i = 1; i <= 5; i++) {",
      "  if (i % 2 == 1) sum += i;",
      "}",
      "printf(\"%d\", sum);",
      "```"
    ].join("\n"),
    answer: "9",
    hint: "1부터 5까지의 수 중 홀수만 더합니다.",
    explanation: "조건을 만족하는 값은 1, 3, 5이고 합은 1 + 3 + 5 = 9입니다.",
    confusion: "반복 횟수보다 if 조건을 통과하는 값만 추려서 계산해야 합니다."
  },
  {
    id: "c-bit-01",
    kind: "code",
    topic: "C언어",
    difficulty: "실전",
    tags: ["code", "c", "비트", "연산자"],
    prompt: [
      "다음 C 프로그램의 출력값을 쓰시오.",
      "```c",
      "int a = 12;  // 1100",
      "int b = 10;  // 1010",
      "printf(\"%d\", (a & b) + (a ^ b));",
      "```"
    ].join("\n"),
    answer: "14",
    hint: "AND와 XOR 결과를 각각 2진수로 계산해 보세요.",
    explanation: "12 & 10은 1000₂로 8이고, 12 ^ 10은 0110₂로 6입니다. 따라서 8 + 6 = 14입니다.",
    confusion: "&는 둘 다 1일 때만 1, ^는 서로 다를 때 1입니다."
  },
  {
    id: "c-pointer-01",
    kind: "code",
    topic: "C언어",
    difficulty: "실전",
    tags: ["code", "c", "포인터", "배열"],
    prompt: [
      "다음 C 프로그램의 출력값을 쓰시오.",
      "```c",
      "int a[] = {2, 4, 6, 8};",
      "int *p = a;",
      "p += 2;",
      "printf(\"%d\", *p + *(p - 1));",
      "```"
    ].join("\n"),
    answer: "10",
    hint: "p += 2 이후 p가 배열의 몇 번째 원소를 가리키는지 확인하세요.",
    explanation: "p는 a[2]인 6을 가리킵니다. *(p - 1)은 a[1]인 4이므로 합은 10입니다.",
    confusion: "p + 1은 주소를 1바이트가 아니라 자료형 한 칸만큼 이동시킵니다."
  },
  {
    id: "c-struct-01",
    kind: "code",
    topic: "C언어",
    difficulty: "실전",
    tags: ["code", "c", "구조체", "배열"],
    prompt: [
      "다음 C 프로그램의 출력값을 쓰시오.",
      "```c",
      "struct Item { int price; int count; };",
      "struct Item items[2] = {{100, 2}, {50, 3}};",
      "int total = 0;",
      "for (int i = 0; i < 2; i++)",
      "  total += items[i].price * items[i].count;",
      "printf(\"%d\", total);",
      "```"
    ].join("\n"),
    answer: "350",
    hint: "각 구조체의 price와 count를 곱한 뒤 합합니다.",
    explanation: "첫 항목은 100×2=200, 둘째 항목은 50×3=150이므로 합계는 350입니다.",
    confusion: "items[i].price처럼 점 연산자로 구조체 멤버에 접근합니다."
  },
  {
    id: "c-recursion-01",
    kind: "code",
    topic: "C언어",
    difficulty: "실전",
    tags: ["code", "c", "재귀", "함수"],
    prompt: [
      "다음 C 프로그램에서 f(527)의 반환값을 쓰시오.",
      "```c",
      "int f(int n) {",
      "  if (n == 0) return 0;",
      "  return n % 10 + f(n / 10);",
      "}",
      "```"
    ].join("\n"),
    answer: "14",
    hint: "매 호출에서 마지막 자릿수를 더하고 마지막 자릿수를 제거합니다.",
    explanation: "527 % 10 = 7, 52 % 10 = 2, 5 % 10 = 5이므로 7 + 2 + 5 = 14입니다.",
    confusion: "정수 나눗셈 n / 10은 소수점 이하를 버립니다."
  },
  {
    id: "c-increment-01",
    kind: "code",
    topic: "C언어",
    difficulty: "실전",
    tags: ["code", "c", "증감연산자", "연산자"],
    prompt: [
      "다음 C 프로그램의 출력값을 순서대로 쓰시오.",
      "```c",
      "int a = 3;",
      "int b = a++;",
      "int c = ++a;",
      "printf(\"%d %d %d\", a, b, c);",
      "```"
    ].join("\n"),
    answer: "5 3 5",
    hint: "후위 증가와 전위 증가가 값을 언제 바꾸는지 구분하세요.",
    explanation: "b에는 증가 전 값 3이 들어가고 a는 4가 됩니다. ++a로 a를 먼저 5로 만든 뒤 c에 5가 저장됩니다.",
    confusion: "a++는 사용 후 증가, ++a는 증가 후 사용입니다."
  },
  {
    id: "c-array-01",
    kind: "code",
    topic: "C언어",
    difficulty: "기초",
    tags: ["code", "c", "배열", "반복문"],
    prompt: [
      "다음 C 프로그램의 출력값을 쓰시오.",
      "```c",
      "int a[3][3] = {{1,2,3},{4,5,6},{7,8,9}};",
      "int sum = 0;",
      "for (int i = 0; i < 3; i++) sum += a[i][i];",
      "printf(\"%d\", sum);",
      "```"
    ].join("\n"),
    answer: "15",
    hint: "행 인덱스와 열 인덱스가 같은 원소만 선택됩니다.",
    explanation: "주대각선 원소 a[0][0], a[1][1], a[2][2]는 1, 5, 9이며 합은 15입니다.",
    confusion: "a[i][i]는 주대각선이고 a[i][2-i]는 반대 대각선입니다."
  },
  {
    id: "java-override-01",
    kind: "code",
    topic: "Java",
    difficulty: "기초",
    tags: ["code", "java", "상속", "오버라이딩"],
    prompt: [
      "다음 Java 프로그램의 출력값을 쓰시오.",
      "```java",
      "class Parent { String name() { return \"P\"; } }",
      "class Child extends Parent { String name() { return \"C\"; } }",
      "Parent obj = new Child();",
      "System.out.print(obj.name());",
      "```"
    ].join("\n"),
    answer: "C",
    hint: "참조 변수의 타입보다 실제 생성된 객체의 메서드가 중요합니다.",
    explanation: "오버라이딩된 인스턴스 메서드는 실행 시 실제 객체인 Child를 기준으로 호출되어 C가 출력됩니다.",
    confusion: "오버로딩은 매개변수 구성이 다른 것이고, 오버라이딩은 상속받은 메서드를 재정의하는 것입니다."
  },
  {
    id: "java-field-01",
    kind: "code",
    topic: "Java",
    difficulty: "실전",
    tags: ["code", "java", "상속", "필드"],
    prompt: [
      "다음 Java 프로그램의 출력값을 쓰시오.",
      "```java",
      "class A { int x = 1; int getX() { return x; } }",
      "class B extends A { int x = 2; int getX() { return x; } }",
      "A obj = new B();",
      "System.out.print(obj.x + \" \" + obj.getX());",
      "```"
    ].join("\n"),
    answer: "1 2",
    hint: "필드 접근과 오버라이딩 메서드 호출의 기준은 서로 다릅니다.",
    explanation: "필드는 참조 타입 A를 기준으로 1을 읽고, 메서드는 실제 객체 B의 getX()가 호출되어 2를 반환합니다.",
    confusion: "Java 필드는 다형적으로 오버라이딩되지 않지만 인스턴스 메서드는 오버라이딩됩니다."
  },
  {
    id: "java-exception-01",
    kind: "code",
    topic: "Java",
    difficulty: "실전",
    tags: ["code", "java", "예외", "finally"],
    prompt: [
      "다음 Java 프로그램의 출력 순서를 쓰시오.",
      "```java",
      "try {",
      "  int n = 10 / 0;",
      "  System.out.print(\"T\");",
      "} catch (ArithmeticException e) {",
      "  System.out.print(\"C\");",
      "} finally {",
      "  System.out.print(\"F\");",
      "}",
      "```"
    ].join("\n"),
    answer: "CF",
    hint: "예외 발생 뒤 catch와 finally의 실행 여부를 확인하세요.",
    explanation: "0으로 나누면서 예외가 발생해 T는 출력되지 않습니다. catch에서 C, 항상 실행되는 finally에서 F가 출력됩니다.",
    confusion: "finally는 일반적인 예외 처리 흐름에서 예외 발생 여부와 관계없이 실행됩니다."
  },
  {
    id: "java-string-01",
    kind: "code",
    topic: "Java",
    difficulty: "기초",
    tags: ["code", "java", "문자열", "equals"],
    prompt: [
      "다음 Java 프로그램의 출력값을 쓰시오.",
      "```java",
      "String a = new String(\"hi\");",
      "String b = new String(\"hi\");",
      "System.out.print((a == b) + \" \" + a.equals(b));",
      "```"
    ].join("\n"),
    answer: "false true",
    hint: "==와 equals()가 각각 무엇을 비교하는지 생각하세요.",
    explanation: "a와 b는 서로 다른 객체라 ==는 false이고, 문자열 내용은 같으므로 equals()는 true입니다.",
    confusion: "==는 참조 동일성, String.equals()는 문자열 내용을 비교합니다."
  },
  {
    id: "java-interface-01",
    kind: "code",
    topic: "Java",
    difficulty: "실전",
    tags: ["code", "java", "인터페이스", "다형성"],
    prompt: [
      "다음 Java 프로그램의 출력값을 쓰시오.",
      "```java",
      "interface Calc { int run(int x); }",
      "class DoubleCalc implements Calc {",
      "  public int run(int x) { return x * 2; }",
      "}",
      "Calc c = new DoubleCalc();",
      "System.out.print(c.run(7));",
      "```"
    ].join("\n"),
    answer: "14",
    hint: "구현 클래스의 run 메서드에 7이 전달됩니다.",
    explanation: "DoubleCalc가 Calc의 run을 구현했고 7×2를 반환하므로 14가 출력됩니다.",
    confusion: "인터페이스 타입 변수도 구현 객체를 참조해 다형적으로 메서드를 호출할 수 있습니다."
  },
  {
    id: "python-slice-01",
    kind: "code",
    topic: "Python",
    difficulty: "기초",
    tags: ["code", "python", "슬라이싱", "리스트"],
    prompt: [
      "다음 Python 코드의 출력값을 쓰시오.",
      "```python",
      "nums = [1, 2, 3, 4, 5]",
      "print(nums[1:5:2])",
      "```"
    ].join("\n"),
    answer: "[2, 4]",
    hint: "시작 인덱스 1부터 종료 인덱스 5 직전까지 2칸씩 이동합니다.",
    explanation: "인덱스 1과 3의 값인 2와 4가 선택됩니다. 종료 인덱스 5는 포함되지 않습니다.",
    confusion: "슬라이싱의 종료 인덱스는 포함되지 않습니다."
  },
  {
    id: "python-dict-01",
    kind: "code",
    topic: "Python",
    difficulty: "실전",
    tags: ["code", "python", "딕셔너리", "컴프리헨션"],
    prompt: [
      "다음 Python 코드의 출력값을 쓰시오.",
      "```python",
      "result = {x: x*x for x in range(1, 5) if x % 2 == 0}",
      "print(result)",
      "```"
    ].join("\n"),
    answer: "{2: 4, 4: 16}",
    hint: "1부터 4까지 중 짝수만 키가 됩니다.",
    explanation: "조건을 통과하는 x는 2와 4이며 각각 제곱한 값 4와 16이 값으로 저장됩니다.",
    confusion: "range(1, 5)는 1, 2, 3, 4를 만들고 5는 포함하지 않습니다."
  },
  {
    id: "python-inherit-01",
    kind: "code",
    topic: "Python",
    difficulty: "실전",
    tags: ["code", "python", "상속", "super"],
    prompt: [
      "다음 Python 코드의 출력값을 쓰시오.",
      "```python",
      "class A:",
      "    def value(self): return 3",
      "class B(A):",
      "    def value(self): return super().value() + 4",
      "print(B().value())",
      "```"
    ].join("\n"),
    answer: "7",
    hint: "부모 메서드가 반환한 값에 4를 더합니다.",
    explanation: "super().value()는 A.value()의 반환값 3이고 여기에 4를 더해 7을 반환합니다.",
    confusion: "super()는 부모 클래스의 구현을 재사용할 때 사용합니다."
  },
  {
    id: "python-list-01",
    kind: "code",
    topic: "Python",
    difficulty: "기초",
    tags: ["code", "python", "리스트", "컴프리헨션"],
    prompt: [
      "다음 Python 코드의 출력값을 쓰시오.",
      "```python",
      "values = [x*x for x in range(6) if x % 2 == 1]",
      "print(values)",
      "```"
    ].join("\n"),
    answer: "[1, 9, 25]",
    hint: "0부터 5까지의 홀수만 제곱합니다.",
    explanation: "홀수 1, 3, 5의 제곱은 각각 1, 9, 25입니다.",
    confusion: "조건문은 값을 변환하기 전에 어떤 원소를 포함할지 결정합니다."
  },
  {
    id: "c-switch-02",
    kind: "code",
    topic: "C언어",
    difficulty: "기초",
    tags: ["code", "c", "switch", "제어문"],
    prompt: [
      "다음 C 프로그램의 출력값을 쓰시오.",
      "```c",
      "int n = 2;",
      "switch (n) {",
      "  case 1: printf(\"A\"); break;",
      "  case 2: printf(\"B\");",
      "  case 3: printf(\"C\");",
      "  default: printf(\"D\");",
      "}",
      "```"
    ].join("\n"),
    answer: "BCD",
    hint: "case 2 이후 break가 있는지 확인하세요.",
    explanation: "case 2에서 B를 출력한 뒤 break가 없어 case 3과 default까지 차례로 실행합니다.",
    confusion: "switch는 일치하는 case부터 시작하며 break를 만나기 전까지 아래 case로 계속 진행합니다."
  },
  {
    id: "c-string-02",
    kind: "code",
    topic: "C언어",
    difficulty: "기초",
    tags: ["code", "c", "문자열", "배열"],
    prompt: [
      "다음 C 프로그램의 출력값을 쓰시오.",
      "```c",
      "char s[] = \"KOREA\";",
      "printf(\"%c %zu\", s[2], strlen(s));",
      "```"
    ].join("\n"),
    answer: "R 5",
    hint: "문자열 인덱스는 0부터 시작하고 strlen은 널 문자를 제외합니다.",
    explanation: "s[2]는 세 번째 문자 R이고 문자열 KOREA의 길이는 5입니다.",
    confusion: "배열 공간에는 끝의 널 문자까지 6칸이 필요하지만 strlen의 결과는 5입니다."
  },
  {
    id: "c-pointer-02",
    kind: "code",
    topic: "C언어",
    difficulty: "실전",
    tags: ["code", "c", "포인터", "배열"],
    prompt: [
      "다음 C 프로그램의 출력값을 쓰시오.",
      "```c",
      "int a[] = {3, 6, 9, 12};",
      "int *p = a + 1;",
      "printf(\"%d \", *p);",
      "p += 2;",
      "printf(\"%d\", *p);",
      "```"
    ].join("\n"),
    answer: "6 12",
    hint: "a + 1은 a[1]의 주소입니다.",
    explanation: "처음 p는 a[1]인 6을 가리키고 두 칸 이동한 뒤에는 a[3]인 12를 가리킵니다.",
    confusion: "포인터 덧셈은 바이트가 아니라 가리키는 자료형의 원소 단위로 이동합니다."
  },
  {
    id: "c-static-01",
    kind: "code",
    topic: "C언어",
    difficulty: "실전",
    tags: ["code", "c", "static", "함수"],
    prompt: [
      "다음 C 프로그램의 출력값을 쓰시오.",
      "```c",
      "int f(void) {",
      "  static int x = 0;",
      "  x += 2;",
      "  return x;",
      "}",
      "printf(\"%d \", f());",
      "printf(\"%d \", f());",
      "printf(\"%d\", f());",
      "```"
    ].join("\n"),
    answer: "2 4 6",
    hint: "static 변수의 값은 함수 호출이 끝난 뒤에도 유지됩니다.",
    explanation: "x는 한 번만 초기화되고 호출 사이에 유지되므로 각 호출에서 2, 4, 6을 차례로 반환합니다.",
    confusion: "일반 지역 변수는 호출할 때마다 새로 만들어지지만 static 지역 변수는 프로그램 실행 동안 유지됩니다."
  },
  {
    id: "c-shift-01",
    kind: "code",
    topic: "C언어",
    difficulty: "실전",
    tags: ["code", "c", "비트", "시프트", "calculation"],
    prompt: [
      "다음 C 프로그램의 출력값을 쓰시오.",
      "```c",
      "int x = 5;",
      "printf(\"%d\", (x << 1) | 3);",
      "```"
    ].join("\n"),
    answer: "11",
    hint: "5를 왼쪽으로 한 칸 이동한 값과 3을 OR 연산합니다.",
    explanation: "5는 0101₂이고 왼쪽 시프트하면 1010₂인 10입니다. 10 OR 3은 1011₂로 11입니다.",
    confusion: "왼쪽 시프트는 범위 안의 양수에서 보통 2를 곱한 효과가 있지만 OR는 별도로 비트별 계산해야 합니다."
  },
  {
    id: "c-call-value-01",
    kind: "code",
    topic: "C언어",
    difficulty: "기초",
    tags: ["code", "c", "함수", "매개변수"],
    prompt: [
      "다음 C 프로그램의 출력값을 쓰시오.",
      "```c",
      "void change(int x) { x = 20; }",
      "int n = 10;",
      "change(n);",
      "printf(\"%d\", n);",
      "```"
    ].join("\n"),
    answer: "10",
    hint: "함수에 n의 값이 복사되어 전달됩니다.",
    explanation: "change의 x는 n과 별개의 지역 변수이므로 x를 바꿔도 n은 10으로 유지됩니다.",
    confusion: "호출한 변수 자체를 바꾸려면 주소를 전달하고 포인터로 역참조해야 합니다."
  },
  {
    id: "c-double-pointer-01",
    kind: "code",
    topic: "C언어",
    difficulty: "심화",
    tags: ["code", "c", "포인터", "이중포인터"],
    prompt: [
      "다음 C 프로그램의 출력값을 쓰시오.",
      "```c",
      "int n = 3;",
      "int *p = &n;",
      "int **pp = &p;",
      "**pp += 4;",
      "printf(\"%d\", n);",
      "```"
    ].join("\n"),
    answer: "7",
    hint: "pp를 두 번 역참조하면 어떤 변수에 도달하는지 확인하세요.",
    explanation: "pp는 p의 주소이고 p는 n의 주소이므로 **pp는 n 자체입니다. n에 4를 더해 7이 됩니다.",
    confusion: "*pp는 p이고 **pp는 p가 가리키는 n입니다."
  },
  {
    id: "c-matrix-02",
    kind: "code",
    topic: "C언어",
    difficulty: "실전",
    tags: ["code", "c", "배열", "반복문"],
    prompt: [
      "다음 C 프로그램의 출력값을 쓰시오.",
      "```c",
      "int a[3][3] = {{1,2,3},{4,5,6},{7,8,9}};",
      "int sum = 0;",
      "for (int i = 0; i < 3; i++) sum += a[i][2-i];",
      "printf(\"%d\", sum);",
      "```"
    ].join("\n"),
    answer: "15",
    hint: "열 인덱스가 2, 1, 0 순서로 바뀝니다.",
    explanation: "선택되는 값은 a[0][2]=3, a[1][1]=5, a[2][0]=7이므로 합은 15입니다.",
    confusion: "a[i][i]는 주대각선, a[i][크기-1-i]는 반대 대각선입니다."
  },
  {
    id: "java-constructor-02",
    kind: "code",
    topic: "Java",
    difficulty: "기초",
    tags: ["code", "java", "상속", "생성자"],
    prompt: [
      "다음 Java 프로그램의 출력값을 쓰시오.",
      "```java",
      "class A { A() { System.out.print(\"A\"); } }",
      "class B extends A { B() { System.out.print(\"B\"); } }",
      "new B();",
      "```"
    ].join("\n"),
    answer: "AB",
    hint: "자식 생성자보다 부모 생성자가 먼저 실행됩니다.",
    explanation: "B 생성 시 암시적으로 super()가 먼저 호출되어 A를 출력한 뒤 B 생성자에서 B를 출력합니다.",
    confusion: "생성자 호출 순서는 부모에서 자식 방향이고 종료는 자식에서 부모 방향입니다."
  },
  {
    id: "java-static-02",
    kind: "code",
    topic: "Java",
    difficulty: "기초",
    tags: ["code", "java", "static", "객체"],
    prompt: [
      "다음 Java 프로그램의 출력값을 쓰시오.",
      "```java",
      "class Item {",
      "  static int count = 0;",
      "  Item() { count++; }",
      "}",
      "new Item(); new Item();",
      "System.out.print(Item.count);",
      "```"
    ].join("\n"),
    answer: "2",
    hint: "count는 객체마다 따로 생기지 않습니다.",
    explanation: "static 필드는 클래스에 하나만 존재하며 두 객체의 생성자가 같은 count를 각각 1씩 증가시킵니다.",
    confusion: "인스턴스 필드는 객체별로 존재하지만 static 필드는 클래스 전체가 공유합니다."
  },
  {
    id: "java-overload-02",
    kind: "code",
    topic: "Java",
    difficulty: "실전",
    tags: ["code", "java", "오버로딩", "메서드"],
    prompt: [
      "다음 Java 프로그램의 출력값을 쓰시오.",
      "```java",
      "static void f(int x) { System.out.print(\"I\"); }",
      "static void f(double x) { System.out.print(\"D\"); }",
      "f(3); f(3.0);",
      "```"
    ].join("\n"),
    answer: "ID",
    hint: "인수의 리터럴 자료형과 가장 정확히 일치하는 메서드를 찾으세요.",
    explanation: "정수 리터럴 3은 int 버전, 실수 리터럴 3.0은 double 버전을 호출합니다.",
    confusion: "오버로딩은 컴파일 시 매개변수 타입으로 결정되고 오버라이딩은 실행 시 실제 객체로 결정됩니다."
  },
  {
    id: "java-list-02",
    kind: "code",
    topic: "Java",
    difficulty: "실전",
    tags: ["code", "java", "컬렉션", "list"],
    prompt: [
      "다음 Java 프로그램의 출력값을 쓰시오.",
      "```java",
      "List<Integer> list = new ArrayList<>(List.of(1, 2, 3));",
      "list.remove(1);",
      "System.out.print(list);",
      "```"
    ].join("\n"),
    answer: "[1, 3]",
    hint: "remove에 전달된 1이 인덱스인지 값인지 확인하세요.",
    explanation: "int 인수 1은 인덱스로 해석되어 두 번째 원소 2가 삭제됩니다.",
    confusion: "값 1을 삭제하려면 list.remove(Integer.valueOf(1))처럼 객체를 전달해야 합니다."
  },
  {
    id: "java-builder-01",
    kind: "code",
    topic: "Java",
    difficulty: "기초",
    tags: ["code", "java", "문자열", "stringbuilder"],
    prompt: [
      "다음 Java 프로그램의 출력값을 쓰시오.",
      "```java",
      "StringBuilder sb = new StringBuilder(\"abcd\");",
      "sb.reverse().deleteCharAt(1);",
      "System.out.print(sb);",
      "```"
    ].join("\n"),
    answer: "dba",
    hint: "먼저 문자열을 뒤집은 뒤 인덱스 1의 문자를 삭제합니다.",
    explanation: "abcd를 뒤집으면 dcba이고 인덱스 1의 c를 삭제하면 dba가 됩니다.",
    confusion: "String은 불변이지만 StringBuilder는 같은 객체의 내용을 변경합니다."
  },
  {
    id: "java-finally-return-01",
    kind: "code",
    topic: "Java",
    difficulty: "심화",
    tags: ["code", "java", "예외", "finally"],
    prompt: [
      "다음 Java 메서드에서 f()의 반환값을 쓰시오.",
      "```java",
      "static int f() {",
      "  try { return 1; }",
      "  finally { return 2; }",
      "}",
      "```"
    ].join("\n"),
    answer: "2",
    hint: "try의 return 전에 finally가 실행됩니다.",
    explanation: "finally의 return이 앞서 준비된 try의 반환값을 덮어써 최종적으로 2를 반환합니다.",
    confusion: "finally에서 return을 사용하면 예외나 기존 반환값을 숨길 수 있어 실무에서는 피하는 것이 좋습니다."
  },
  {
    id: "java-abstract-01",
    kind: "code",
    topic: "Java",
    difficulty: "실전",
    tags: ["code", "java", "추상클래스", "다형성"],
    prompt: [
      "다음 Java 프로그램의 출력값을 쓰시오.",
      "```java",
      "abstract class Animal { abstract String sound(); }",
      "class Dog extends Animal { String sound() { return \"멍\"; } }",
      "Animal a = new Dog();",
      "System.out.print(a.sound());",
      "```"
    ].join("\n"),
    answer: "멍",
    hint: "실제 생성된 객체의 오버라이딩 메서드가 호출됩니다.",
    explanation: "참조 타입은 Animal이지만 실제 객체는 Dog이므로 Dog의 sound()가 실행됩니다.",
    confusion: "추상 클래스는 직접 인스턴스화할 수 없지만 하위 클래스 타입을 참조할 수 있습니다."
  },
  {
    id: "python-comprehension-02",
    kind: "code",
    topic: "Python",
    difficulty: "기초",
    tags: ["code", "python", "리스트", "컴프리헨션"],
    prompt: [
      "다음 Python 프로그램의 출력값을 쓰시오.",
      "```python",
      "a = [x * x for x in range(1, 6) if x % 2 == 0]",
      "print(a)",
      "```"
    ].join("\n"),
    answer: "[4, 16]",
    hint: "1부터 5 중 짝수만 고른 뒤 제곱합니다.",
    explanation: "조건을 만족하는 2와 4를 각각 제곱하여 4와 16이 리스트에 들어갑니다.",
    confusion: "range(1, 6)은 끝값 6을 포함하지 않습니다."
  },
  {
    id: "python-dict-get-02",
    kind: "code",
    topic: "Python",
    difficulty: "기초",
    tags: ["code", "python", "딕셔너리", "get"],
    prompt: [
      "다음 Python 프로그램의 출력값을 쓰시오.",
      "```python",
      "d = {'a': 2}",
      "d['b'] = d.get('b', 0) + d['a']",
      "print(d['b'])",
      "```"
    ].join("\n"),
    answer: "2",
    hint: "없는 키를 get으로 조회할 때 지정한 기본값이 사용됩니다.",
    explanation: "b가 없으므로 d.get('b', 0)은 0이고 d['a']의 2를 더해 b에 2가 저장됩니다.",
    confusion: "d['b']로 없는 키를 바로 읽으면 KeyError지만 get은 기본값을 반환할 수 있습니다."
  },
  {
    id: "python-set-02",
    kind: "code",
    topic: "Python",
    difficulty: "기초",
    tags: ["code", "python", "set", "집합"],
    prompt: [
      "다음 Python 프로그램의 출력값을 쓰시오.",
      "```python",
      "a = {1, 2, 3}",
      "b = {2, 3, 4}",
      "print(sorted(a ^ b))",
      "```"
    ].join("\n"),
    answer: "[1, 4]",
    hint: "^는 두 집합의 대칭 차집합입니다.",
    explanation: "한쪽 집합에만 존재하는 원소는 1과 4이며 sorted로 정렬된 리스트가 출력됩니다.",
    confusion: "&는 교집합, |는 합집합, ^는 공통 원소를 제외한 대칭 차집합입니다."
  },
  {
    id: "python-zip-01",
    kind: "code",
    topic: "Python",
    difficulty: "실전",
    tags: ["code", "python", "zip", "반복문"],
    prompt: [
      "다음 Python 프로그램의 출력값을 쓰시오.",
      "```python",
      "a = [1, 2, 3]",
      "b = [4, 5, 6]",
      "print(sum(x * y for x, y in zip(a, b)))",
      "```"
    ].join("\n"),
    answer: "32",
    hint: "같은 위치의 원소끼리 곱한 뒤 모두 더합니다.",
    explanation: "1×4 + 2×5 + 3×6 = 4 + 10 + 18 = 32입니다.",
    confusion: "zip은 가장 짧은 반복 가능 객체의 길이까지만 묶습니다."
  },
  {
    id: "python-class-variable-01",
    kind: "code",
    topic: "Python",
    difficulty: "실전",
    tags: ["code", "python", "클래스", "변수"],
    prompt: [
      "다음 Python 프로그램의 출력값을 쓰시오.",
      "```python",
      "class A:",
      "    x = 1",
      "a = A()",
      "b = A()",
      "a.x = 5",
      "A.x = 3",
      "print(a.x, b.x)",
      "```"
    ].join("\n"),
    answer: "5 3",
    hint: "a에는 인스턴스 변수 x가 새로 생겼습니다.",
    explanation: "a.x=5는 a만의 변수를 만들고 b는 인스턴스 변수가 없어 변경된 클래스 변수 A.x=3을 읽습니다.",
    confusion: "인스턴스 속성이 있으면 클래스 속성보다 먼저 조회됩니다."
  },
  {
    id: "python-slice-02",
    kind: "code",
    topic: "Python",
    difficulty: "기초",
    tags: ["code", "python", "슬라이싱", "리스트"],
    prompt: [
      "다음 Python 프로그램의 출력값을 쓰시오.",
      "```python",
      "a = [1, 2, 3, 4, 5]",
      "print(a[::-2])",
      "```"
    ].join("\n"),
    answer: "[5, 3, 1]",
    hint: "음수 간격은 뒤에서 앞으로 이동합니다.",
    explanation: "마지막 원소 5부터 두 칸씩 거꾸로 선택해 5, 3, 1이 됩니다.",
    confusion: "[::-1]은 전체 역순이고 [::-2]는 역순으로 두 칸 간격입니다."
  },
  {
    id: "python-gcd-01",
    kind: "code",
    topic: "Python",
    difficulty: "실전",
    tags: ["code", "python", "재귀", "알고리즘"],
    prompt: [
      "다음 Python 프로그램의 출력값을 쓰시오.",
      "```python",
      "def gcd(a, b):",
      "    return a if b == 0 else gcd(b, a % b)",
      "print(gcd(48, 18))",
      "```"
    ].join("\n"),
    answer: "6",
    hint: "48과 18에 유클리드 호제법을 적용합니다.",
    explanation: "gcd(48,18) → gcd(18,12) → gcd(12,6) → gcd(6,0)이므로 6입니다.",
    confusion: "재귀 호출에서 두 번째 인수가 0이 되면 첫 번째 인수를 반환합니다."
  }
];
