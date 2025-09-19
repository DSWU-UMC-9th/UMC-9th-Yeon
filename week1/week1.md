# Week 1 - TypeScript의 기본

## 📝 학습 목표

- **TypeScript 기초 이해**: TypeScript가 무엇인지, 왜 필요한지 이해  
  TypeScript는 JavaScript에 타입 시스템을 추가하여 코드의 안정성과 가독성을 높여줍니다.
  ```ts
  let message: string = "Hello, TypeScript!";
  ```
- **타입 시스템 마스터**: 반환값 타입, 리터럴 타입, 배열/튜플 타입 등 다양한 타입 정의 방법 습득  
  함수의 매개변수와 반환값에 타입을 지정하여 오류를 예방할 수 있습니다.
  ```ts
  function add(a: number, b: number): number {
    return a + b;
  }
  ```
- **고급 타입 기능 이해**
  - 유니언 타입 (|)  
    여러 타입 중 하나를 허용할 때 사용합니다.
    ```ts
    let value: string | number = "hello";
    value = 10;
    ```
  - Type Aliases를 통한 타입 재사용  
    타입에 이름을 붙여 재사용할 수 있습니다.
    ```ts
    type ID = string | number;
    let userId: ID = 123;
    ```
  - Interface를 활용한 객체 타입 정의  
    객체의 구조를 정의하여 일관성을 유지합니다.
    ```ts
    interface User {
      name: string;
      age: number;
    }
    ```
  - Generic으로 재사용 가능한 컴포넌트 작성  
    다양한 타입에 대해 유연한 코드를 작성할 수 있습니다.
    ```ts
    function identity<T>(arg: T): T {
      return arg;
    }
    ```
  - Enum과 Utility Type 활용  
    열거형과 유틸리티 타입으로 코드를 더 간결하고 명확하게 만듭니다.
    ```ts
    enum Direction {
      Up,
      Down,
      Left,
      Right,
    }
    ```

💡 이번 주차는 TypeScript의 핵심 개념과 타입 시스템 전반을 다룹니다. 한 번에 완벽하게 이해하려 하기보다 실습을 통해 점진적으로 익혀 나가는 것이 중요합니다.

---

## 🎯 핵심 키워드

- TypeScript 필요성  
  JavaScript의 동적 타입 문제를 해결하여 개발 중 오류를 줄이고 유지보수를 쉽게 합니다.
  ```ts
  let count: number = 5;
  count = "five"; // 오류 발생
  ```
- 함수 타입 지정 (매개변수 타입, 반환 타입)  
  함수가 받는 인자와 반환하는 값의 타입을 명시합니다.
  ```ts
  function greet(name: string): string {
    return `Hello, ${name}!`;
  }
  ```
- 함수 선언식과 화살표 함수의 특징  
  선언식은 호이스팅이 가능하고, 화살표 함수는 this 바인딩이 다릅니다.
  ```ts
  const add = (a: number, b: number): number => a + b;
  ```
- 리터럴 타입  
  특정 값만 허용하는 타입입니다.
  ```ts
  let direction: "left" | "right" = "left";
  ```
- 배열 타입 / 튜플 타입  
  배열은 동일 타입 요소의 집합, 튜플은 고정된 개수와 타입의 요소 집합입니다.
  ```ts
  let numbers: number[] = [1, 2, 3];
  let tuple: [string, number] = ["age", 30];
  ```
- 유니언 타입 (|)  
  여러 타입 중 하나를 허용합니다.
  ```ts
  let id: string | number = "abc123";
  ```
- TypeScript 전용 타입  
  any, unknown, never 등 타입스크립트에서만 사용하는 특별한 타입입니다.
  ```ts
  let data: any = 10;
  ```
- Type Aliases  
  타입에 별칭을 붙여 재사용성을 높입니다.
  ```ts
  type Point = { x: number; y: number };
  ```
- Interface  
  객체의 구조를 정의하고 확장할 수 있습니다.
  ```ts
  interface Person {
    name: string;
    age: number;
  }
  ```
- Generic  
  타입을 파라미터로 받아 재사용 가능한 컴포넌트를 작성합니다.
  ```ts
  function wrap<T>(value: T): T[] {
    return [value];
  }
  ```
- Enum  
  이름이 있는 상수 집합을 정의합니다.
  ```ts
  enum Color {
    Red,
    Green,
    Blue,
  }
  ```
- Utility Type  
  기존 타입을 변형하는 타입 도구입니다.
  ```ts
  type PartialPerson = Partial<Person>;
  ```

---

## 🍠 학습 회고

- 핵심 키워드에 대한 이해 점검
- **이해한 점 - 어려운 점 - 개선 방법 - 회고** 순서로 작성

### ✍️ 회고 예시

- **이해한 점**: TypeScript의 기본 타입 지정과 함수 선언 방식을 이해했다.
- **어려운 점**: Generic과 Utility Type의 활용법이 아직 낯설었다.
- **개선 방법**: 추가 예제를 직접 작성하고 공식 문서를 참고할 계획이다.
- **회고**: 처음에는 어렵게 느껴졌지만 실습을 통해 점점 익숙해지고 있다.

---

## 🤔 참고 자료

- [BEM CSS 방법론 가이드](https://www.yolog.co.kr/post/css-bem-methodology)
- [Type vs Interface 정리](https://www.yolog.co.kr/post/ts-interface-type)
