// Path: /apps/api/src/modules/wallet/dto/webhook-simulate.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString } from "class-validator";

export class WebhookSimulateDto {
  @ApiProperty()
  @IsString()
  paystackRef!: string;

  @ApiProperty({ enum: ["success", "failed"] })
  @IsIn(["success", "failed"])
  status!: "success" | "failed";
}
