import { useState, useEffect, useCallback, useRef } from "react";
import { StellarWalletsKit, KitEventType, Networks as SWKNetworks } from "@creit.tech/stellar-wallets-kit";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";
import { Horizon, Networks, TransactionBuilder, Asset, Operation, Address, nativeToScVal, scValToNative, rpc, Contract, xdr } from "@stellar/stellar-sdk";
import { sanitizeSymbol } from "@/lib/utils";


const HORIZON_URL = "https://horizon-testnet.stellar.org";
const SOROBAN_RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org:443";

const horizonServer = new Horizon.Server(HORIZON_URL);
const rpcServer = new rpc.Server(SOROBAN_RPC_URL);

// Initialize StellarWalletsKit client-side
let kitInitialized = false;
function getKit() {
  if (typeof window !== "undefined" && !kitInitialized) {
    StellarWalletsKit.init({
      modules: defaultModules(),
      network: SWKNetworks.TESTNET,
    });
    kitInitialized = true;
  }
  return StellarWalletsKit;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  error: string | null;
  isLoading: boolean;
}

export function parseWalletError(err: any, context: "connect" | "transaction" = "transaction"): string {
  const msg = err.message || String(err);
  if (
    msg.includes("not installed") || 
    msg.includes("not enabled") || 
    msg.includes("No wallet has been connected") ||
    msg.includes("authenticated first")
  ) {
    return "Wallet Not Found: Please install or enable the browser extension (Freighter, xBull, Albedo, etc.).";
  }
  if (
    msg.includes("rejected") || 
    msg.includes("declined") || 
    msg.includes("closed the modal") || 
    msg.includes("Signing failed") ||
    msg.includes("User closed")
  ) {
    return context === "connect"
      ? "Connection Cancelled: The connection request was cancelled by the user."
      : "Transaction Rejected: The request was rejected by the user.";
  }
  if (
    msg.includes("Insufficient") || 
    msg.includes("balance") || 
    msg.includes("op_underfunded") || 
    msg.includes("tx_insufficient_balance")
  ) {
    return "Insufficient Balance: You do not have enough XLM to cover this transaction and fee.";
  }
  return msg;
}

export function parseTransactionEvents(result: any) {
  if (!result || result.status !== "SUCCESS" || !result.resultMetaXdr) {
    return;
  }
  try {
    const meta = xdr.TransactionMeta.fromXDR(result.resultMetaXdr, "base64") as any;
    let sorobanMeta;
    if (meta.switch() === 3) {
      sorobanMeta = meta.v3().sorobanMeta();
    } else if (meta.switch() === 4) {
      sorobanMeta = meta.v4?.()?.sorobanMeta?.() || meta.value?.()?.sorobanMeta?.();
    } else {
      sorobanMeta = meta.value?.()?.sorobanMeta?.();
    }
    if (!sorobanMeta) return;

    const events = sorobanMeta.events();
    if (!events || events.length === 0) return;

    console.log(`--- Parsed Transaction Events (Total: ${events.length}) ---`);
    events.forEach((evt: any, idx: number) => {
      try {
        const contractIdBytes = evt.contractId();
        const contractId = contractIdBytes ? Address.contract(contractIdBytes).toString() : "System";
        const body = evt.body().v0();
        const topics = body.topics().map((t: any) => scValToNative(t));
        const data = scValToNative(body.data());

        console.log(`Event #${idx + 1}:`, {
          contractId,
          type: evt.type().name,
          topics,
          data,
        });
      } catch (innerErr) {
        console.warn(`Failed to parse event #${idx + 1}:`, innerErr);
      }
    });
    console.log("-------------------------------------------------");
  } catch (err) {
    console.error("Error in parseTransactionEvents:", err);
  }
}

