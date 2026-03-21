import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class SendAdminNotificationDto {
  @IsIn(["ONE", "MANY", "ALL"])
  mode!: "ONE" | "MANY" | "ALL";

  @IsString()
  @MaxLength(120)
  title!: string;

  @IsString()
  @MaxLength(5000)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  userId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(1000)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  userIds?: string[];
}