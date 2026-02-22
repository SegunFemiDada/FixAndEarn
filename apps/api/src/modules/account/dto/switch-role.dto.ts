// Path: /apps/api/src/modules/account/dto/switch-role.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";

export class SwitchRoleDto {
  @ApiProperty({ enum: ["CLIENT", "FIXER"] })
  @IsIn(["CLIENT", "FIXER"])
  role!: "CLIENT" | "FIXER";
}
