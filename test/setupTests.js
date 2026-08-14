import { vi } from "vitest";
import "@testing-library/jest-dom";

const ResizeObserverMock = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.stubGlobal("ResizeObserver", ResizeObserverMock);
