> Copyright (c) 2025 Kartik Gohil
> Licensed under the Apache License, Version 2.0
> See LICENSE file for details.

# The TIDD Manifesto

## What is TIDD?
**Testable-Interface Driven Development (TIDD)** is a development methodology that merges the strengths of **Test-Driven Development (TDD)** and **Interface-Driven Development (IDD)** while avoiding their common pitfalls.

- **TDD alone** can lead to **brittle tests** tied too closely to fast-changing implementations.
- **IDD alone** can lead to **untestable or unmanageable abstractions** that look neat on paper but don’t hold up in practice.

But when we combine the best of TDD and IDD, we get **TIDD**.

TIDD says:
> **Interfaces should be designed with testability as a primary concern, and tests should validate the contracts defined by those interfaces, not their internal implementations.**

## Principles

1. **Define Interfaces And Test Cases Together**
    - Every interface must be designed with real-life test cases in mind.
    - If the interface isn't testable, it needs a redesign.

2. **Tests Validate Contracts, not Implementations**
    - Tests must assert **what** an interface intends to do, not **how** the code is implemented.
    - If you already have the test cases, define an interface instead of testing concrete implementations directly.

3. **Tests As Code**  
    - Interface definitions and test cases should live side-by-side. When one changes, so should the other. Both should be developed and deployed together, ideally from a single location.
    - Use version control to ensure that interfaces and test cases can be developed and released together without version mismatch issues or external dependencies.  

4. **Code Is Volatile, Interfaces are Static**  
    - Implementations can change freely as long as the interface contract (and its tests) remain intact.


## Why TIDD?
- **More resilient tests:** By tying tests to contracts rather than implementations, TIDD avoids brittle test suites that collapse when code is refactored.
- **Fast design feedback:** Thinking about testability at the interface level encourages clearer boundaries and cleaner abstractions.  
- **Smoother evolution:** Since tests are bound to contracts, implementation details can change without having to rewrite the test suite.


## A Simple Example

Let’s say we’re designing a `PaymentProcessor`:

**Interface (in TypeScript-like pseudocode):**
```ts
interface PaymentProcessor {
  charge(userId: string, amount: number): TransactionResult;
}

interface TransactionResult {
  success: boolean;
  transactionId: string;
}
```

**Contract Constraints:**

* `amount > 0`
* `transactionId` must be a UUID

**Generated Tests (conceptually):**

* Asserts that negative amounts are rejected.
* Asserts that successful results always include a valid UUID.
* Provides a mock `PaymentProcessor` for testing upstream callers.

Here, the **testability is baked into the interface design**, not added after the fact.

## Request for Comments

**TIDD is new, experimental, and evolving.**
If you’ve felt the pain of TDD or IDD misapplied - e.g. brittle tests, untestable abstractions, etc. - then join the discussion.

💡 Share your feedback, open issues, or propose examples. Let’s make **testable interfaces** the new standard for resilient software design.