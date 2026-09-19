import {
  Injectable,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type TermiiResponse = {
  message_id?: string;
  message?: string;
  code?: string;
};

@Injectable()
export class SmsService {
  private readonly logger = new Logger(
    SmsService.name,
  );

  private readonly apiKey: string;
  private readonly senderId: string;
  private readonly baseUrl: string;

  constructor(
    private readonly config: ConfigService,
  ) {
    this.apiKey =
      this.config
        .getOrThrow<string>(
          "TERMII_API_KEY",
        )
        .trim();

    this.senderId =
      this.config
        .getOrThrow<string>(
          "TERMII_SENDER_ID",
        )
        .trim();

    this.baseUrl =
      this.config
        .get<string>(
          "TERMII_BASE_URL",
          "https://api.ng.termii.com",
        )
        .trim()
        .replace(/\/+$/, "");

    if (!this.apiKey) {
      throw new Error(
        "TERMII_API_KEY is required",
      );
    }

    if (!this.senderId) {
      throw new Error(
        "TERMII_SENDER_ID is required",
      );
    }

    if (!this.baseUrl) {
      throw new Error(
        "TERMII_BASE_URL is required",
      );
    }
  }

  async sendVerificationCode(
    phone: string,
    code: string,
  ): Promise<void> {
    const normalizedPhone =
      this.normalizePhoneNumber(phone);

    const message =
      `Your FixAndEarn verification code is ${code}. ` +
      "It expires in 10 minutes.";

    const controller =
      new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      10_000,
    );

    try {
      const response =
        await fetch(
          `${this.baseUrl}/api/sms/send`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              to: normalizedPhone,
              from: this.senderId,
              sms: message,
              type: "plain",
              channel: "dnd",
              api_key: this.apiKey,
            }),
            signal:
              controller.signal,
          },
        );

      const payload =
        await this.parseResponse(
          response,
        );

      if (
        !response.ok ||
        !payload.message_id
      ) {
        this.logger.error(
          `Termii SMS request failed with HTTP ${response.status}.`,
        );

        throw new Error(
          "SMS_SEND_FAILED",
        );
      }

      this.logger.log(
        `Termii verification SMS accepted. Message ID: ${payload.message_id}`,
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        this.logger.error(
          "Termii SMS request timed out.",
        );

        throw new Error(
          "SMS_SEND_TIMEOUT",
        );
      }

      if (
        error instanceof Error &&
        (
          error.message ===
            "SMS_SEND_FAILED" ||
          error.message ===
            "SMS_SEND_TIMEOUT"
        )
      ) {
        throw error;
      }

      this.logger.error(
        "Termii SMS request failed.",
      );

      throw new Error(
        "SMS_SEND_FAILED",
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private async parseResponse(
    response: Response,
  ): Promise<TermiiResponse> {
    try {
      return (await response.json()) as TermiiResponse;
    } catch {
      return {};
    }
  }

  private normalizePhoneNumber(
    phone: string,
  ): string {
    const clean =
      phone
        .trim()
        .replace(/[\s()-]/g, "");

    if (clean.startsWith("+234")) {
      return clean.slice(1);
    }

    if (
      clean.startsWith("234") &&
      clean.length === 13
    ) {
      return clean;
    }

    if (
      clean.startsWith("0") &&
      clean.length === 11
    ) {
      return `234${clean.slice(1)}`;
    }

    return clean;
  }
}