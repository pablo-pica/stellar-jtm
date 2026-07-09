import { describe, it, expect } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import SegmentedControl from "./SegmentedControl";

describe("SegmentedControl Component Tests", () => {
  it("should export a function for SegmentedControl", () => {
    expect(typeof SegmentedControl).toBe("function");
  });

  it("should support custom option maps and framer-motion slide animation", () => {
    const filePath = path.resolve(__dirname, "./SegmentedControl.tsx");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // Must utilize Framer Motion's layoutId for smooth background transition
    expect(fileContent).toContain("layoutId");
    expect(fileContent).toContain("motion.div");
    expect(fileContent).toContain("options.map");

    // Border and background styling tokens
    expect(fileContent).toContain("border-space-700/50");
    expect(fileContent).toContain("bg-space-950/60");
  });
});
