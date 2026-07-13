import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import type { DataSource, EntityManager, Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { User, UserRole } from "../entities/user.entity";
import { UploadService } from "./upload.service";
import { UserService } from "./user.service";

describe("UserService authentication", () => {
  const password = "secure-password";

  it.each(["wanderer", "wanderer@example.com"])(
    "allows login with %s",
    async (account) => {
      const user = Object.assign(new User(), {
        username: "wanderer",
        email: "wanderer@example.com",
        passwordHash: await bcrypt.hash(password, 4),
        status: 1,
      });
      const findOne = jest.fn().mockResolvedValue(user);
      const service = createService({ findOne });

      await expect(service.validateUser(account, password)).resolves.toBe(user);
      const firstCall = findOne.mock.calls.at(0) as unknown[] | undefined;
      const query = firstCall?.[0] as {
        where: Array<{ username?: string; email?: string }>;
      };
      expect(query.where[0].username).toBe(account);
      expect(query.where[1].email).toBe(account.toLowerCase());
    },
  );

  it("creates an account without assigning a database id", async () => {
    const create = jest.fn((value: Partial<User>) =>
      Object.assign(new User(), value),
    );
    const save = jest.fn((user: User) =>
      Promise.resolve(Object.assign(user, { id: 12 })),
    );
    const service = createService({
      findOne: jest.fn().mockResolvedValue(null),
      create,
      save,
    });

    const user = await service.create({
      username: "  wanderer  ",
      email: "USER@EXAMPLE.COM",
      password,
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "wanderer",
        email: "user@example.com",
      }),
    );
    expect(create.mock.calls[0][0]).not.toHaveProperty("id");
    expect(user.id).toBe(12);
  });

  it("maps a concurrent unique conflict to a stable 409", async () => {
    const service = createService({
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value: Partial<User>) =>
        Object.assign(new User(), value),
      ),
      save: jest.fn().mockRejectedValue({ code: "ER_DUP_ENTRY" }),
    });

    await expect(
      service.create({ username: "wanderer", password }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("changePassword requires current password and updates hash", async () => {
    const current = "admin123";
    const next = "Admin1234!";
    const user = Object.assign(new User(), {
      id: 100001,
      username: "admin",
      passwordHash: await bcrypt.hash(current, 4),
      status: 1,
    });
    const save = jest.fn((u: User) => Promise.resolve(u));
    const service = createService({
      findOne: jest.fn().mockResolvedValue(user),
      save,
    });

    await expect(
      service.changePassword(100001, {
        currentPassword: "wrong",
        newPassword: next,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    await expect(
      service.changePassword(100001, {
        currentPassword: current,
        newPassword: current,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await service.changePassword(100001, {
      currentPassword: current,
      newPassword: next,
    });
    expect(save).toHaveBeenCalled();
    const saved = save.mock.calls[0][0];
    await expect(bcrypt.compare(next, saved.passwordHash)).resolves.toBe(true);
  });
});

describe("UserService active administrator guard", () => {
  const actor = { userId: 8, role: UserRole.SUPER_ADMIN };

  it.each([
    [
      "delete",
      (service: UserService) => service.remove(7, actor),
      "不能删除最后一个管理员账号",
    ],
    [
      "disable",
      (service: UserService) => service.setStatus(7, 0, actor),
      "不能禁用最后一个管理员账号",
    ],
    [
      "demote",
      (service: UserService) =>
        service.adminUpdateUser(7, { role: UserRole.USER }, actor),
      "不能降级最后一个管理员账号",
    ],
  ])(
    "rejects %s for the last active administrator",
    async (_name, run, message) => {
      const target = createAdmin(7);
      const context = createTransactionalService([target], target);

      await expect(run(context.service)).rejects.toThrow(message);
      expect(context.transaction).toHaveBeenCalledTimes(1);
      expect(context.activeAdminsQuery.setLock).toHaveBeenCalledWith(
        "pessimistic_write",
      );
      expect(context.targetQuery.setLock).toHaveBeenCalledWith(
        "pessimistic_write",
      );
      expect(context.save).not.toHaveBeenCalled();
      expect(context.deleteAvatar).not.toHaveBeenCalled();
    },
  );

  it("deletes the avatar only after the user transaction commits", async () => {
    const target = createAdmin(7, "custom.webp");
    const otherAdmin = createAdmin(8);
    const events: string[] = [];
    const context = createTransactionalService(
      [target, otherAdmin],
      target,
      events,
    );

    await context.service.remove(target.id, actor);

    expect(events).toEqual(["save", "commit", "deleteAvatar"]);
    expect(context.deleteAvatar).toHaveBeenCalledWith("custom.webp");
  });
});

function createService(
  repository: Record<string, unknown>,
  dataSource: Partial<DataSource> = {},
  uploadService: Partial<UploadService> = {},
): UserService {
  return new UserService(
    repository as unknown as Repository<User>,
    uploadService as UploadService,
    dataSource as DataSource,
  );
}

function createAdmin(id: number, avatarUrl = "defaultAvatar.png"): User {
  return Object.assign(new User(), {
    id,
    username: `admin_${id}`,
    passwordHash: "hash",
    avatarUrl,
    status: 1,
    role: UserRole.ADMIN,
    deletedAt: null,
  });
}

function createLockQuery() {
  const query = {
    setLock: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    getMany: jest.fn(),
    getOne: jest.fn(),
  };
  query.setLock.mockReturnValue(query);
  query.where.mockReturnValue(query);
  query.andWhere.mockReturnValue(query);
  query.orderBy.mockReturnValue(query);
  return query;
}

function createTransactionalService(
  activeAdmins: User[],
  target: User,
  events: string[] = [],
) {
  const activeAdminsQuery = createLockQuery();
  activeAdminsQuery.getMany.mockResolvedValue(activeAdmins);
  const targetQuery = createLockQuery();
  targetQuery.getOne.mockResolvedValue(target);

  const save = jest.fn((user: User) => {
    events.push("save");
    return Promise.resolve(user);
  });
  const repository = {
    createQueryBuilder: jest
      .fn()
      .mockReturnValueOnce(activeAdminsQuery)
      .mockReturnValueOnce(targetQuery),
    findOne: jest.fn(),
    save,
  };
  const manager = {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as EntityManager;
  const transaction = jest.fn(
    async (callback: (entityManager: EntityManager) => Promise<unknown>) => {
      const result = await callback(manager);
      events.push("commit");
      return result;
    },
  );
  const deleteAvatar = jest.fn(() => {
    events.push("deleteAvatar");
    return Promise.resolve();
  });

  return {
    service: createService(
      repository,
      { transaction } as unknown as DataSource,
      { deleteAvatar },
    ),
    transaction,
    activeAdminsQuery,
    targetQuery,
    save,
    deleteAvatar,
  };
}
