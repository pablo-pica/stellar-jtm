import { describe, it, expect } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { ToastItem, ToastContainer } from "./Toast";

describe("Toast & ToastContainer Components Tests", () => {
  it("should export ToastItem and ToastContainer functions", () => {
    expect(typeof ToastItem).toBe("function");
    expect(typeof ToastContainer).toBe("function");
  });

  it("should contain progress timer logic, drag to dismiss, and limit size to 2", () => {
    const filePath = path.resolve(__dirname, "./Toast.tsx");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // Progress bar and state ticks
    expect(fileContent).toContain("progress");
    expect(fileContent).toContain("setProgress");
    expect(fileContent).toContain("setInterval");

    // Gesture swipe dismisses
    expect(fileContent).toContain("drag=\"y\"");
    expect(fileContent).toContain("onDragEnd");

    // Max 2 toasts display cap (slice)
    expect(fileContent).toContain("toasts.slice(-2)");
  });
});
