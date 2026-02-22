// Path: /apps/api/src/modules/jobs/dto/apply-job.dto.ts
import { IsOptional, IsString, MaxLength } from "class-validator";

export class ApplyJobDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
