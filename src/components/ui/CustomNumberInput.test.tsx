import { describe, it, expect } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import CustomNumberInput from "./CustomNumberInput";

describe("CustomNumberInput Component Tests", () => {
  it("should export a function for CustomNumberInput", () => {
    expect(typeof CustomNumberInput).toBe("function");
  });

  it("should have flanking plus and minus buttons and custom number validation regex", () => {
    const filePath = path.resolve(__dirname, "./CustomNumberInput.tsx");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // Flanking buttons must render decrement/increment
    expect(fileContent).toContain("decrement");
    expect(fileContent).toContain("increment");
    expect(fileContent).toContain("Plus");
    expect(fileContent).toContain("Minus");

    // Input configuration
    expect(fileContent).toContain("type=\"text\"");
    expect(fileContent).toContain("/^\\d*\\.?\\d*$/");

    // Style properties to hide native spinners
    expect(fileContent).toContain("[appearance:textfield]");
    expect(fileContent).toContain("border-teal-500");
  });
});
