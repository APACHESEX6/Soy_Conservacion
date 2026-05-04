import process from "node:process";
import { afterAll, beforeAll } from "vitest";

/**
 * Global test setup
 */

beforeAll(() => {
  // Setup environment for tests
  process.env.NODE_ENV = "test";
  process.env.LOG_LEVEL = "error"; // Suppress logs in tests
});

afterAll(() => {
  // Cleanup after all tests
});
