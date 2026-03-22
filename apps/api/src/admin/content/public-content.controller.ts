import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PublicContentService } from "./public-content.service";

@ApiTags("content")
@Controller("content")
export class PublicContentController {
  constructor(private readonly svc: PublicContentService) {}

  @Get("overview")
  async overview() {
    return this.svc.getPublicContentOverview();
  }

  @Get("terms")
  async terms() {
    return this.svc.getTerms();
  }

  @Get("privacy")
  async privacy() {
    return this.svc.getPrivacy();
  }

  @Get("faq")
  async faq() {
    return this.svc.getFaq();
  }

  @Get("support")
  async support() {
    return this.svc.getSupport();
  }

  @Get("skills")
  async skills() {
    return this.svc.getSkills();
  }

  @Get("banks")
  async banks() {
    return this.svc.getBanks();
  }
}