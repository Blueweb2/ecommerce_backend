export interface ServiceabilityDTO {
  deliveryPincode: string;
  weight?: number;
  cod?: boolean;
}

export interface CourierOption {
  courierId: number;
  courierName: string;
  rate: number;
  etd: string;
  minWeight?: number;
  rating?: number;
}

export interface ServiceabilityResponse {
  serviceable: boolean;
  estimatedDeliveryDate?: string;
  availableCouriers?: CourierOption[];
  shippingCharge?: number;
}

export interface TrackingEvent {
  status: string;
  description?: string;
  location?: string;
  timestamp: string;
}

export interface TrackingResponse {
  orderId: string;
  awbCode?: string;
  courierName?: string;
  status: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: string;
  events: TrackingEvent[];
}

export interface ShiprocketWebhookPayload {
  order_id?: string;
  shipment_id?: number | string;
  awb?: string;
  courier_name?: string;
  current_status?: string;
  current_status_id?: number;
  shipment_status?: string;
  shipment_status_id?: number;
  status?: string;
  etd?: string;
  scans?: Array<{
    date?: string;
    status?: string;
    activity?: string;
    location?: string;
  }>;
  sr_order_id?: number | string;
}
