import { toast } from "@/components/ui/use-toast";
import { BACKEND_API_BASE_URL } from "@/lib/constants";
// Interface for the QR read response
export interface QrReadResponse {
  data: {
    payload: {
      payload: {
        payment: {
          id: string;
          address: string;
          network_token: string;
          is_open: boolean;
          amount: string;
          expires_at: number;
        };
        order?: {
          total_amount: string;
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
    // Log the token and request body for debugging
    console.log("Token to be sent:", token);
    const requestBody = { token };
    console.log("Request body:", requestBody);

    const response = await fetch(`${BACKEND_API_BASE_URL}/v1/qr/read`, {
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
    console.log("QR token read successfully:", data);
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
  paymentData: any,
): Promise<string | null> {
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/v1/qr/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error generating QR token:", errorData);
      throw new Error(errorData.message || "Failed to generate QR token");
    }

    const data = await response.json();
    console.log("QR token generated successfully:", data);
    return data.token;
  } catch (error) {
    console.error("Error generating QR token:", error);
    toast({
      title: "Error Generating QR Code",
      description:
        error instanceof Error ? error.message : "Failed to generate QR code",
      variant: "destructive",
    });
    return null;
  }
}
