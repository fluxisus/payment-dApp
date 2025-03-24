import { toast } from "@/components/ui/use-toast";
import { BACKEND_API_BASE_URL } from "@/lib/constants";
// Interface for the QR read response
export interface QrReadResponse {
  payload: {
    data: {
      payment: {
        id: string;
        address: string;
        unique_asset_id: string;
        is_open: boolean;
        amount: string;
        expires_at: number;
      };
      order?: {
        total: string;
        coin_code: string;
        merchant: {
          name: string;
          description: string;
          tax_id: string;
        };
        items: Array<{
          description: string;
          amount: string;
          unit_price: string;
          quantity: number;
          coin_code: string;
        }>;
      };
    };
    kid: string;
    kis: string;
    kep: string;
    iat: string;
    exp: string;
    iss: string;
  };
  version: string;
  purpose: string;
}

export interface QrTokenRequest {
  payment: {
    id: string;
    address: string;
    address_tag?: string;
    unique_asset_id: string;
    is_open?: boolean;
    amount?: string;
    min_amount?: string;
    max_amount?: string;
    expires_at: number;
  };
  order?: {
    total?: string;
    coin_code?: string;
    description?: string;
    merchant?: {
      name: string;
      description?: string;
      tax_id?: string;
      image?: string;
      mcc?: string;
    };
    items?: Array<{
      description?: string;
      amount?: string;
      unit_price?: string;
      quantity?: number;
      coin_code?: string;
    }>;
  };
}

/**
 * Read a NASPIP token from a QR code
 * @param token The NASPIP token to read
 * @returns The parsed payment instructions or null if invalid
 */
export async function readQrToken(
  token: string,
): Promise<QrReadResponse | null> {
  try {
    const requestBody = { token };

    const response = await fetch(`${BACKEND_API_BASE_URL}/public/qr/read`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error reading QR token:", errorData);
      throw new Error(errorData.message || "Failed to read QR token");
    }

    const data = await response.json();
    return data as QrReadResponse;
  } catch (error) {
    console.error("Error reading QR token:", error);
    toast({
      title: "Error Reading QR Code",
      description:
        error instanceof Error ? error.message : "Failed to read QR code",
      variant: "destructive",
    });
    return null;
  }
}

/**
 * Generate a NASPIP token for payment
 * @param paymentData The payment data to encode
 * @returns The generated token or null if generation failed
 */
export async function generateQrToken(
  paymentData: QrTokenRequest,
): Promise<{ ok: boolean; data: string; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/public/qr/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error generating QR token:", errorData);
      return { ok: false, data: "", error: "Failed to generate QR token" };
    }

    const data = await response.json();
    return { ok: true, data: data.token };
  } catch (error) {
    console.error("Error generating QR token:", error);
    return { ok: false, data: "", error: "Failed to generate QR code" };
  }
}
