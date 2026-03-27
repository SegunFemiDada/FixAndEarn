//path: apps/api/src/modules/users/users.service.ts
import { Injectable } from "@nestjs/common";
import { AppRoleCode, UsersRepo } from "./users.repo";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepo) {}

  findByEmail(email: string) {
    return this.usersRepo.findByEmail(email);
  }

  findById(id: string) {
    return this.usersRepo.findById(id);
  }

  ensureRole(userId: string, roleCode: AppRoleCode) {
    return this.usersRepo.ensureUserRole(userId, roleCode);
  }

  createUser(data: { email: string; fullName: string; passwordHash: string }) {
    return this.usersRepo.createUser(data);
  }

  setEmailVerificationToken(userId: string, hash: string, expiresAt: Date) {
    return this.usersRepo.setEmailVerificationToken(userId, hash, expiresAt);
  }

  findByVerificationTokenHash(hash: string) {
    return this.usersRepo.findByVerificationTokenHash(hash);
  }

  markEmailVerified(userId: string) {
    return this.usersRepo.markEmailVerified(userId);
  }

  discoverFixers(args: {
    skill?: string;
    state?: string;
    city?: string;
    minRating?: number;
    skip?: number;
    take?: number;
  }) {
    return this.usersRepo.discoverFixers(args);
  }
}