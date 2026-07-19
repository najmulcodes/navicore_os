import { Injectable, InternalServerErrorException } from "@nestjs/common";

interface ChatMessageInput {
  role: "user" | "assistant";
  content: string;
}

/**
 * Thin HTTP client for apps/ai-service — see docs/PHASE_0_ARCHITECTURE.md's
 * AI Layer Design ("FastAPI service exposes a small internal API that
 * NestJS calls"). Uses Node's built-in fetch (Node 22+) rather than adding
 * axios/got as a dependency for two endpoints.
 */
@Injectable()
export class AiServiceClient {
  private get baseUrl(): string {
    return process.env.AI_SERVICE_URL ?? "http://localhost:8000";
  }

  private get headers(): Record<string, string> {
    const key = process.env.INTERNAL_AI_API_KEY;
    if (!key) {
      throw new InternalServerErrorException(
        "INTERNAL_AI_API_KEY is not set — required to call apps/ai-service. See .env.example.",
      );
    }
    return { "Content-Type": "application/json", "x-internal-api-key": key };
  }

  async chat(messages: ChatMessageInput[], system?: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ messages, system }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        `AI service /chat failed: ${response.status} ${await response.text()}`,
      );
    }

    const data = (await response.json()) as { content: string };
    return data.content;
  }

  async summarize(text: string, maxSentences = 3): Promise<string> {
    const response = await fetch(`${this.baseUrl}/summarize`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ text, max_sentences: maxSentences }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        `AI service /summarize failed: ${response.status} ${await response.text()}`,
      );
    }

    const data = (await response.json()) as { summary: string };
    return data.summary;
  }
}
