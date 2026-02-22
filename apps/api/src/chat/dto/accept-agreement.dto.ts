import { IsBoolean } from 'class-validator';

export class AcceptAgreementDto {
  @IsBoolean()
  accepted!: boolean;
}
