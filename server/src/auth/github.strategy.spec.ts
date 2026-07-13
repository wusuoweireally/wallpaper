import { ConfigService } from "@nestjs/config";
import type { PassportGitHubProfile } from "../dto/github.dto";
import { GitHubStrategy } from "./github.strategy";

describe("GitHubStrategy", () => {
  const createProfile = (
    emails: PassportGitHubProfile["emails"],
  ): PassportGitHubProfile => ({
    id: 123,
    username: "octocat",
    displayName: "Octocat",
    emails,
    _json: {
      avatar_url: "https://example.com/avatar.png",
      bio: null,
      email: "unverified@example.com",
      name: "Octocat",
      html_url: "https://github.com/octocat",
      location: null,
      blog: null,
      company: null,
      public_repos: 1,
      followers: 2,
      following: 3,
      created_at: "2020-01-01T00:00:00Z",
      updated_at: "2020-01-01T00:00:00Z",
    },
  });

  it("uses only GitHub's verified primary email", () => {
    const strategy = new GitHubStrategy(new ConfigService());
    const callback = jest.fn();
    const profile = createProfile([
      {
        value: " Verified@Example.com ",
        primary: true,
        verified: true,
        visibility: null,
      },
    ]);

    strategy.validate("access", "refresh", profile, callback);

    expect(callback).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ email: "verified@example.com" }),
    );
  });

  it("ignores an unverified email", () => {
    const strategy = new GitHubStrategy(new ConfigService());
    const callback = jest.fn();
    const profile = createProfile([
      {
        value: "unverified@example.com",
        primary: true,
        verified: false,
        visibility: null,
      },
    ]);

    strategy.validate("access", "refresh", profile, callback);

    expect(callback).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ email: "" }),
    );
  });
});
