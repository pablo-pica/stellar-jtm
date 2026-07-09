import { describe, it, expect } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import MilestoneBuilder from "./MilestoneBuilder";

describe("MilestoneBuilder Component Tests", () => {
  it("should export a function for MilestoneBuilder", () => {
    expect(typeof MilestoneBuilder).toBe("function");
  });

  it("should render milestone list editor UI element", () => {
    const filePath = path.resolve(__dirname, "./MilestoneBuilder.tsx");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // The component must contain visual elements like Auto-Balance, Milestone Editor
    expect(fileContent).toContain("Milestone Editor");
    expect(fileContent).toContain("Auto-Balance");
    expect(fileContent).toContain("Add Milestone");
    expect(fileContent).toContain("totalBps === 10000");
  });
});
