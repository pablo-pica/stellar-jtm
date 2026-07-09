import { describe, it, expect } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import BottomSheet from "./BottomSheet";

describe("BottomSheet Component Tests", () => {
  it("should export a function for BottomSheet", () => {
    expect(typeof BottomSheet).toBe("function");
  });

  it("should contain drag gestures and dark glass panel styling", () => {
    const filePath = path.resolve(__dirname, "./BottomSheet.tsx");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // Must use framer-motion AnimatePresence and motion divs
    expect(fileContent).toContain("AnimatePresence");
    expect(fileContent).toContain("motion.div");
    
    // Must feature gesture components
    expect(fileContent).toContain("drag=\"y\"");
    expect(fileContent).toContain("onDragEnd");

    // Must styled with space-800 matching card surfaces and border
    expect(fileContent).toContain("bg-space-800");
    expect(fileContent).toContain("border-t");

    // Must feature a drag handle bar at the top
    expect(fileContent).toContain("rounded-full");
  });
});
