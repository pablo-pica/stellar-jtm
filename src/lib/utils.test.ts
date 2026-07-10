import { describe, it, expect } from "vitest";
import { validateStellarAddress, sanitizeSymbol } from "./utils";

describe("validateStellarAddress", () => {
  it("should return true for valid Stellar public addresses", () => {
    const validAddresses = [
      "GAIRISXKPLOWZBMFRPU5XRGUUX3VMA3ZEWKBM5MSNRU3CHV6P4PYZ74D",
      "GBDEV52MTLVEKQC63TL6JKX2Q566DND6ND6DND6DND6DND6DND6DND6D",
      "GC2B4VSV6SV442555555555555555555555555555555555555555555",
    ];

    validAddresses.forEach((addr) => {
      expect(validateStellarAddress(addr)).toBe(true);
    });
  });

  it("should return false for invalid Stellar public addresses", () => {
    const invalidAddresses = [
      "", // Empty
      "GBDEV58MTLVEKQC63TL6JKX2Q566D", // Too short
      "MAIRISXKPLOWZBMFRPU5XRGUUX3VMA3ZEWKBM5MSNRU3CHV6P4PYZ74D", // Wrong starting character (M-address, not public G-address)
      "GAIRISXKPLOWZBMFRPU5XRGUUX3VMA3ZEWKBM5MSNRU3CHV6P4PYZ74D1", // Too long
      "GAIRISXKPLOWZBMFRPU5XRGUUX3VMA3ZEWKBM5MSNRU3CHV6P4PYZ748", // Contains invalid digit '8'
      "gairisxkplowzbmfrpu5xrguux3vma3zewkbm5msnru3chv6p4pyz74d", // Lowercase
    ];

    invalidAddresses.forEach((addr) => {
      expect(validateStellarAddress(addr)).toBe(false);
    });
  });

  it("should return false for non-string values and formats with special/non-alphanumeric characters", () => {
    // Test null, undefined, and non-string values via type assertion
    expect(validateStellarAddress(null as any)).toBe(false);
    expect(validateStellarAddress(undefined as any)).toBe(false);
    expect(validateStellarAddress(12345 as any)).toBe(false);
    expect(validateStellarAddress({} as any)).toBe(false);

    // Test formats with special or non-alphanumeric characters
    expect(validateStellarAddress("GAIRISXKPLOWZBMFRPU5XRGUUX3VMA3ZEWKBM5MSNRU3CHV6P4PYZ74@")).toBe(false);
    expect(validateStellarAddress("GAIRISXKPLOWZBMFRPU5XRGUUX3VMA3ZEWKBM5MSNRU3CHV6P4P YZ74D")).toBe(false);
    expect(validateStellarAddress("GAIRISXKPLOWZBMFRPU5XRGUUX3VMA3ZEWKBM5MSNRU3CHV6P4PYZ74#")).toBe(false);
  });
});

describe("sanitizeSymbol", () => {
  it("should replace spaces with underscores", () => {
    expect(sanitizeSymbol("UI Design mockup")).toBe("UI_Design_mockup");
    expect(sanitizeSymbol("Hello   World")).toBe("Hello_World");
  });

  it("should remove non-alphanumeric and non-underscore characters", () => {
    expect(sanitizeSymbol("UI-Design@2026!")).toBe("UIDesign2026");
    expect(sanitizeSymbol("milestone_#1_payout")).toBe("milestone_1_payout");
  });

  it("should truncate strings longer than 32 characters", () => {
    const longString = "this_is_an_extremely_long_milestone_description_that_exceeds_limits";
    const result = sanitizeSymbol(longString);
    expect(result.length).toBe(32);
    expect(result).toBe("this_is_an_extremely_long_milest");
  });

  it("should return a fallback string when the result is empty", () => {
    expect(sanitizeSymbol("")).toBe("milestone");
    expect(sanitizeSymbol("!!!@#$")).toBe("milestone");
  });
});
