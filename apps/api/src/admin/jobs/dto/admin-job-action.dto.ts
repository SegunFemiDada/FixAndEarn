import { IsString, MinLength } from "class-validator";

export class AdminJobActionDto {
  @IsString()
  @MinLength(3)
  reason!: string;
}