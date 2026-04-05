import { Body, Controller, Post } from "@nestjs/common";
import { EmailService } from "../email/email.service";

@Controller("support")
export class SupportController {
  constructor(private readonly email: EmailService) {}

  @Post("contact")
  async contact(@Body() body: { userId?: string; subject: string; message: string }) {
    const { userId, subject, message } = body;
    const userInfo = userId ? `User ID: ${userId}` : "Guest";
    const html = `
      <h2>New support message</h2>
      <p><strong>${userInfo}</strong></p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong><br/>${message.replace(/\n/g, "<br/>")}</p>
    `;
    await this.email.send("support@fixandearn.com", `Support: ${subject}`, html);
    return { ok: true };
  }
}