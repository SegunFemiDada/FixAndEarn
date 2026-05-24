//path: apps/api/src/chat/dto/accept-agreement.dto.ts
import { IsBoolean } from 'class-validator';

export class AcceptAgreementDto {
  @IsBoolean()
  accepted!: boolean;
}