export function useStellarWallet() {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
    error: null,
    isLoading: true,
  });

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Fetch native XLM balance
  const fetchBalance = useCallback(async (publicKey: string) => {
    try {
      const account = await horizonServer.loadAccount(publicKey);
      const nativeBalance = account.balances.find(
        (b) => b.asset_type === "native"
      );
      return nativeBalance ? nativeBalance.balance : "0.0000000";
    } catch (err: any) {
      console.error("Error fetching balance:", err);
      if (err.response?.status === 404) {
        return "0.0000000 (Unfunded)";
      }
      return "0.0000000";
    }
  }, []);

  // Update address and balance state
  const checkConnection = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    if (typeof window !== "undefined" && localStorage.getItem("aethyr_mock_wallet") === "true") {
      setState({
        isConnected: true,
        address: "GBZXN7PIRZGNMHGA7MUUUF4GWPY5ALY4UV2GL6VJGIQRXFDNMADIXXXX",
        balance: "4827.50",
        error: null,
        isLoading: false,
      });
      return;
    }
    try {
      getKit();
      const { address } = await StellarWalletsKit.getAddress();
      if (address) {
        const balance = await fetchBalance(address);
        setState({
          isConnected: true,
          address,
          balance,
          error: null,
          isLoading: false,
        });
      } else {
        setState({
          isConnected: false,
          address: null,
          balance: null,
          error: null,
          isLoading: false,
        });
      }
    } catch (err: any) {
      // SWK throws when not connected
      setState({
        isConnected: false,
        address: null,
        balance: null,
        error: null,
        isLoading: false,
      });
    }
  }, [fetchBalance]);

  // Connect wallet
  const connect = useCallback(async (walletId?: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      let address = "";
      let balance = "0.0000000";
      if (walletId === "mock") {
        address = "GBZXN7PIRZGNMHGA7MUUUF4GWPY5ALY4UV2GL6VJGIQRXFDNMADIXXXX";
        balance = "4827.50";
        if (typeof window !== "undefined") {
          localStorage.setItem("aethyr_mock_wallet", "true");
        }
      } else {
        getKit();
        if (walletId) {
          await StellarWalletsKit.setWallet(walletId);
          const res = await StellarWalletsKit.fetchAddress();
          address = res.address;
        } else {
          const res = await StellarWalletsKit.authModal();
          address = res.address;
        }
        if (!address) {
          throw new Error("No address returned from StellarWalletsKit.");
        }
        balance = await fetchBalance(address);
      }
      setState({
        isConnected: true,
        address,
        balance,
        error: null,
        isLoading: false,
      });
    } catch (err: any) {
      console.error("Connect failed:", err);
      setState((prev) => ({
        ...prev,
        error: parseWalletError(err, "connect"),
        isLoading: false,
      }));
    }
  }, [fetchBalance]);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    if (typeof window !== "undefined") {
      localStorage.removeItem("aethyr_mock_wallet");
    }
    const currentAddress = stateRef.current.address;
    if (currentAddress && currentAddress !== "GBZXN7PIRZGNMHGA7MUUUF4GWPY5ALY4UV2GL6VJGIQRXFDNMADIXXXX") {
      try {
        getKit();
        await StellarWalletsKit.disconnect();
      } catch (err) {
        console.error("SWK disconnect failed:", err);
      }
    }
    setState({
      isConnected: false,
      address: null,
      balance: null,
      error: null,
      isLoading: false,
    });
  }, []);

  // Submit transaction with optional fee sponsorship (relayer) and fallback
  const submitTransaction = useCallback(async (signedTxXdr: string) => {
    let txHash: string;
    let isSponsored = false;

    // Try gasless fee-bump relayer first
    try {
      const response = await fetch("/api/sponsor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xdr: signedTxXdr }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        txHash = data.hash;
        isSponsored = true;
        console.log("Transaction sponsored successfully. Hash:", txHash);
      } else {
        console.warn("Sponsorship failed, falling back to direct submission:", data.error || "Unknown error");
        // Fallback to direct submission
        const signedTransaction = TransactionBuilder.fromXDR(signedTxXdr, Networks.TESTNET);
        const sendResponse = await rpcServer.sendTransaction(signedTransaction);
        if (sendResponse.status === "ERROR") {
          const errorMsg = sendResponse.errorResult 
            ? sendResponse.errorResult.toXDR("base64")
            : "Unknown error";
          throw new Error(`Transaction submission error: ${errorMsg}`);
        }
        txHash = sendResponse.hash;
      }
    } catch (err) {
      console.warn("Sponsorship failed due to error, falling back to direct submission:", err);
      // Fallback to direct submission
      const signedTransaction = TransactionBuilder.fromXDR(signedTxXdr, Networks.TESTNET);
      const sendResponse = await rpcServer.sendTransaction(signedTransaction);
      if (sendResponse.status === "ERROR") {
        const errorMsg = sendResponse.errorResult 
          ? sendResponse.errorResult.toXDR("base64")
          : "Unknown error";
        throw new Error(`Transaction submission error: ${errorMsg}`);
      }
      txHash = sendResponse.hash;
    }

    // Poll for status
    let getResponse = await rpcServer.getTransaction(txHash);
    let retries = 0;
    while (getResponse.status === "NOT_FOUND" && retries < 15) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      getResponse = await rpcServer.getTransaction(txHash);
      retries++;
    }

    if (getResponse.status === "FAILED") {
      throw new Error("Transaction execution failed on-chain.");
    }

    try {
      parseTransactionEvents(getResponse);
    } catch (e) {
      console.error("Failed to parse events:", e);
    }

    await checkConnection();

    return {
      hash: txHash,
      result: getResponse,
      isSponsored,
    };
  }, [checkConnection]);

  // Send XLM transaction
  const sendXLM = useCallback(async (destination: string, amount: string) => {
    const currentAddress = stateRef.current.address;
    if (!currentAddress) {
      throw new Error("Wallet is not connected.");
    }
    
    if (currentAddress === "GBZXN7PIRZGNMHGA7MUUUF4GWPY5ALY4UV2GL6VJGIQRXFDNMADIXXXX") {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return {
        hash: "mock_tx_hash_" + Math.random().toString(36).substr(2, 9),
        ledger: 12345,
      };
    }

    try {
      getKit();
      // 1. Load sender account to fetch correct sequence number
      const account = await horizonServer.loadAccount(currentAddress);
      const fee = await horizonServer.fetchBaseFee();

      // 2. Build the transaction
      const transaction = new TransactionBuilder(account, {
        fee: fee.toString(),
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.payment({
            destination,
            asset: Asset.native(),
            amount,
          })
        )
        .setTimeout(60)
        .build();

      const xdr = transaction.toEnvelope().toXDR("base64");

      // 3. Request StellarWalletsKit signature
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: Networks.TESTNET,
        address: currentAddress,
      });

      if (!signedTxXdr) {
        throw new Error("Transaction was not signed.");
      }

      // 4. Reconstruct signed transaction and submit it
      const signedTransaction = TransactionBuilder.fromXDR(signedTxXdr, Networks.TESTNET);
      const result = await horizonServer.submitTransaction(signedTransaction);

      // 5. Update local balance after success
      await checkConnection();

      return result;
    } catch (err: any) {
      console.error("Payment failed:", err);
      throw new Error(parseWalletError(err, "transaction"));
    }
  }, [checkConnection]);

  // Call route_payment on Soroban smart contract
  const routePayment = useCallback(async (
    destination: string, 
    path: string[], 
    amountIn: string, 
    minAmountOut: string
  ) => {
    const currentAddress = stateRef.current.address;
    if (!currentAddress) {
      throw new Error("Wallet is not connected.");
    }

    if (currentAddress === "GBZXN7PIRZGNMHGA7MUUUF4GWPY5ALY4UV2GL6VJGIQRXFDNMADIXXXX") {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return {
        hash: "mock_tx_hash_" + Math.random().toString(36).substr(2, 9),
        result: { status: "SUCCESS" },
      };
    }

    try {
      getKit();
      const contractId = process.env.NEXT_PUBLIC_ROUTER_CONTRACT_ID || "CA5ZEROS4VGIOZ2MIDVV7C7W4DFKWE76P4KBG455KO26RPKD2W3TC6MM";

      // 1. Load sender account
      const account = await horizonServer.loadAccount(currentAddress);
      const fee = await horizonServer.fetchBaseFee();

      // 2. Build contract invoke operation
      const sourceAddressScVal = nativeToScVal(new Address(currentAddress));
      const destAddressScVal = nativeToScVal(new Address(destination));
      const pathScVal = nativeToScVal(path.map(p => new Address(p)));
      
      // Stellar assets have 7 decimals
      const amountInRaw = BigInt(Math.floor(parseFloat(amountIn) * 10_000_000));
      const amountInScVal = nativeToScVal(amountInRaw, { type: "i128" });
      
      const minAmountOutRaw = BigInt(Math.floor(parseFloat(minAmountOut) * 10_000_000));
      const minAmountOutScVal = nativeToScVal(minAmountOutRaw, { type: "i128" });

      const contract = new Contract(contractId);
      const invokeOp = contract.call(
        "route_payment",
        sourceAddressScVal,
        destAddressScVal,
        pathScVal,
        amountInScVal,
        minAmountOutScVal
      );

      // 3. Build the initial transaction
      let transaction = new TransactionBuilder(account, {
        fee: fee.toString(),
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(invokeOp)
        .setTimeout(120)
        .build();

      // 4. Simulate the transaction using Soroban RPC to fetch resources & footprint
      const simulation = await rpcServer.simulateTransaction(transaction);
      if (rpc.Api.isSimulationError(simulation)) {
        throw new Error(`Simulation failed: ${simulation.error}`);
      }

      transaction = rpc.assembleTransaction(transaction, simulation).build();

      const xdr = transaction.toEnvelope().toXDR("base64");

      // 6. Sign transaction via StellarWalletsKit
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: Networks.TESTNET,
        address: currentAddress,
      });

      if (!signedTxXdr) {
        throw new Error("Transaction was not signed.");
      }

      // 7. Submit to Soroban RPC
      const signedTransaction = TransactionBuilder.fromXDR(signedTxXdr, Networks.TESTNET);
      const sendResponse = await rpcServer.sendTransaction(signedTransaction);
      if (sendResponse.status === "ERROR") {
        const errorMsg = sendResponse.errorResult 
          ? sendResponse.errorResult.toXDR("base64")
          : "Unknown error";
        throw new Error(`Transaction submission error: ${errorMsg}`);
      }

      // 8. Poll for transaction result
      let getResponse = await rpcServer.getTransaction(sendResponse.hash);
      
      // Wait/poll up to 15 retries (about 30 seconds) while status is NOT_FOUND
      let retries = 0;
      while (getResponse.status === "NOT_FOUND" && retries < 15) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        getResponse = await rpcServer.getTransaction(sendResponse.hash);
        retries++;
      }

      if (getResponse.status === "FAILED") {
        throw new Error("Transaction execution failed on-chain.");
      }

      try {
        parseTransactionEvents(getResponse);
      } catch (e) {
        console.error("Failed to parse events:", e);
      }

      // 9. Update local balance after success
      await checkConnection();

      return {
        hash: sendResponse.hash,
        result: getResponse,
      };
    } catch (err: any) {
      console.error("Route payment failed:", err);
      throw new Error(parseWalletError(err, "transaction"));
    }
  }, [checkConnection]);

  // Sync wallet state updates
  useEffect(() => {
    getKit();
    const sub = StellarWalletsKit.on(KitEventType.STATE_UPDATED, async ({ payload }) => {
      if (payload.address) {
        const balance = await fetchBalance(payload.address);
        setState({
          isConnected: true,
          address: payload.address,
          balance,
          error: null,
          isLoading: false,
        });
      } else {
        setState({
          isConnected: false,
          address: null,
          balance: null,
          error: null,
          isLoading: false,
        });
      }
    });

    checkConnection();

    return () => {
      if (sub) sub();
    };
  }, [checkConnection, fetchBalance]);

  // Helper to convert hex string to Uint8Array for BytesN<32>
  const hexToUint8Array = (hexString: string): Uint8Array => {
    const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
    const numBytes = cleanHex.length / 2;
    const byteArray = new Uint8Array(numBytes);
    for (let i = 0; i < numBytes; i++) {
      byteArray[i] = parseInt(cleanHex.substring(i * 2, 2), 16);
    }
    return byteArray;
  };

  // Call route_to_escrow on Soroban smart contract
  const routeToEscrow = useCallback(async (
    escrowContract: string,
    receiver: string,
    path: string[],
    amountIn: string,
    minAmountOut: string,
    milestones: { description: string; payout_weight: number; is_completed: boolean }[]
  ) => {
    const currentAddress = stateRef.current.address;
    if (!currentAddress) {
      throw new Error("Wallet is not connected.");
    }

    if (currentAddress === "GBZXN7PIRZGNMHGA7MUUUF4GWPY5ALY4UV2GL6VJGIQRXFDNMADIXXXX") {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return {
        hash: "mock_tx_hash_" + Math.random().toString(36).substr(2, 9),
        result: { status: "SUCCESS" },
        escrowId: "8a92b3c4d5e6f7a8b9c0d1e2f3f4e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2",
      };
    }

    try {
      getKit();
      const contractId = process.env.NEXT_PUBLIC_ROUTER_CONTRACT_ID || "CA5ZEROS4VGIOZ2MIDVV7C7W4DFKWE76P4KBG455KO26RPKD2W3TC6MM";

      const account = await horizonServer.loadAccount(currentAddress);
      const fee = await horizonServer.fetchBaseFee();

      const sourceAddressScVal = nativeToScVal(new Address(currentAddress));
      const escrowContractScVal = nativeToScVal(new Address(escrowContract));
      const receiverScVal = nativeToScVal(new Address(receiver));
      const pathScVal = nativeToScVal(path.map(p => new Address(p)));
      
      const amountInRaw = BigInt(Math.floor(parseFloat(amountIn) * 10_000_000));
      const amountInScVal = nativeToScVal(amountInRaw, { type: "i128" });
      
      const minAmountOutRaw = BigInt(Math.floor(parseFloat(minAmountOut) * 10_000_000));
      const minAmountOutScVal = nativeToScVal(minAmountOutRaw, { type: "i128" });

      const milestoneToScVal = (milestone: { description: string; payout_weight: number; is_completed: boolean }) => {
        return xdr.ScVal.scvMap([
          new xdr.ScMapEntry({
            key: xdr.ScVal.scvSymbol("description"),
            val: xdr.ScVal.scvSymbol(sanitizeSymbol(milestone.description)),
          }),
          new xdr.ScMapEntry({
            key: xdr.ScVal.scvSymbol("is_completed"),
            val: xdr.ScVal.scvBool(milestone.is_completed),
          }),
          new xdr.ScMapEntry({
            key: xdr.ScVal.scvSymbol("is_disputed"),
            val: xdr.ScVal.scvBool(false),
          }),
          new xdr.ScMapEntry({
            key: xdr.ScVal.scvSymbol("payout_weight"),
            val: xdr.ScVal.scvU32(milestone.payout_weight),
          }),
          new xdr.ScMapEntry({
            key: xdr.ScVal.scvSymbol("submitted_at"),
            val: nativeToScVal(0n, { type: "u64" }),
          }),
        ]);
      };
      
      const milestonesScVal = xdr.ScVal.scvVec(milestones.map(milestoneToScVal));

      const contract = new Contract(contractId);
      const invokeOp = contract.call(
        "route_to_escrow",
        sourceAddressScVal,
        escrowContractScVal,
        receiverScVal,
        pathScVal,
        amountInScVal,
        minAmountOutScVal,
        milestonesScVal
      );

      let transaction = new TransactionBuilder(account, {
        fee: fee.toString(),
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(invokeOp)
        .setTimeout(120)
        .build();

      const simulation = await rpcServer.simulateTransaction(transaction);
      if (rpc.Api.isSimulationError(simulation)) {
        throw new Error(`Simulation failed: ${simulation.error}`);
      }

      transaction = rpc.assembleTransaction(transaction, simulation).build();
      const txXdr = transaction.toEnvelope().toXDR("base64");

      const { signedTxXdr } = await StellarWalletsKit.signTransaction(txXdr, {
        networkPassphrase: Networks.TESTNET,
        address: currentAddress,
      });

      if (!signedTxXdr) {
        throw new Error("Transaction was not signed.");
      }

      const txResult = await submitTransaction(signedTxXdr);
      
      let escrowId = "";
      try {
        if (txResult.result && (txResult.result as any).resultMetaXdr) {
          const meta = xdr.TransactionMeta.fromXDR((txResult.result as any).resultMetaXdr, "base64") as any;
          let sorobanMeta;
          if (meta.switch() === 3) {
            sorobanMeta = meta.v3().sorobanMeta();
          } else if (meta.switch() === 4) {
            sorobanMeta = meta.v4?.()?.sorobanMeta?.() || meta.value?.()?.sorobanMeta?.();
          } else {
            sorobanMeta = meta.value?.()?.sorobanMeta?.();
          }
          if (sorobanMeta) {
            const returnValue = sorobanMeta.returnValue();
            const nativeVal = scValToNative(returnValue);
            if (Buffer.isBuffer(nativeVal) || nativeVal instanceof Uint8Array) {
              escrowId = Buffer.from(nativeVal).toString("hex");
            } else if (typeof nativeVal === "string") {
              escrowId = nativeVal;
            }
          }
        }
      } catch (err) {
        console.error("Failed to decode escrowId from transaction meta:", err);
      }

      return {
        hash: txResult.hash,
        result: txResult.result,
        isSponsored: txResult.isSponsored,
        escrowId: escrowId || "8a92b3c4d5e6f7a8b9c0d1e2f3f4e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2",
      };
    } catch (err: any) {
      console.error("Route to escrow failed:", err);
      throw new Error(parseWalletError(err, "transaction"));
    }
  }, [checkConnection]);

  // Call release_milestone on Escrow smart contract
  const releaseMilestone = useCallback(async (
    escrowContract: string,
    escrowId: string,
    milestoneIndex: number
  ) => {
    const currentAddress = stateRef.current.address;
    if (!currentAddress) {
      throw new Error("Wallet is not connected.");
    }

    if (currentAddress === "GBZXN7PIRZGNMHGA7MUUUF4GWPY5ALY4UV2GL6VJGIQRXFDNMADIXXXX") {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return {
        hash: "mock_tx_hash_" + Math.random().toString(36).substr(2, 9),
        result: { status: "SUCCESS" },
      };
    }

    try {
      getKit();
      const account = await horizonServer.loadAccount(currentAddress);
      const fee = await horizonServer.fetchBaseFee();

      const escrowIdScVal = xdr.ScVal.scvBytes(Buffer.from(hexToUint8Array(escrowId)));
      const milestoneIndexScVal = xdr.ScVal.scvU32(milestoneIndex);
      const authPartyScVal = nativeToScVal(new Address(currentAddress));

      const contract = new Contract(escrowContract);
      const invokeOp = contract.call(
        "release_milestone",
        escrowIdScVal,
        milestoneIndexScVal,
        authPartyScVal
      );

      let transaction = new TransactionBuilder(account, {
        fee: fee.toString(),
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(invokeOp)
        .setTimeout(120)
        .build();

      const simulation = await rpcServer.simulateTransaction(transaction);
      if (rpc.Api.isSimulationError(simulation)) {
        throw new Error(`Simulation failed: ${simulation.error}`);
      }

      transaction = rpc.assembleTransaction(transaction, simulation).build();
      const txXdr = transaction.toEnvelope().toXDR("base64");

      const { signedTxXdr } = await StellarWalletsKit.signTransaction(txXdr, {
        networkPassphrase: Networks.TESTNET,
        address: currentAddress,
      });

      if (!signedTxXdr) {
        throw new Error("Transaction was not signed.");
      }

      return await submitTransaction(signedTxXdr);
    } catch (err: any) {
      console.error("Release milestone failed:", err);
      throw new Error(parseWalletError(err, "transaction"));
    }
  }, [checkConnection]);

  // Call refund_escrow on Escrow smart contract
  const refundEscrow = useCallback(async (
    escrowContract: string,
    escrowId: string
  ) => {
    const currentAddress = stateRef.current.address;
    if (!currentAddress) {
      throw new Error("Wallet is not connected.");
    }

    if (currentAddress === "GBZXN7PIRZGNMHGA7MUUUF4GWPY5ALY4UV2GL6VJGIQRXFDNMADIXXXX") {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return {
        hash: "mock_tx_hash_" + Math.random().toString(36).substr(2, 9),
        result: { status: "SUCCESS" },
      };
    }

    try {
      getKit();
      const account = await horizonServer.loadAccount(currentAddress);
      const fee = await horizonServer.fetchBaseFee();

      const escrowIdScVal = xdr.ScVal.scvBytes(Buffer.from(hexToUint8Array(escrowId)));
      const senderScVal = nativeToScVal(new Address(currentAddress));

      const contract = new Contract(escrowContract);
      const invokeOp = contract.call(
        "refund_escrow",
        escrowIdScVal,
        senderScVal
      );

      let transaction = new TransactionBuilder(account, {
        fee: fee.toString(),
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(invokeOp)
        .setTimeout(120)
        .build();

      const simulation = await rpcServer.simulateTransaction(transaction);
      if (rpc.Api.isSimulationError(simulation)) {
        throw new Error(`Simulation failed: ${simulation.error}`);
      }

      transaction = rpc.assembleTransaction(transaction, simulation).build();
      const txXdr = transaction.toEnvelope().toXDR("base64");

      const { signedTxXdr } = await StellarWalletsKit.signTransaction(txXdr, {
        networkPassphrase: Networks.TESTNET,
        address: currentAddress,
      });

      if (!signedTxXdr) {
        throw new Error("Transaction was not signed.");
      }

      return await submitTransaction(signedTxXdr);
    } catch (err: any) {
      console.error("Refund escrow failed:", err);
      throw new Error(parseWalletError(err, "transaction"));
    }
  }, [checkConnection]);

  // Call submit_milestone on Escrow smart contract
  const submitMilestone = useCallback(async (
    escrowContract: string,
    escrowId: string,
    milestoneIndex: number
  ) => {
    const currentAddress = stateRef.current.address;
    if (!currentAddress) {
      throw new Error("Wallet is not connected.");
    }

    if (currentAddress === "GBZXN7PIRZGNMHGA7MUUUF4GWPY5ALY4UV2GL6VJGIQRXFDNMADIXXXX") {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return {
        hash: "mock_tx_hash_" + Math.random().toString(36).substr(2, 9),
        result: { status: "SUCCESS" },
      };
    }

    try {
      getKit();
      const account = await horizonServer.loadAccount(currentAddress);
      const fee = await horizonServer.fetchBaseFee();

      const escrowIdScVal = xdr.ScVal.scvBytes(Buffer.from(hexToUint8Array(escrowId)));
      const milestoneIndexScVal = xdr.ScVal.scvU32(milestoneIndex);
      const freelancerScVal = nativeToScVal(new Address(currentAddress));

      const contract = new Contract(escrowContract);
      const invokeOp = contract.call(
        "submit_milestone",
        escrowIdScVal,
        milestoneIndexScVal,
        freelancerScVal
      );

      let transaction = new TransactionBuilder(account, {
        fee: fee.toString(),
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(invokeOp)
        .setTimeout(120)
        .build();

      const simulation = await rpcServer.simulateTransaction(transaction);
      if (rpc.Api.isSimulationError(simulation)) {
        throw new Error(`Simulation failed: ${simulation.error}`);
      }

      transaction = rpc.assembleTransaction(transaction, simulation).build();
      const txXdr = transaction.toEnvelope().toXDR("base64");

      const { signedTxXdr } = await StellarWalletsKit.signTransaction(txXdr, {
        networkPassphrase: Networks.TESTNET,
        address: currentAddress,
      });

      if (!signedTxXdr) {
        throw new Error("Transaction was not signed.");
      }

      return await submitTransaction(signedTxXdr);
    } catch (err: any) {
      console.error("Submit milestone failed:", err);
      throw new Error(parseWalletError(err, "transaction"));
    }
  }, [checkConnection]);

  // Call dispute_milestone on Escrow smart contract
  const disputeMilestone = useCallback(async (
    escrowContract: string,
    escrowId: string,
    milestoneIndex: number
  ) => {
    const currentAddress = stateRef.current.address;
    if (!currentAddress) {
      throw new Error("Wallet is not connected.");
    }

    if (currentAddress === "GBZXN7PIRZGNMHGA7MUUUF4GWPY5ALY4UV2GL6VJGIQRXFDNMADIXXXX") {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return {
        hash: "mock_tx_hash_" + Math.random().toString(36).substr(2, 9),
        result: { status: "SUCCESS" },
      };
    }

    try {
      getKit();
      const account = await horizonServer.loadAccount(currentAddress);
      const fee = await horizonServer.fetchBaseFee();

      const escrowIdScVal = xdr.ScVal.scvBytes(Buffer.from(hexToUint8Array(escrowId)));
      const milestoneIndexScVal = xdr.ScVal.scvU32(milestoneIndex);
      const clientScVal = nativeToScVal(new Address(currentAddress));

      const contract = new Contract(escrowContract);
      const invokeOp = contract.call(
        "dispute_milestone",
        escrowIdScVal,
        milestoneIndexScVal,
        clientScVal
      );

      let transaction = new TransactionBuilder(account, {
        fee: fee.toString(),
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(invokeOp)
        .setTimeout(120)
        .build();

      const simulation = await rpcServer.simulateTransaction(transaction);
      if (rpc.Api.isSimulationError(simulation)) {
        throw new Error(`Simulation failed: ${simulation.error}`);
      }

      transaction = rpc.assembleTransaction(transaction, simulation).build();
      const txXdr = transaction.toEnvelope().toXDR("base64");

      const { signedTxXdr } = await StellarWalletsKit.signTransaction(txXdr, {
        networkPassphrase: Networks.TESTNET,
        address: currentAddress,
      });

      if (!signedTxXdr) {
        throw new Error("Transaction was not signed.");
      }

      return await submitTransaction(signedTxXdr);
    } catch (err: any) {
      console.error("Dispute milestone failed:", err);
      throw new Error(parseWalletError(err, "transaction"));
    }
  }, [checkConnection]);

  // Call auto_release_milestone on Escrow smart contract
  const autoReleaseMilestone = useCallback(async (
    escrowContract: string,
    escrowId: string,
    milestoneIndex: number
  ) => {
    const currentAddress = stateRef.current.address;
    if (!currentAddress) {
      throw new Error("Wallet is not connected.");
    }

    if (currentAddress === "GBZXN7PIRZGNMHGA7MUUUF4GWPY5ALY4UV2GL6VJGIQRXFDNMADIXXXX") {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return {
        hash: "mock_tx_hash_" + Math.random().toString(36).substr(2, 9),
        result: { status: "SUCCESS" },
      };
    }

    try {
      getKit();
      const account = await horizonServer.loadAccount(currentAddress);
      const fee = await horizonServer.fetchBaseFee();

      const escrowIdScVal = xdr.ScVal.scvBytes(Buffer.from(hexToUint8Array(escrowId)));
      const milestoneIndexScVal = xdr.ScVal.scvU32(milestoneIndex);

      const contract = new Contract(escrowContract);
      const invokeOp = contract.call(
        "auto_release_milestone",
        escrowIdScVal,
        milestoneIndexScVal
      );

      let transaction = new TransactionBuilder(account, {
        fee: fee.toString(),
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(invokeOp)
        .setTimeout(120)
        .build();

      const simulation = await rpcServer.simulateTransaction(transaction);
      if (rpc.Api.isSimulationError(simulation)) {
        throw new Error(`Simulation failed: ${simulation.error}`);
      }

      transaction = rpc.assembleTransaction(transaction, simulation).build();
      const txXdr = transaction.toEnvelope().toXDR("base64");

      const { signedTxXdr } = await StellarWalletsKit.signTransaction(txXdr, {
        networkPassphrase: Networks.TESTNET,
        address: currentAddress,
      });

      if (!signedTxXdr) {
        throw new Error("Transaction was not signed.");
      }

      return await submitTransaction(signedTxXdr);
    } catch (err: any) {
      console.error("Auto-release milestone failed:", err);
      throw new Error(parseWalletError(err, "transaction"));
    }
  }, [checkConnection]);

  return {
    ...state,
    connect,
    disconnect,
    sendXLM,
    routePayment,
    routeToEscrow,
    releaseMilestone,
    refundEscrow,
    submitMilestone,
    disputeMilestone,
    autoReleaseMilestone,
    refresh: checkConnection,
  };

}
