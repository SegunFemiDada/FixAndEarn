// Path: /apps/api/src/modules/verification/providers/stub-face-match.provider.ts
import { Injectable } from "@nestjs/common";
import { FaceMatchProvider } from "./face-match.provider";
import { createHash } from "crypto";

@Injectable()
export class StubFaceMatchProvider implements FaceMatchProvider {
  async generateFaceHash(selfiePath: string): Promise<string> {
    return createHash("sha256").update(selfiePath).digest("hex");
  }
}
