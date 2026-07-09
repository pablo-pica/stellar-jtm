import { describe, it, expect } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import InfoTooltip from "./InfoTooltip";

describe("InfoTooltip Component Tests", () => {
  it("should export a function for InfoTooltip", () => {
    expect(typeof InfoTooltip).toBe("function");
  });

  it("should contain hover and click events with tooltip animate bubble", () => {
    const filePath = path.resolve(__dirname, "./InfoTooltip.tsx");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // Events triggers
    expect(fileContent).toContain("onMouseEnter");
    expect(fileContent).toContain("onMouseLeave");
    expect(fileContent).toContain("onClick");

    // HelpCircle icon representation
    expect(fileContent).toContain("HelpCircle");

    // Framer motion bubble checks
    expect(fileContent).toContain("AnimatePresence");
    expect(fileContent).toContain("motion.div");
  });
});
