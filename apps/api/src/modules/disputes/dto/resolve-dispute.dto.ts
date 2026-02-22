import { IsEnum } from "class-validator";
import { DisputeResolutionType } from "@prisma/client";

export class ResolveDisputeDto {
  @IsEnum(DisputeResolutionType)
  resolutionType!: DisputeResolutionType;
}