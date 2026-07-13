import { describe, it, expect } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import EscrowTab from "./EscrowTab";

describe("EscrowTab Component Layout & Action Tests", () => {
  it("should export a function for EscrowTab", () => {
    expect(typeof EscrowTab).toBe("function");
  });

  it("should render escrow builder form, active list accordion, and role selector controls", () => {
    const filePath = path.resolve(__dirname, "./EscrowTab.tsx");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // Form inputs and builder integration
    expect(fileContent).toContain("Create Escrow Lock");
    expect(fileContent).toContain("CustomNumberInput");
    expect(fileContent).toContain("MilestoneBuilder");

    // Active escrows list checks
    expect(fileContent).toContain("Active Escrows");
    expect(fileContent).toContain("escrows.map");
    expect(fileContent).toContain("progressPercent");

    // Role selector checks
    expect(fileContent).toContain("SegmentedControl");
    expect(fileContent).toContain("getRoleHelpText(userRole)");

    // Actions & tiered confirmations
    expect(fileContent).toContain("InlineConfirmationButton");
    expect(fileContent).toContain("handleSubmitMilestone");
    expect(fileContent).toContain("handleReleaseMilestone");
    expect(fileContent).toContain("handleDisputeMilestone");
    expect(fileContent).toContain("handleRefundEscrow");
  });

  it("should render relocated Role Selector, updated input styles, and premium empty state elements", () => {
    const filePath = path.resolve(__dirname, "./EscrowTab.tsx");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // Relocated Unified Role Selector with idPrefix
    expect(fileContent).toContain("role-unified");
    expect(fileContent).toContain("Active Role Duties");

    // Standardized form input style matching SendTab.tsx (h-12, focus-ring)
    expect(fileContent).toContain("w-full h-12 pl-4 pr-10 rounded-xl bg-space-900/50 border border-space-700/40 focus:border-teal-500/35 text-sm");

    // Premium empty state layout details (w-14, h-14, rounded-2xl, icon container)
    expect(fileContent).toContain("w-14 h-14 rounded-2xl bg-space-900/80 border border-space-700/50 flex items-center justify-center mx-auto shadow-md");
    expect(fileContent).toContain("text-base font-bold text-slate-100");
    expect(fileContent).toContain("text-xs text-slate-400 max-w-[240px]");

    // Vertical milestone timeline elements
    expect(fileContent).toContain("border-l border-space-700/60");
    expect(fileContent).toContain("dotColor");
  });

  it("should implement escrowView state toggle, SegmentedControl for Create vs Active views, and conditional panels", () => {
    const filePath = path.resolve(__dirname, "./EscrowTab.tsx");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // State toggle initialization
    expect(fileContent).toContain("const [escrowView, setEscrowView] = useState");
    expect(fileContent).toContain("escrows.length > 0 ? \"active\" : \"create\"");

    // SegmentedControl for Create Lock vs Active Escrows
    expect(fileContent).toContain("idPrefix=\"escrow-view\"");
    expect(fileContent).toContain("label: \"Create Lock\", value: \"create\"");
    expect(fileContent).toContain("label: \"Active Escrows\", value: \"active\"");

    // Conditional panel rendering
    expect(fileContent).toContain("escrowView === \"create\" && (");
    expect(fileContent).toContain("escrowView === \"active\" && (");
  });

  it("should support BottomSheet integration for Milestones configuration", () => {
    const filePath = path.resolve(__dirname, "./EscrowTab.tsx");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // Import and state for BottomSheet
    expect(fileContent).toContain("import BottomSheet from \"./ui/BottomSheet\";");
    expect(fileContent).toContain("const [isMilestoneSheetOpen, setIsMilestoneSheetOpen] = useState(false);");

    // Click trigger and display text
    expect(fileContent).toContain("data-testid=\"configure-milestones-btn\"");
    expect(fileContent).toContain("onClick={() => setIsMilestoneSheetOpen(true)}");
    expect(fileContent).toContain("Add Milestones (0 defined)");

    // BottomSheet declaration wrapping MilestoneBuilder
    expect(fileContent).toContain("<BottomSheet");
    expect(fileContent).toContain("isOpen={isMilestoneSheetOpen}");
    expect(fileContent).toContain("onClose={() => setIsMilestoneSheetOpen(false)}");
    expect(fileContent).toContain("<MilestoneBuilder");
  });
});
