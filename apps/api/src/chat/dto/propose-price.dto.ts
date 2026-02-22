import { IsInt, Min } from 'class-validator';

export class ProposePriceDto {
  @IsInt()
  @Min(1)
  proposedPriceMilliFec!: number; // 1 = ₦1
}
