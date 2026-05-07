// apps/api/src/modules/email/email.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(EmailService.name);
  private readonly from: string;

  constructor(private config: ConfigService) {
    this.from = this.config.get<string>("EMAIL_FROM", "noreply@fixandearn.com");

    const host = this.config.get<string>("SMTP_HOST");
    const port = this.config.get<number>("SMTP_PORT");
    const user = this.config.get<string>("SMTP_USER");
    const pass = this.config.get<string>("SMTP_PASS");

    if (host && user && pass && port) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log("Email transporter initialized");
    } else {
      this.logger.warn(
        "SMTP credentials not fully configured. Email sending will be simulated."
      );
    }
  }

  async sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
    const subject = "Verify your email - FixAndEarn";
    const html = `
      <h1>Welcome to FixAndEarn</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
      <p>This link expires in 24 hours.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    await this.send(to, subject, html);
  }

  async sendResetPasswordEmail(to: string, resetUrl: string): Promise<void> {
    const subject = "Reset your password - FixAndEarn";
    const html = `
      <h1>FixAndEarn</h1>
      <p>We received a request to reset your password.</p>
      <p>Click the link below to set a new password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link expires in 15 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;
    await this.send(to, subject, html);
  }

  public async send(to: string, subject: string, html: string): Promise<void> {
    // Always log the email content to console (for Railway logs)
    this.logger.warn(`📧 Email content (attempting to send):`);
    this.logger.warn(`To: ${to}`);
    this.logger.warn(`Subject: ${subject}`);
    this.logger.warn(`Body: ${html}`);
    this.logger.warn(`You can copy the verification link from the body and open it in your browser.`);

    if (!this.transporter) {
      this.logger.warn(`No SMTP transporter configured. Email not sent.`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent successfully: ${subject} to ${to}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send email: ${message}`);
      // Do not rethrow – content is already logged, so user can still verify manually.
    }
  }
}