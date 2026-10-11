import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ShootoutOrder from "./ShootoutOrder";
import type { MatchSnapshot } from "./types";
import { setShootoutOrder } from "../../services/liveMatchService";
vi.mock("../../services/liveMatchService", () => ({ setShootoutOrder: vi.fn() }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { name?: string }) =>
      options?.name ? `${key}: ${options.name}` : key,
  }),
}));
const snapshot = {
  home_team: {
    players: [
      { id: "a", name: "Alex", shooting: 70, composure: 70, condition: 90 },
      { id: "b", name: "Ben", shooting: 90, composure: 90, condition: 90 },
      { id: "c", name: "Dismissed", shooting: 99, composure: 99, condition: 90 },
    ],
  },
  home_set_pieces: { penalty_order: ["a", "b"] },
  sent_off: ["c"],
} as unknown as MatchSnapshot;
describe("shootout order", () => {
  it("excludes dismissed players and saves a complete reordered list", async () => {
    vi.mocked(setShootoutOrder).mockResolvedValue(snapshot);
    const update = vi.fn();
    render(<ShootoutOrder snapshot={snapshot} side="Home" onSnapshot={update} />);
    expect(screen.queryByText("Dismissed")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "match.shootout.earlier: Ben" }));
    await waitFor(() => expect(update).toHaveBeenCalledWith(snapshot));
    expect(setShootoutOrder).toHaveBeenCalledWith("Home", ["b", "a"]);
  });
  it("locks the order while play is running", () => {
    render(<ShootoutOrder snapshot={snapshot} side="Home" disabled onSnapshot={vi.fn()} />);
    for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
  });
  it("shows a translated error when saving fails", async () => {
    vi.mocked(setShootoutOrder).mockRejectedValue(new Error("network"));
    render(<ShootoutOrder snapshot={snapshot} side="Home" onSnapshot={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "match.shootout.later: Alex" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("match.shootout.orderError");
  });
});
