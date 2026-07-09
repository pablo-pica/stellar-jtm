import { describe, it, expect } from "vitest";
import { parseAiIntent } from "./aiParser";

describe("parseAiIntent", () => {
  it("should parse standard payments", () => {
    const input = "Send 50 XLM to GBRPYHIL2CIYAOSRIWRMQHEBOZJ7PAGB37NMQ22FQGSNLUY65VOUAIV2";
    const result = parseAiIntent(input);
    expect(result.type).toBe("send");
    expect(result.amount).toBe("50");
    expect(result.asset).toBe("XLM");
    expect(result.recipient).toBe("GBRPYHIL2CIYAOSRIWRMQHEBOZJ7PAGB37NMQ22FQGSNLUY65VOUAIV2");
    expect(result.milestones).toEqual([]);
  });

  it("should parse escrow setups with percentages", () => {
    const input = "Create an escrow of 1000 USDC to GBRPYHIL2CIYAOSRIWRMQHEBOZJ7PAGB37NMQ22FQGSNLUY65VOUAIV2 with milestones: 30% for UI design, 70% for backend integration";
    const result = parseAiIntent(input);
    expect(result.type).toBe("escrow");
    expect(result.amount).toBe("1000");
    expect(result.asset).toBe("USDC");
    expect(result.recipient).toBe("GBRPYHIL2CIYAOSRIWRMQHEBOZJ7PAGB37NMQ22FQGSNLUY65VOUAIV2");
    expect(result.milestones).toHaveLength(2);
    expect(result.milestones[0]).toEqual({
      description: "UI design",
      payout_weight: 3000,
      is_completed: false,
    });
    expect(result.milestones[1]).toEqual({
      description: "backend integration",
      payout_weight: 7000,
      is_completed: false,
    });
  });

  it("should parse escrow setups with basis points (bps)", () => {
    const input = "Escrow 500 yXLM to GBRPYHIL2CIYAOSRIWRMQHEBOZJ7PAGB37NMQ22FQGSNLUY65VOUAIV2: 4000 bps for design, 6000 bps for development";
    const result = parseAiIntent(input);
    expect(result.type).toBe("escrow");
    expect(result.amount).toBe("500");
    expect(result.asset).toBe("YXLM");
    expect(result.recipient).toBe("GBRPYHIL2CIYAOSRIWRMQHEBOZJ7PAGB37NMQ22FQGSNLUY65VOUAIV2");
    expect(result.milestones).toHaveLength(2);
    expect(result.milestones[0]).toEqual({
      description: "design",
      payout_weight: 4000,
      is_completed: false,
    });
    expect(result.milestones[1]).toEqual({
      description: "development",
      payout_weight: 6000,
      is_completed: false,
    });
  });

  it("should parse escrow with basic milestone names and auto-split weights", () => {
    const input = "Hold 250 PHP in escrow for GBRPYHIL2CIYAOSRIWRMQHEBOZJ7PAGB37NMQ22FQGSNLUY65VOUAIV2 with milestones: phase 1, phase 2, phase 3";
    const result = parseAiIntent(input);
    expect(result.type).toBe("escrow");
    expect(result.amount).toBe("250");
    expect(result.asset).toBe("PHP");
    expect(result.recipient).toBe("GBRPYHIL2CIYAOSRIWRMQHEBOZJ7PAGB37NMQ22FQGSNLUY65VOUAIV2");
    expect(result.milestones).toHaveLength(3);
    // 10000 / 3 = 3333, 3333, last gets 3334
    expect(result.milestones[0].payout_weight).toBe(3333);
    expect(result.milestones[1].payout_weight).toBe(3333);
    expect(result.milestones[2].payout_weight).toBe(3334);
  });

  it("should parse release milestone commands", () => {
    const input = "Release milestone 2 for escrow 8a92b3c4d5e6f7a8b9c0d1e2f3f4e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2";
    const result = parseAiIntent(input);
    expect(result.type).toBe("release");
    expect(result.milestoneIndex).toBe(2);
    expect(result.escrowId).toBe("8a92b3c4d5e6f7a8b9c0d1e2f3f4e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2");
  });

  it("should parse refund escrow commands", () => {
    const input = "Refund escrow 8a92b3c4d5e6f7a8b9c0d1e2f3f4e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2";
    const result = parseAiIntent(input);
    expect(result.type).toBe("refund");
    expect(result.escrowId).toBe("8a92b3c4d5e6f7a8b9c0d1e2f3f4e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2");
  });
});
