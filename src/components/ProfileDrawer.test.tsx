import { describe, it, expect } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import ProfileDrawer from "./ProfileDrawer";

describe("ProfileDrawer Layout & Styling Tests", () => {
  it("should export a function for ProfileDrawer", () => {
    expect(typeof ProfileDrawer).toBe("function");
  });

  it("should use absolute positioning instead of fixed for mockup containment", () => {
    const filePath = path.resolve(__dirname, "./ProfileDrawer.tsx");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // The root wrapper should contain 'absolute' positioning, and not 'fixed' for the container
    expect(fileContent).toContain("absolute inset-0 z-50 overflow-hidden");
    expect(fileContent).not.toContain("fixed inset-0 z-50 overflow-hidden");
  });

  it("should span exactly 80% of the viewport width for mobile UX", () => {
    const filePath = path.resolve(__dirname, "./ProfileDrawer.tsx");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // The wrapper should have w-[80%] and no pl-10 or max-w-full
    expect(fileContent).toContain("absolute inset-y-0 right-0 flex w-[80%]");
    expect(fileContent).not.toContain("max-w-full pl-10");

    // The drawer panel should have w-full and not w-screen max-w-md
    expect(fileContent).toContain("w-full transform transition-transform duration-300 ease-out glass-panel");
    expect(fileContent).not.toContain("w-screen max-w-md");
  });
});
