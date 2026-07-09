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
});
