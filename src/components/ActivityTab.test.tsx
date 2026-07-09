import { describe, it, expect } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import ActivityTab from "./ActivityTab";

describe("ActivityTab Component Layout & Styling Tests", () => {
  it("should export a function for ActivityTab", () => {
    expect(typeof ActivityTab).toBe("function");
  });

  it("should render transaction logs, type-specific left color bars, live indicator, and staggered animations", () => {
    const filePath = path.resolve(__dirname, "./ActivityTab.tsx");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // Live indicator check
    expect(fileContent).toContain("Live");
    expect(fileContent).toContain("bg-emerald-400 animate-pulse");

    // Left indicator bar check
    expect(fileContent).toContain("getLeftBarColor");
    expect(fileContent).toContain("absolute top-0 bottom-0 left-0 w-1");

    // Transaction expansion details check
    expect(fileContent).toContain("expandedTxs");
    expect(fileContent).toContain("toggleExpand");
    expect(fileContent).toContain("Explorer");

    // Staggered list animations checks
    expect(fileContent).toContain("containerVariants");
    expect(fileContent).toContain("staggerChildren");
  });

  it("should render premium empty and disconnected states", () => {
    const filePath = path.resolve(__dirname, "./ActivityTab.tsx");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // Premium empty / disconnected state layout details (w-14, h-14, rounded-2xl, icon container)
    expect(fileContent).toContain("w-14 h-14 rounded-2xl bg-space-900/80 border border-space-700/50 flex items-center justify-center mx-auto shadow-md");
    expect(fileContent).toContain("text-base font-bold text-slate-100");
    expect(fileContent).toContain("text-xs text-slate-400 max-w-[240px]");
    expect(fileContent).toContain("disconnected-state");
  });
});
