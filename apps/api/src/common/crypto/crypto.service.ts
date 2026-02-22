import { Injectable } from "@nestjs/common";
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

type EncryptedValue = {
  ciphertextB64: string; // includes auth tag
  ivB64: string;
};

@Injectable()
export class CryptoService {
  private getKey(): Buffer {
    const keyB64 = process.env.BANK_ENCRYPTION_KEY_B64;
    if (!keyB64) {
      throw new Error("BANK_ENCRYPTION_KEY_B64 is required");
    }
    const key = Buffer.from(keyB64, "base64");
    if (key.length !== 32) {
      throw new Error("BANK_ENCRYPTION_KEY_B64 must be a 32-byte key encoded in base64");
    }
    return key;
  }

  encryptAes256Gcm(plaintext: string): EncryptedValue {
    const key = this.getKey();
    const iv = randomBytes(12);

    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    const ciphertextPlusTag = Buffer.concat([enc, tag]);

    return {
      ciphertextB64: ciphertextPlusTag.toString("base64"),
      ivB64: iv.toString("base64")
    };
  }

  decryptAes256Gcm(ciphertextB64: string, ivB64: string): string {
    const key = this.getKey();
    const iv = Buffer.from(ivB64, "base64");
    const payload = Buffer.from(ciphertextB64, "base64");

    if (payload.length < 16) {
      throw new Error("Invalid ciphertext payload");
    }

    const tag = payload.subarray(payload.length - 16);
    const enc = payload.subarray(0, payload.length - 16);

    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);

    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return dec.toString("utf8");
  }
}
