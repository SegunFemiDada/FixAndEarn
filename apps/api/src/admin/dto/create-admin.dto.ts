import { IsEmail, IsEnum, IsString, MinLength } from "class-validator";
import { AdminRole } from "@prisma/client";

export class CreateAdminDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsString()
  @MinLength(10)
  password!: string;

  @IsEnum(AdminRole)
  role!: AdminRole;
}