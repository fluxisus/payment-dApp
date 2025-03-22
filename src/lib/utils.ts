import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { QrReadResponse } from "./api";
import { getChainId } from "@/lib/networks";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse a NASPIP unique asset ID string from a NASPIP token
 * Format: nNetworkName_tTokenAddress
 * Example: npolygon_t0x3c499c542cef5e3811e1192ce70d8cc03d5c3359
 *
 * @param networkToken The NASPIP unique asset ID string from the NASPIP token
 * @returns An object with the NASPIP network name and token address
 */
export function parseNaspipUniqueAssetId(networkToken: string): {
  naspipNetwork: string;
  tokenAddress: string;
} {
  try {
    // Split by _t to get network and token address
    const [networkPart, tokenAddress] = networkToken.split("_t");

    // Remove the 'n' prefix from network part
    const networkName = networkPart.substring(1);

    return {
      naspipNetwork: networkName,
      tokenAddress,
    };
  } catch (error) {
    console.error("Error parsing network token:", error);
    return { naspipNetwork: "", tokenAddress: "" };
  }
}

/**
 * Extract payment information from a NASPIP token response
 *
 * @param response The QR read response from the API
 * @returns Payment information object
 */
export function extractPaymentInfo(response: QrReadResponse) {
  const payment = response.payload.data.payment;
  const order = response.payload.data.order;

  // Parse the network token to get network ID and token address
  const { naspipNetwork, tokenAddress } = parseNaspipUniqueAssetId(
    payment.unique_asset_id,
  );

  const networkId = getChainId(naspipNetwork);

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
