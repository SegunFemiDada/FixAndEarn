import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>("RESEND_API_KEY");

    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    this.resend = new Resend(apiKey);

    this.from = this.config.get<string>(
      "EMAIL_FROM",
      "fixandearn@resend.dev"
    );
  }

  async sendVerificationEmail(
    to: string,
    verifyUrl: string
  ): Promise<void> {
    const subject = "Verify your email - FixAndEarn";

    const html = `
      <h2>Welcome to FixAndEarn</h2>

      <p>Please verify your email address.</p>

      <p>
        <a href="${verifyUrl}">
          Verify Email
        </a>
      </p>

      <p>
        Or copy and paste this URL into your browser:
      </p>

      <p>${verifyUrl}</p>

      <p>This link expires in 24 hours.</p>
    `;

    await this.send(to, subject, html);
  }

  async sendResetPasswordEmail(
    to: string,
    resetUrl: string
  ): Promise<void> {
    const subject = "Reset your password - FixAndEarn";

    const html = `
      <h2>FixAndEarn Password Reset</h2>

      <p>
        We received a request to reset your password.
      </p>

      <p>
        <a href="${resetUrl}">
          Reset Password
        </a>
      </p>

      <p>
        Or copy and paste this URL into your browser:
      </p>

      <p>${resetUrl}</p>

      <p>This link expires in 15 minutes.</p>
    `;

    await this.send(to, subject, html);
  }

  async send(
    to: string,
    subject: string,
    html: string
  ): Promise<void> {
    try {
      const result = await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
      });

      this.logger.log(
        `Email sent successfully to ${to}`
      );

      this.logger.debug(
        JSON.stringify(result)
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      this.logger.error(
        `Failed to send email: ${message}`
      );

      throw error;
    }
  }
}