import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { translateTextServer } from "./server/translate.server";

const InputSchema = z.object({
  text: z.string().min(1).max(8000),
  sourceLanguage: z.string().min(2).max(10),
  targetLanguage: z.string().min(2).max(10),
});

export const translateText = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => translateTextServer(data));