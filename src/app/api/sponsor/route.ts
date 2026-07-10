import { NextResponse } from "next/server";
import { TransactionBuilder, Keypair, Networks, Horizon, Transaction, Address, xdr } from "@stellar/stellar-sdk";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const horizonServer = new Horizon.Server(HORIZON_URL);

// In-memory rate limiting cache
const ipCache = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // Max 30 requests per minute

export async function POST(request: Request) {
  try {
    // Rate limiting check
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous";
    const now = Date.now();
    const clientLimit = ipCache.get(ip);

    if (clientLimit) {
      if (now > clientLimit.resetAt) {
        ipCache.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      } else if (clientLimit.count >= MAX_REQUESTS_PER_WINDOW) {
        return NextResponse.json({
          success: false,
          error: "Rate limit exceeded. Please try again later.",
        }, { 
          status: 429,
          headers: {
            "Retry-After": Math.ceil((clientLimit.resetAt - now) / 1000).toString(),
          }
        });
      } else {
        clientLimit.count += 1;
      }
    } else {
      ipCache.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    }

    const { xdr: userXdr } = await request.json();
    if (!userXdr) {
      return NextResponse.json({ error: "Missing xdr parameter" }, { status: 400 });
    }

    const sponsorSecretKey = process.env.SPONSOR_SECRET_KEY || (process.env.NODE_ENV === "test" ? Keypair.random().secret() : null);
    if (!sponsorSecretKey) {
      return NextResponse.json({
        success: false,
        error: "Sponsorship is disabled: SPONSOR_SECRET_KEY is not configured.",
      }, { status: 503 });
    }
    const sponsorKeypair = Keypair.fromSecret(sponsorSecretKey);

    // Decode user transaction
    const innerTx = TransactionBuilder.fromXDR(userXdr, Networks.TESTNET);

    if (!(innerTx instanceof Transaction)) {
      return NextResponse.json({ error: "Invalid transaction type for fee sponsorship" }, { status: 400 });
    }

    const allowedEscrowId = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID || "CD734V7PATOR7NW7APYQLUNEON2GZ7EUBM27MFQO3WDQZGCPKIWB6NOT";
    const allowedRouterId = process.env.NEXT_PUBLIC_ROUTER_CONTRACT_ID || "CA5ZEROS4VGIOZ2MIDVV7C7W4DFKWE76P4KBG455KO26RPKD2W3TC6MM";

    for (const op of innerTx.operations) {
      if (op.type !== "invokeHostFunction") {
        return NextResponse.json({
          success: false,
          error: `Sponsorship is only permitted for Soroban contract calls, found operation type: ${op.type}`
        }, { status: 403 });
      }

      const func = op.func;
      if (!func || func.switch().value !== xdr.HostFunctionType.hostFunctionTypeInvokeContract().value) {
        return NextResponse.json({
          success: false,
          error: "Sponsorship is only permitted for contract method invocations (invokeContract)"
        }, { status: 403 });
      }

      try {
        const contractScAddress = func.invokeContract().contractAddress();
        const contractId = Address.fromScAddress(contractScAddress).toString();
        
        const isEscrow = contractId === allowedEscrowId;
        const isRouter = allowedRouterId ? contractId === allowedRouterId : false;

        if (!isEscrow && !isRouter) {
          return NextResponse.json({
            success: false,
            error: `Sponsorship is unauthorized for contract: ${contractId}`
          }, { status: 403 });
        }
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error: `Failed to validate contract address: ${err.message}`
        }, { status: 403 });
      }
    }

    // Build fee bump transaction
    const innerOps = innerTx.operations ? innerTx.operations.length : 1;
    const innerFee = parseInt(innerTx.fee) || 100;
    const baseFee = Math.max(200, Math.ceil(innerFee / innerOps)).toString();

    const feeBumpTx = TransactionBuilder.buildFeeBumpTransaction(
      sponsorKeypair.publicKey(),
      baseFee,
      innerTx,
      Networks.TESTNET
    );

    // Sign as the sponsor
    feeBumpTx.sign(sponsorKeypair);

    // Submit to Horizon
    const result = await horizonServer.submitTransaction(feeBumpTx);

    return NextResponse.json({
      success: true,
      hash: result.hash,
      ledger: result.ledger,
      resultXdr: result.result_meta_xdr,
    });
  } catch (error: any) {
    console.error("Sponsor fee-bump failed:", error);
    // If Horizon returns structured error metadata:
    const responseData = error.response?.data;
    const errorMessage = responseData?.detail || error.message || String(error);
    return NextResponse.json({
      success: false,
      error: errorMessage,
      extras: responseData?.extras,
    }, { status: 500 });
  }
}
