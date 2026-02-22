import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class ListWithdrawalsDto {
  @IsOptional()
  @IsIn(["PENDING", "APPROVED", "REJECTED", "PAID"])
  status?: "PENDING" | "APPROVED" | "REJECTED" | "PAID";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}
