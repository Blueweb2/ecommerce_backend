import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { env } from "../config/env";

export interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: string;
}

export interface ShiprocketCreateOrderPayload {
  order_id: string;
  order_date: string;
  pickup_location: string;
  channel_id?: string;
  comment?: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_address_2?: string;
  shipping_city?: string;
  shipping_pincode?: string;
  shipping_country?: string;
  shipping_state?: string;
  shipping_email?: string;
  shipping_phone?: string;
  order_items: ShiprocketOrderItem[];
  payment_method: "Prepaid" | "COD";
  shipping_charges?: number;
  giftwrap_charges?: number;
  transaction_charges?: number;
  total_discount?: number;
  sub_total: number;
  length: number;
  width: number;
  height: number;
  weight: number;
}

export interface ShiprocketServiceabilityParams {
  pickup_postcode?: string;
  delivery_postcode: string;
  weight: number;
  cod: boolean;
}

class ShiprocketService {
  private token: string | null = null;
  private tokenExpiry: number = 0;
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.SHIPROCKET_BASE_URL || "https://apiv2.shiprocket.in/v1/external",
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Retrieves or refreshes Shiprocket JWT Token.
   */
  public async getToken(): Promise<string> {
    const now = Date.now();
    // Token is valid for 10 days; refresh 1 hour before expiry
    if (this.token && now < this.tokenExpiry) {
      return this.token;
    }
    console.log("[Shiprocket] Email:", env.SHIPROCKET_EMAIL);
console.log(
  "[Shiprocket] Password loaded:",
  Boolean(env.SHIPROCKET_PASSWORD)
);
console.log(
  "[Shiprocket] Password length:",
  env.SHIPROCKET_PASSWORD.length
);
console.log(
  "[Shiprocket] Base URL:",
  env.SHIPROCKET_BASE_URL
);

    try {
      const response = await this.client.post("/auth/login", {
        email: env.SHIPROCKET_EMAIL,
        password: env.SHIPROCKET_PASSWORD,
      });

      if (!response.data?.token) {
        throw new Error("Invalid response format from Shiprocket login API");
      }

      const token = response.data.token as string;
      this.token = token;
      // Set expiration to 9 days from now (safe buffer)
      this.tokenExpiry = now + 9 * 24 * 60 * 60 * 1000;
      console.log("[ShiprocketService] Successfully authenticated with Shiprocket.");
      return token;
    } catch (error: any) {
      console.error(
        "[ShiprocketService] Authentication failed:",
        error.response?.data?.message || error.message
      );
      this.token = null;
      this.tokenExpiry = 0;
      throw new Error("Shiprocket authentication failed");
    }
  }

  /**
   * Authenticated HTTP Request Helper with Token Auto-Retry
   */
  private async request<T = any>(
    config: AxiosRequestConfig,
    retryOnAuthFail = true
  ): Promise<T> {
    const token = await this.getToken();
    const headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await this.client.request<T>({
        ...config,
        headers,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401 && retryOnAuthFail) {
        console.warn("[ShiprocketService] Token invalid/expired. Retrying authentication...");
        this.token = null;
        this.tokenExpiry = 0;
        return this.request<T>(config, false);
      }

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Shiprocket API request failed";

      console.error(
        `[ShiprocketService] Request to ${config.url} failed (${error.response?.status}):`,
        errorMessage
      );

      throw new Error(
        typeof errorMessage === "string"
          ? errorMessage
          : JSON.stringify(errorMessage)
      );
    }
  }

  /**
   * Check Delivery Serviceability & Courier Rates
   */
  public async checkServiceability(params: ShiprocketServiceabilityParams) {
    const pickupPostcode = params.pickup_postcode || env.SHIPROCKET_PICKUP_PINCODE || "679329";

    const query = {
      pickup_postcode: pickupPostcode,
      delivery_postcode: params.delivery_postcode,
      weight: params.weight.toString(),
      cod: params.cod ? "1" : "0",
    };

    return await this.request({
      method: "GET",
      url: "/courier/serviceability/",
      params: query,
    });
  }

  /**
   * Create Order on Shiprocket
   */
  public async createOrder(payload: ShiprocketCreateOrderPayload) {
    return await this.request({
      method: "POST",
      url: "/orders/create/adhoc",
      data: payload,
    });
  }

  /**
   * Assign Courier / AWB to Shipment
   */
  public async assignAwb(payload: { shipment_id: number | string; courier_id?: number | string }) {
    return await this.request({
      method: "POST",
      url: "/courier/assign/awb",
      data: {
        shipment_id: payload.shipment_id,
        courier_id: payload.courier_id,
      },
    });
  }

  /**
   * Generate Shipping Label
   */
  public async generateLabel(shipmentId: number | string) {
    return await this.request({
      method: "POST",
      url: "/courier/generate/label",
      data: {
        shipment_id: [shipmentId],
      },
    });
  }

  /**
   * Track Shipment by Shipment ID
   */
  public async trackShipment(shipmentId: number | string) {
    return await this.request({
      method: "GET",
      url: `/courier/track/shipment/${shipmentId}`,
    });
  }

  /**
   * Track Shipment by AWB Code
   */
  public async trackAwb(awbCode: string) {
    return await this.request({
      method: "GET",
      url: `/courier/track/awb/${awbCode}`,
    });
  }

  /**
   * Cancel Shipment / Order on Shiprocket
   */
  public async cancelOrder(shipmentIds: (number | string)[]) {
    return await this.request({
      method: "POST",
      url: "/orders/cancel",
      data: {
        ids: shipmentIds,
      },
    });
  }
}

export default new ShiprocketService();