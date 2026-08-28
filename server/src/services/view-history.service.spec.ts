import type { Repository } from "typeorm";
import { ViewHistory } from "../entities/view-history.entity";
import { ViewHistoryService } from "./view-history.service";

describe("ViewHistoryService visibility", () => {
  it("returns only history for approved wallpapers", async () => {
    const findAndCount = jest.fn().mockResolvedValue([[], 0]);
    const service = new ViewHistoryService({
      findAndCount,
    } as unknown as Repository<ViewHistory>);

    await service.getUserViewHistory(5, 1, 20);

    expect(findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 5, wallpaper: { status: 1 } },
      }),
    );
  });
});

describe("ViewHistoryService recordGuestView", () => {
  const createService = () =>
    new ViewHistoryService({} as unknown as Repository<ViewHistory>);

  afterEach(() => {
    jest.useRealTimers();
  });

  it("counts the first guest view and rejects the same IP+wallpaper within the window", () => {
    const service = createService();
    expect(service.recordGuestView("203.0.113.10", 98)).toBe(true);
    expect(service.recordGuestView("203.0.113.10", 98)).toBe(false);
  });

  it("still counts a different IP or wallpaper", () => {
    const service = createService();
    expect(service.recordGuestView("203.0.113.10", 98)).toBe(true);
    expect(service.recordGuestView("198.51.100.2", 98)).toBe(true);
    expect(service.recordGuestView("203.0.113.10", 87)).toBe(true);
  });

  it("counts again after the 1 hour window", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-08-28T00:00:00Z"));
    const service = createService();
    expect(service.recordGuestView("203.0.113.10", 98)).toBe(true);
    jest.setSystemTime(new Date("2026-08-28T00:59:59Z"));
    expect(service.recordGuestView("203.0.113.10", 98)).toBe(false);
    jest.setSystemTime(new Date("2026-08-28T01:00:00Z"));
    expect(service.recordGuestView("203.0.113.10", 98)).toBe(true);
  });
});

describe("ViewHistoryService recordView", () => {
  const createService = (query: jest.Mock) => {
    const qr = {
      connect: jest.fn().mockResolvedValue(undefined),
      query,
      release: jest.fn().mockResolvedValue(undefined),
    };
    const service = new ViewHistoryService({
      manager: {
        connection: {
          createQueryRunner: jest.fn().mockReturnValue(qr),
        },
      },
    } as unknown as Repository<ViewHistory>);
    return { service, qr };
  };

  const dupError = (): Error & { code: string } => {
    const err = new Error("Duplicate entry") as Error & { code: string };
    err.code = "ER_DUP_ENTRY";
    return err;
  };

  it("counts on first insert", async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.startsWith("INSERT")) {
        return Promise.resolve({ insertId: 1 });
      }
      return Promise.resolve({ affectedRows: 1 });
    });
    const { service } = createService(query);

    await expect(service.recordView(7, 98)).resolves.toBe(true);
    expect(query).toHaveBeenCalledWith(
      "UPDATE wallpapers SET view_count = view_count + 1, updated_at = updated_at WHERE id = ?",
      [98],
    );
  });

  it("does not count when mysql2 reports 0 affectedRows in an array", async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.startsWith("INSERT")) {
        return Promise.reject(dupError());
      }
      if (sql.startsWith("UPDATE view_history")) {
        return Promise.resolve([{ affectedRows: 0 }]);
      }
      return Promise.resolve({ affectedRows: 1 });
    });
    const { service } = createService(query);

    await expect(service.recordView(7, 98)).resolves.toBe(false);
    expect(query).not.toHaveBeenCalledWith(
      expect.stringContaining("view_count"),
      expect.anything(),
    );
  });

  it("counts after the 1 hour window when mysql2 returns ResultSetHeader[]", async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.startsWith("INSERT")) {
        return Promise.reject(dupError());
      }
      if (sql.startsWith("UPDATE view_history")) {
        return Promise.resolve([{ affectedRows: 1 }]);
      }
      return Promise.resolve({ affectedRows: 1 });
    });
    const { service } = createService(query);

    await expect(service.recordView(7, 98)).resolves.toBe(true);
    expect(query).toHaveBeenCalledWith(
      "UPDATE wallpapers SET view_count = view_count + 1, updated_at = updated_at WHERE id = ?",
      [98],
    );
  });

  it("counts after the 1 hour window when mysql2 returns a single ResultSetHeader", async () => {
    const query = jest.fn().mockImplementation((sql: string) => {
      if (sql.startsWith("INSERT")) {
        return Promise.reject(dupError());
      }
      if (sql.startsWith("UPDATE view_history")) {
        return Promise.resolve({ affectedRows: 1 });
      }
      return Promise.resolve({ affectedRows: 1 });
    });
    const { service } = createService(query);

    await expect(service.recordView(7, 98)).resolves.toBe(true);
    expect(query).toHaveBeenCalledWith(
      "UPDATE wallpapers SET view_count = view_count + 1, updated_at = updated_at WHERE id = ?",
      [98],
    );
  });
});
