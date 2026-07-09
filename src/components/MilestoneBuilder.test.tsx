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

    // The component must contain visual elements like Auto-Balance, Milestone Editor, Split Evenly
    expect(fileContent).toContain("Milestone Editor");
    expect(fileContent).toContain("Auto-Balance");
    expect(fileContent).toContain("Split Evenly");
    expect(fileContent).toContain("Add Milestone");
    expect(fileContent).toContain("totalBps === 10000");
  });

  it("should have compact row layout classes and index numbering", () => {
    const filePath = path.resolve(__dirname, "./MilestoneBuilder.tsx");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // Compact single row container checks
    expect(fileContent).toContain("flex gap-2 items-center py-2 border-b border-space-800/80 last:border-b-0");
    
    // Description input styling
    expect(fileContent).toContain("flex-1 min-w-0 h-10 bg-slate-900 border border-slate-800 focus:border-teal-500/35 rounded-xl px-3 text-xs");

    // Weight input width and styling
    expect(fileContent).toContain("flex items-center gap-1.5 shrink-0");
    expect(fileContent).toContain("w-[116px]");
    expect(fileContent).toContain("<CustomNumberInput");
    expect(fileContent).toContain("text-xs text-slate-500 font-mono select-none");
    expect(fileContent).toContain("compact={true}");

    // Remove button small trash icon
    expect(fileContent).toContain("p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400");
    expect(fileContent).toContain("Trash2 className=\"w-4 h-4\"");
  });

  it("should have Auto-Balance toggle state and logic", () => {
    const filePath = path.resolve(__dirname, "./MilestoneBuilder.tsx");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // Toggle state and helper
    expect(fileContent).toContain("const [autoBalance, setAutoBalance] = React.useState(false);");
    expect(fileContent).toContain("const balanceMilestones = (list: Milestone[]): Milestone[] => {");
    expect(fileContent).toContain("onChange(balanceMilestones(updated));");

    // Checkbox input toggle element and peer-checked animations
    expect(fileContent).toContain("type=\"checkbox\"");
    expect(fileContent).toContain("checked={autoBalance}");
    expect(fileContent).toContain("onChange={(e) => handleToggleAutoBalance(e.target.checked)}");
    expect(fileContent).toContain("peer-checked:bg-teal-500/20");
    expect(fileContent).toContain("peer-checked:translate-x-3");

    // Disable manual weight input when Auto-Balance is enabled
    expect(fileContent).toContain("disabled={autoBalance}");
  });

  it("should have clean and compact scroll container style", () => {
    const filePath = path.resolve(__dirname, "./MilestoneBuilder.tsx");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // Clean scrollbar settings
    expect(fileContent).toContain("space-y-2 max-h-[220px] overflow-y-auto pr-1");
  });
});
