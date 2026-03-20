import { IsIn, IsISO8601, IsOptional } from "class-validator";

export class GetAdminAnalyticsDto {
  @IsOptional()
  @IsIn(["day", "week", "month", "year", "all"])
  range?: "day" | "week" | "month" | "year" | "all";

  @IsOptional()
  @IsISO8601()
  anchor?: string;
}