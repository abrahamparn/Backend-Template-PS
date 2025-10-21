import { createContainer, asFunction, asValue } from "awilix";
import prisma from "./infra/db/index.js";
import { logger } from "./infra/logger/index.js";
import { env } from "./config/index.js";
import { makeMailerService } from "./infra/mailer/index.js";
import { makeAuthService } from "./core/services/auth.service.js";
import { makeUserService } from "./core/services/user.service.js";
import { makeUserRepository } from "./core/repositories/user.repository.js";
import { makeAuthRepository } from "./core/repositories/auth.repository.js";
import { makeRbacRepository } from "./core/repositories/rbac.repository.js";

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
});

// Register repositories
container.register({
  userRepository: asFunction(makeUserRepository).singleton(),
  authRepository: asFunction(makeAuthRepository).singleton(),
  rbacRepository: asFunction(makeRbacRepository).singleton(),
});

export default container;
