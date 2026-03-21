import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class UpdateAdminSettingsDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1)
  commissionRate?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000000)
  fecRateNaira?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000000)
  jobPostingFeeMilliFec?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000000)
  firstDepositMinMilliFec?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000000)
  firstDepositMaxMilliFec?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000000)
  generalDepositMinMilliFec?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000000)
  withdrawalMinMilliFec?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000000)
  withdrawalMaxMilliFec?: number;

  @IsOptional()
  @IsBoolean()
  requireNin?: boolean;

  @IsOptional()
  @IsBoolean()
  requireBvnForFixerBankDetails?: boolean;

  @IsOptional()
  @IsBoolean()
  requireUtilityBill?: boolean;

  @IsOptional()
  @IsBoolean()
  requireLiveSelfie?: boolean;

  @IsOptional()
  @IsBoolean()
  forceVerificationBeforePosting?: boolean;

  @IsOptional()
  @IsBoolean()
  forceVerificationBeforeApplying?: boolean;

  @IsOptional()
  @IsBoolean()
  moderationEnablePhoneNumberFlag?: boolean;

  @IsOptional()
  @IsBoolean()
  moderationEnableWhatsappFlag?: boolean;

  @IsOptional()
  @IsBoolean()
  moderationEnableOffPlatformPaymentFlag?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  moderationAutoActionStrikeThreshold?: number;

  @IsOptional()
  @IsBoolean()
  moderationAutoSuspendEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  allowedWithdrawalRoles?: string[];
}