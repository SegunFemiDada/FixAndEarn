//path: apps/api/src/admin/users/dto/admin-user-search.dto.ts
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class AdminUserSearchDto {
  @IsOptional()
  @IsString()
  q?: string; // email or name partial

  @IsOptional()
  @IsIn(["CLIENT", "FIXER"])
  role?: "CLIENT" | "FIXER";

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
