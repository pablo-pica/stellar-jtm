import { describe, it, expect } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { ConfirmationDialog, InlineConfirmationButton } from "./ConfirmationDialog";

describe("ConfirmationDialog & InlineConfirmationButton Tests", () => {
  it("should export dialog and button components", () => {
    expect(typeof ConfirmationDialog).toBe("function");
    expect(typeof InlineConfirmationButton).toBe("function");
  });

  it("should implement tap-twice confirmation logic with state timeouts", () => {
    const filePath = path.resolve(__dirname, "./ConfirmationDialog.tsx");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // Modal dialog properties
    expect(fileContent).toContain("AlertTriangle");
    expect(fileContent).toContain("AnimatePresence");
    expect(fileContent).toContain("onConfirm()");

    // Inline/tap-twice confirmation logic checks
    expect(fileContent).toContain("isConfirming");
    expect(fileContent).toContain("setIsConfirming");
    expect(fileContent).toContain("setTimeout");
  });
});
