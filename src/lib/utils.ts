import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { QrReadResponse } from "./api";
import { NETWORKS } from "@/lib/networks";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse a network token string from a NASPIP token
 * Format: network_tTokenAddress
 * Example: npolygon_t0x3c499c542cef5e3811e1192ce70d8cc03d5c3359
 *
 * @param networkToken The network token string from the NASPIP token
 * @returns An object with the network ID and token address
 */
export function parseNetworkToken(networkToken: string): {
  networkId: number | null;
  tokenAddress: string | null;
} {
  try {
    // Split by _t to get network and token address
    const [networkPart, tokenAddress] = networkToken.split("_t");

    // Remove the 'n' prefix from network part
    const networkName = networkPart.substring(1);

    // Map network name to network ID
    let networkId: number | null = null;

    if (networkName === "ethereum") {
      networkId = NETWORKS.erc20.metamaskNetworkId;
    } else if (networkName === "polygon") {
      networkId = NETWORKS.polygon.metamaskNetworkId;
    } else if (networkName === "bsc") {
      networkId = NETWORKS.bep20.metamaskNetworkId;
    }

    return {
      networkId,
      tokenAddress: tokenAddress || null,
    };
  } catch (error) {
    console.error("Error parsing network token:", error);
    return {
      networkId: null,
      tokenAddress: null,
    };
  }
}

/**
 * Extract payment information from a NASPIP token response
 *
 * @param response The QR read response from the API
 * @returns Payment information object
 */
export function extractPaymentInfo(response: QrReadResponse) {
  const payment = response.data.payload.data.payment;
  const order = response.data.payload.data.order;

  // Parse the network token to get network ID and token address
  const { networkId, tokenAddress } = parseNetworkToken(
    payment.unique_asset_id,
  );

  return {
    id: payment.id,
    address: payment.address as `0x${string}`,
    amount: payment.amount,
    networkId,
    tokenAddress,
    isOpen: payment.is_open,
    expiresAt: payment.expires_at,
    order: order
      ? {
          totalAmount: order.total,
          coinCode: order.coin_code,
          merchant: order.merchant,
          items: order.items,
        }
      : null,
  };
}
