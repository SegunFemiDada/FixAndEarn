//path: apps/api/src/admin/verification/dto/list-pending.dto.ts
import { IsInt, IsOptional, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class ListPendingVerificationsDto {
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
