import { z } from "zod";

export const reportSchema = z.object({
  summary: z.string().min(10),
  themes: z.array(z.string()).max(8),
  insights: z.array(z.string()).max(8)
});

export type ParsedReport = z.infer<typeof reportSchema>;
