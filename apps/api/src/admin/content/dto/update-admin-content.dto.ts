import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class AdminNotificationTemplateDto {
  @IsString()
  @MaxLength(100)
  key!: string;

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  @MaxLength(5000)
  body!: string;

  @IsBoolean()
  isEnabled!: boolean;
}

export class UpdateAdminContentDto {
  @IsOptional()
  @IsString()
  @MaxLength(50000)
  userAgreement?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  privacyPolicy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  faqContent?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  supportContent?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(1000)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  skillsList?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  bankList?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => AdminNotificationTemplateDto)
  notificationTemplates?: AdminNotificationTemplateDto[];
}