import { describe, expect, it } from "vitest";
import { reportSchema } from "./reportSchemas";

describe("reportSchema", () => {
  it("accepts valid payloads", () => {
    const payload = {
      summary: "Краткое описание дня",
      themes: ["Рост обсуждений"],
      insights: ["Пик активности вечером"]
    };

    const parsed = reportSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid payloads", () => {
    const payload = {
      summary: "",
      themes: "ошибка",
      insights: []
    };

    const parsed = reportSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });
});
