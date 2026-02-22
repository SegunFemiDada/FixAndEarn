// Path: apps/api/src/modules/jobs/dto/list-job-applications.query.ts
import { IsInt, IsOptional, Min } from "class-validator";
import { Type } from "class-transformer";

export class ListJobApplicationsQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number;
}
