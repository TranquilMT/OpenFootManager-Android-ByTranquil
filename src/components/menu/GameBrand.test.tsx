import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { GameBrand } from "./GameBrand";

it("keeps the original mark and adds the TOUCH wordmark as one accessible logo", () => {
  const { container } = render(<GameBrand />);
  expect(screen.getByRole("img", { name: "OFMtouch" })).toBeInTheDocument();
  expect(container.querySelector('img[src="/openfootlogo.svg"]')).toBeInTheDocument();
  expect(container.querySelector('img[src="/ofmtouch-wordmark.png"]')).toBeInTheDocument();
});
