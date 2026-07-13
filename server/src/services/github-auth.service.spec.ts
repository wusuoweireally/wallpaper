import { ConflictException, UnauthorizedException } from "@nestjs/common";
import type { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import type { GitHubProfile } from "../dto/github.dto";
import { GitHubAuthService } from "./github-auth.service";

describe("GitHubAuthService account status", () => {
  const profile = {
    id: 123,
    login: "octocat",
    avatar_url: "https://example.com/avatar.png",
  } as GitHubProfile;

  it.each([
    ["disabled", { status: 0, deletedAt: null }],
    ["deleted", { status: 1, deletedAt: new Date() }],
  ])("rejects an existing %s account", async (_name, state) => {
    const user = Object.assign(new User(), state, { githubId: profile.id });
    const save = jest.fn();
    const service = new GitHubAuthService({
      findOne: jest.fn().mockResolvedValue(user),
      save,
    } as unknown as Repository<User>);

    await expect(
      service.findOrCreateGitHubUser(profile),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(save).not.toHaveBeenCalled();
  });

  it("does not auto-link a GitHub email owned by a local account", async () => {
    const emailOwner = Object.assign(new User(), {
      id: 9,
      email: "owner@example.com",
      githubId: null,
    });
    const create = jest.fn();
    const save = jest.fn();
    const repository = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(emailOwner),
      create,
      save,
    } as unknown as Repository<User>;
    const service = new GitHubAuthService(repository);

    await expect(
      service.findOrCreateGitHubUser({
        ...profile,
        email: " Owner@Example.com ",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(create).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it("does not overwrite another account's email when syncing", async () => {
    const githubUser = Object.assign(new User(), {
      id: 1,
      email: null,
      githubId: profile.id,
      status: 1,
      deletedAt: null,
    });
    const emailOwner = Object.assign(new User(), {
      id: 2,
      email: "owner@example.com",
    });
    const save = jest.fn().mockImplementation((user: User) => user);
    const service = new GitHubAuthService({
      findOne: jest
        .fn()
        .mockResolvedValueOnce(githubUser)
        .mockResolvedValueOnce(emailOwner),
      save,
    } as unknown as Repository<User>);

    await service.findOrCreateGitHubUser({
      ...profile,
      email: "owner@example.com",
    });

    expect(githubUser.email).toBeNull();
    expect(save).toHaveBeenCalledWith(githubUser);
  });
});
