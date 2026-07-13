import { AdminDashboardController } from "./admin-dashboard.controller";
import { AdminDashboardService } from "../../services/admin-dashboard.service";

describe("AdminDashboardController", () => {
  it.each([
    [undefined, 8],
    ["abc", 8],
    ["0", 1],
    ["100", 20],
  ])("normalizes activity limit %p", async (input, expected) => {
    const getRecentActivity = jest.fn().mockResolvedValue([]);
    const controller = new AdminDashboardController({
      getRecentActivity,
    } as unknown as AdminDashboardService);

    await controller.getRecentActivity(input);

    expect(getRecentActivity).toHaveBeenCalledWith(expected);
  });
});
