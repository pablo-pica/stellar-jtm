import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { TransactionBuilder, Keypair, Networks } from "@stellar/stellar-sdk";

// Mock @stellar/stellar-sdk components
vi.mock("@stellar/stellar-sdk", async () => {
  const actual = await vi.importActual("@stellar/stellar-sdk") as any;
  
  const mockSubmitTransaction = vi.fn().mockResolvedValue({
    hash: "mock-fee-bump-hash",
    ledger: 100,
    result_meta_xdr: "mock-meta-xdr",
  });

  const mockBuildFeeBumpTransaction = vi.fn().mockImplementation((feeSource, baseFee, innerTx, networkPassphrase) => {
    return {
      sign: vi.fn(),
      toEnvelope: () => ({
        toXDR: () => "mock-envelope-xdr",
      }),
    };
  });

  class MockTransaction {
    fee = "100";
    operations = [{ 
      type: "invokeHostFunction",
      func: {
        switch: () => ({ value: 0 }), // hostFunctionTypeInvokeContract
        invokeContract: () => ({
          contractAddress: () => "mock-contract-address",
        }),
      }
    }];
  }

  const mockFromScAddress = vi.fn().mockReturnValue({
    toString: () => "CD734V7PATOR7NW7APYQLUNEON2GZ7EUBM27MFQO3WDQZGCPKIWB6NOT",
  });

  return {
    ...actual,
    Address: {
      ...actual.Address,
      fromScAddress: mockFromScAddress,
    },
    Transaction: MockTransaction,
    TransactionBuilder: {
      ...actual.TransactionBuilder,
      fromXDR: vi.fn().mockImplementation((xdr, network) => {
        return new MockTransaction();
      }),
      buildFeeBumpTransaction: mockBuildFeeBumpTransaction,
    },
    Horizon: {
      Server: vi.fn().mockImplementation(() => {
        return {
          submitTransaction: mockSubmitTransaction,
        };
      }),
    },
  };
});

describe("Gasless Relayer API Route /api/sponsor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 status if xdr is missing from request body", async () => {
    const req = new Request("http://localhost/api/sponsor", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing xdr parameter");
  });

  it("should successfully build, sign, and submit fee-bump transaction", async () => {
    const req = new Request("http://localhost/api/sponsor", {
      method: "POST",
      body: JSON.stringify({ xdr: "AAAAUserSignedTransactionXdr..." }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.hash).toBe("mock-fee-bump-hash");
    expect(body.ledger).toBe(100);
  });
});
