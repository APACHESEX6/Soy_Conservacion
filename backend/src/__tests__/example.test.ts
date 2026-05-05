import { describe, expect, it } from "vitest";

/**
 * Example unit test
 * Run with: pnpm test
 */

describe("Math operations", () => {
  it("should add two numbers", () => {
    const result = 2 + 2;
    expect(result).toBe(4);
  });

  it("should handle negative numbers", () => {
    const result = -5 + 3;
    expect(result).toBe(-2);
  });

  it("should multiply correctly", () => {
    const multiply = (a: number, b: number) => a * b;
    expect(multiply(3, 4)).toBe(12);
  });
});

describe("String operations", () => {
  it("should uppercase a string", () => {
    const text = "hello";
    expect(text.toUpperCase()).toBe("HELLO");
  });

  it("should trim whitespace", () => {
    const text = "  hello world  ";
    expect(text.trim()).toBe("hello world");
  });
});
