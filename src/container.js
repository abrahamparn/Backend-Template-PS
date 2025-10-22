import { createContainer, asFunction, asValue } from "awilix";
import prisma from "./infra/db/index.js";
import { logger } from "./infra/logger/index.js";
import { env } from "./config/index.js";
import { makeMailerService } from "./infra/mailer/index.js";
import { makeAuthService } from "./core/services/auth.service.js";
import { makeUserService } from "./core/services/user.service.js";
import { makeRoleService } from "./core/services/role.service.js";
import { makeStatsService } from "./core/services/stats.service.js";
import { makeUserRepository } from "./core/repositories/user.repository.js";
import { makeAuthRepository } from "./core/repositories/auth.repository.js";
import { makeRbacRepository } from "./core/repositories/rbac.repository.js";
import { makeUserLogRepository } from "./core/repositories/userLog.repository.js";

const container = createContainer();

// Register infrastructure
container.register({
  prisma: asValue(prisma),
  logger: asValue(logger),
  env: asValue(env),
});

// Register services
container.register({
  mailerService: asFunction(makeMailerService).singleton(),
  authService: asFunction(makeAuthService).singleton(),
  userService: asFunction(makeUserService).singleton(),
  roleService: asFunction(makeRoleService).singleton(),
  statsService: asFunction(makeStatsService).singleton(),
});

// Register repositories
container.register({
  userRepository: asFunction(makeUserRepository).singleton(),
  authRepository: asFunction(makeAuthRepository).singleton(),
  rbacRepository: asFunction(makeRbacRepository).singleton(),
  userLogRepository: asFunction(makeUserLogRepository).singleton(),
});

export default container;
