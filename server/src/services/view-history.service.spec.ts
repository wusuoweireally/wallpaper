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
