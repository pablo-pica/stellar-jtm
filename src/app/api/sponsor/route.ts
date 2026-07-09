import { NextResponse } from "next/server";
import { TransactionBuilder, Keypair, Networks, Horizon, Transaction } from "@stellar/stellar-sdk";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const horizonServer = new Horizon.Server(HORIZON_URL);

export async function POST(request: Request) {
  try {
    const { xdr } = await request.json();
    if (!xdr) {
      return NextResponse.json({ error: "Missing xdr parameter" }, { status: 400 });
    }

    const sponsorSecretKey = process.env.SPONSOR_SECRET_KEY || Keypair.random().secret();
    const sponsorKeypair = Keypair.fromSecret(sponsorSecretKey);

    // Decode user transaction
    const innerTx = TransactionBuilder.fromXDR(xdr, Networks.TESTNET);

    if (!(innerTx instanceof Transaction)) {
      return NextResponse.json({ error: "Invalid transaction type for fee sponsorship" }, { status: 400 });
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
