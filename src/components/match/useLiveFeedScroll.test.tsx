import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useLiveFeedScroll } from "./useLiveFeedScroll";

function Feed({ count, stream = "all" }: { count: number; stream?: string }) {
  const feed = useLiveFeedScroll(count, true, stream);
  return (
    <>
      <div data-testid="feed" ref={feed.feedRef} onScroll={feed.onScroll} />
      {!feed.following && (
        <button type="button" onClick={feed.jumpToLive}>
          Live
        </button>
      )}
    </>
  );
}

describe("live feed scrolling", () => {
  it("preserves the reading position when new events arrive and resumes on demand", () => {
    const view = render(<Feed count={1} />);
    const element = screen.getByTestId("feed");
    Object.defineProperties(element, {
      scrollHeight: { value: 1000 },
      clientHeight: { value: 200 },
    });
    element.scrollTop = 300;
    fireEvent.scroll(element);
    view.rerender(<Feed count={2} />);
    expect(element.scrollTop).toBe(300);
    fireEvent.click(screen.getByText("Live"));
    expect(element.scrollTop).toBe(1000);
    expect(screen.queryByText("Live")).not.toBeInTheDocument();
  });
  it("automatically follows events again when the reader scrolls to the bottom", () => {
    const view = render(<Feed count={1} />);
    const element = screen.getByTestId("feed");
    Object.defineProperties(element, {
      scrollHeight: { value: 1000 },
      clientHeight: { value: 200 },
    });
    element.scrollTop = 200;
    fireEvent.scroll(element);
    element.scrollTop = 800;
    fireEvent.scroll(element);
    act(() => view.rerender(<Feed count={2} />));
    expect(element.scrollTop).toBe(1000);
  });
  it("follows a newly selected event stream even when its length is unchanged", () => {
    const view = render(<Feed count={2} />);
    const element = screen.getByTestId("feed");
    Object.defineProperties(element,{scrollHeight:{value:1000},clientHeight:{value:200}});
    element.scrollTop=200; fireEvent.scroll(element);
    view.rerender(<Feed count={2} stream="goals" />);
    expect(element.scrollTop).toBe(1000);
    expect(screen.queryByText("Live")).not.toBeInTheDocument();
  });
});
