import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { transcribeAudioServer } from "./server/transcribe.server";

export const transcribeAudio = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ audioUrl: z.string().url() }).parse(data))
  .handler(async ({ data }) => transcribeAudioServer(data));