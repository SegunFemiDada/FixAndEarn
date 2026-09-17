import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiTags,
} from "@nestjs/swagger";
import { AdminRole } from "@prisma/client";
import { Public } from "../../common/auth/public.decorator";
import { AdminJwtAuthGuard } from "../auth/admin-jwt-auth.guard";
import { AdminRolesGuard } from "../auth/admin-roles.guard";
import { AdminRoles } from "../auth/admin-roles.decorator";
import { AdminUserSearchDto } from "./dto/admin-user-search.dto";
import { AdminUserActionDto } from "./dto/admin-user-action.dto";
import { AdminUsersService } from "./admin-users.service";
import { AdminUserUpdateDto } from "./dto/admin-user-update.dto";
import { AdminDeletionDependencyService } from "./admin-deletion-dependency.service";

@Public()
@ApiTags("admin-users")
@ApiBearerAuth()
@UseGuards(
  AdminJwtAuthGuard,
  AdminRolesGuard,
)
@Controller("admin/users")
export class AdminUsersController {
  constructor(
    private readonly svc: AdminUsersService,
    private readonly deletionDependencies: AdminDeletionDependencyService,
  ) {}

  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.SUPPORT_OFFICER,
    AdminRole.SECURITY_OFFICER,
    AdminRole.VERIFICATION_OFFICER,
    AdminRole.FINANCE_OFFICER,
  )
  @Get()
  async search(
    @Query() q: AdminUserSearchDto,
  ) {
    return this.svc.search({
      q: q.q,
      role: q.role,
      verificationStatus: q.verificationStatus,
      skip: q.skip ?? 0,
      take: q.take ?? 20,
    });
  }

  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.SUPPORT_OFFICER,
  )
  @Get("deletion-requests")
  async getDeletionRequests(
    @Query("status")
    status?:
      | "PENDING"
      | "APPROVED"
      | "REJECTED",
  ) {
    return this.svc.getDeletionRequests(status);
  }

  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.SUPPORT_OFFICER,
  )
  @Get(":id/deletion-dependencies")
  async getDeletionDependencies(
    @Param("id") id: string,
  ) {
    return this.deletionDependencies.getDependencies(id);
  }

  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.SUPPORT_OFFICER,
  )
  @Post(":id/approve-deletion")
  async approveDeletion(
    @Param("id") id: string,
    @Req() req: any,
  ) {
    await this.deletionDependencies.assertCanApprove(id);

    return this.svc.approveDeletion(
      id,
      {
        adminId: req.user.adminId,
        role: req.user.role,
      },
    );
  }

  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.SUPPORT_OFFICER,
  )
  @Post(":id/reject-deletion")
  async rejectDeletion(
    @Param("id") id: string,
    @Body()
    body: {
      reason?: string;
    },
    @Req() req: any,
  ) {
    return this.svc.rejectDeletion(
      id,
      body.reason,
      {
        adminId: req.user.adminId,
        role: req.user.role,
      },
    );
  }

  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.SUPPORT_OFFICER,
    AdminRole.SECURITY_OFFICER,
    AdminRole.VERIFICATION_OFFICER,
    AdminRole.FINANCE_OFFICER,
  )
  @Get(":id/investigation")
  async getInvestigation(
    @Req() req: any,
    @Param("id") id: string,
  ) {
    return this.svc.getUserInvestigation(
      id,
      {
        adminId: req.user.adminId,
        role: req.user.role,
      },
    );
  }

  @Get(":id")
  async getOne(
    @Req() req: any,
    @Param("id") id: string,
  ) {
    return this.svc.getUser(
      id,
      {
        adminId: req.user.adminId,
        role: req.user.role,
      },
    );
  }

  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.SUPPORT_OFFICER,
    AdminRole.SECURITY_OFFICER,
  )
  @Post(":id/suspend")
  async suspend(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: AdminUserActionDto,
  ) {
    return this.svc.suspend(
      id,
      {
        adminId: req.user.adminId,
        role: req.user.role,
      },
      dto.reason,
    );
  }

  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.SUPPORT_OFFICER,
    AdminRole.SECURITY_OFFICER,
  )
  @Post(":id/unsuspend")
  async unsuspend(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: AdminUserActionDto,
  ) {
    return this.svc.unsuspend(
      id,
      {
        adminId: req.user.adminId,
        role: req.user.role,
      },
      dto.reason,
    );
  }

  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.SECURITY_OFFICER,
  )
  @Post(":id/force-reverify")
  async forceReverify(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: AdminUserActionDto,
  ) {
    return this.svc.forceReverify(
      id,
      {
        adminId: req.user.adminId,
        role: req.user.role,
      },
      dto.reason,
    );
  }

  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.SUPPORT_OFFICER,
    AdminRole.SECURITY_OFFICER,
  )
  @Post(":id/notes")
  async notes(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: AdminUserActionDto,
  ) {
    return this.svc.setNotes(
      id,
      {
        adminId: req.user.adminId,
        role: req.user.role,
      },
      dto.notes,
    );
  }

  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.SUPPORT_OFFICER,
  )
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: AdminUserUpdateDto,
    @Req() req: any,
  ) {
    return this.svc.updateUser(
      id,
      {
        adminId: req.user.adminId,
        role: req.user.role,
      },
      dto,
    );
  }

  @AdminRoles(
    AdminRole.SUPER_ADMIN,
    AdminRole.SUPPORT_OFFICER,
  )
  @Post(":id/reset-withdrawal-pin")
  async resetWithdrawalPin(
    @Param("id") id: string,
    @Req() req: any,
  ) {
    return this.svc.resetWithdrawalPin(
      id,
      {
        adminId: req.user.adminId,
        role: req.user.role,
      },
    );
  }
}
