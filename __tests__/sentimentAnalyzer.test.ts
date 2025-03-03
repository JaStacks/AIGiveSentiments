import { describe, test, expect } from '@jest/globals';
import { analyzeSentiment } from "../src/sentiment";

describe("Sentiment Analysis", () => {
  test("should return a positive score for positive sentiment", () => {
    expect(analyzeSentiment("This is amazing!")).toBeGreaterThan(0);
  });

  test("should return a negative score for negative sentiment", () => {
    expect(analyzeSentiment("This is terrible!")).toBeLessThan(0);
  });

  test("should return 0 for neutral sentiment", () => {
    expect(analyzeSentiment("This is a chair.")).toBe(0);
  });

  // Random tweet pulled from Twitter
  test("I think negative or neutral sentiment, ie. Bitcoin is not bullish", () => {
    expect(analyzeSentiment("Bitcoin is not bullish")).toBeLessThanOrEqual(0);
  });
});

