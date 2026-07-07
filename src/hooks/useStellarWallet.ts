import { useState, useEffect, useCallback, useRef } from "react";
import { StellarWalletsKit, KitEventType, Networks as SWKNetworks } from "@creit.tech/stellar-wallets-kit";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";
import { Horizon, Networks, TransactionBuilder, Asset, Operation, Address, nativeToScVal, rpc, Contract } from "@stellar/stellar-sdk";

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

export function parseWalletError(err: any): string {
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
    return "Transaction Rejected: The request was rejected by the user.";
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
  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      getKit();
      const { address } = await StellarWalletsKit.authModal();
      if (!address) {
        throw new Error("No address returned from StellarWalletsKit.");
      }
      const balance = await fetchBalance(address);
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
        error: parseWalletError(err),
        isLoading: false,
      }));
    }
  }, [fetchBalance]);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      getKit();
      await StellarWalletsKit.disconnect();
    } catch (err) {
      console.error("SWK disconnect failed:", err);
    }
    setState({
      isConnected: false,
      address: null,
      balance: null,
      error: null,
      isLoading: false,
    });
  }, []);

  // Send XLM transaction
  const sendXLM = useCallback(async (destination: string, amount: string) => {
    const currentAddress = stateRef.current.address;
    if (!currentAddress) {
      throw new Error("Wallet is not connected.");
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
      throw new Error(parseWalletError(err));
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

    try {
      getKit();
      const contractId = process.env.NEXT_PUBLIC_ROUTER_CONTRACT_ID;
      if (!contractId) {
        throw new Error("Router contract ID is not configured.");
      }

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

      // 9. Update local balance after success
      await checkConnection();

      return {
        hash: sendResponse.hash,
        result: getResponse,
      };
    } catch (err: any) {
      console.error("Route payment failed:", err);
      throw new Error(parseWalletError(err));
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

  return {
    ...state,
    connect,
    disconnect,
    sendXLM,
    routePayment,
    refresh: checkConnection,
  };
}
