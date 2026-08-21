import { Order, IOrder } from "../order/order.model";
import { Product } from "../product/product.model";
import shiprocketService, { ShiprocketCreateOrderPayload } from "../../services/shiprocket.service";
import { AppError } from "../../utils/AppError";
import {
  ServiceabilityDTO,
  ServiceabilityResponse,
  TrackingResponse,
  TrackingEvent,
  ShiprocketWebhookPayload,
  CourierOption,
} from "./delivery.types";

/**
 * Calculates total shipment weight & dimensions from order or cart items.
 */
export const calculateShipmentPackage = async (items: Array<{ product: any; quantity: number; variantId?: string }>) => {
  let totalWeight = 0;
  let maxLength = 10;
  let maxWidth = 10;
  let maxHeight = 10;

  for (const item of items) {
    const productDoc =
      typeof item.product === "object" && item.product?._id
        ? item.product
        : await Product.findById(item.product);

    if (!productDoc) continue;

    let itemWeight = productDoc.weight || 0.5;
    let itemLength = productDoc.length || 10;
    let itemWidth = productDoc.width || 10;
    let itemHeight = productDoc.height || 10;

    // Check variant overrides if applicable
    if (item.variantId && productDoc.variants && productDoc.variants.length > 0) {
      const variant = productDoc.variants.find((v: any) => v._id?.toString() === item.variantId || v.sku === item.variantId);
      if (variant) {
        if (variant.weight) itemWeight = variant.weight;
        if (variant.length) itemLength = variant.length;
        if (variant.width) itemWidth = variant.width;
        if (variant.height) itemHeight = variant.height;
      }
    }

    totalWeight += itemWeight * item.quantity;
    maxLength = Math.max(maxLength, itemLength);
    maxWidth = Math.max(maxWidth, itemWidth);
    maxHeight = Math.max(maxHeight, itemHeight + Math.ceil(item.quantity * 2));
  }

  return {
    weight: Math.max(0.1, Math.round(totalWeight * 100) / 100),
    length: Math.max(10, maxLength),
    width: Math.max(10, maxWidth),
    height: Math.max(10, maxHeight),
  };
};

/**
 * Check delivery serviceability by pincode
 */
export const checkPincodeServiceability = async (
  data: ServiceabilityDTO
): Promise<ServiceabilityResponse> => {
  try {
    const weight = data.weight || 0.5;
    const response = await shiprocketService.checkServiceability({
      delivery_postcode: data.deliveryPincode,
      weight,
      cod: Boolean(data.cod),
    });

    const status = response?.status;
    const availableCourierList = response?.data?.available_courier_companies || [];

    if (status !== 200 || availableCourierList.length === 0) {
      return {
        serviceable: false,
      };
    }

    const availableCouriers: CourierOption[] = availableCourierList.map((c: any) => ({
      courierId: c.courier_company_id,
      courierName: c.courier_name,
      rate: Number(c.rate) || 0,
      etd: c.etd || "3-5 Business Days",
      minWeight: c.min_weight,
      rating: c.rating,
    }));

    // Sort by rate ascending
    availableCouriers.sort((a, b) => a.rate - b.rate);

    const cheapest = availableCouriers[0];
    const estimatedDeliveryDate = cheapest?.etd || "3-5 Business Days";
    const shippingCharge = cheapest?.rate || 0;

    return {
      serviceable: true,
      estimatedDeliveryDate,
      availableCouriers,
      shippingCharge,
    };
  } catch (error: any) {
    console.error("[DeliveryService] Serviceability check failed:", error.message);
    return {
      serviceable: false,
    };
  }
};

/**
 * Creates a Shiprocket Order for a given Zenfaz order.
 * Idempotent: checks if shipmentId already exists.
 */
export const createShiprocketOrderForOrder = async (orderId: string): Promise<any> => {
  const order = await Order.findById(orderId).populate("items.product");

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // Prevent duplicate shipment creation
  if (order.deliveryDetails?.shipmentId) {
    console.log(`[DeliveryService] Order ${orderId} already has shipmentId: ${order.deliveryDetails.shipmentId}`);
    return order;
  }

  const { weight, length, width, height } = await calculateShipmentPackage(order.items);

  const formattedOrderDate = new Date(order.createdAt).toISOString().replace("T", " ").substring(0, 19);

  const orderItems = order.items.map((item) => {
    const productDoc = typeof item.product === "object" ? (item.product as any) : null;
    const name = productDoc?.name || "Product Item";
    const sku = productDoc?.sku || item.variantId || `SKU-${productDoc?._id || item.product}`;
    const hsn = productDoc?.hsn || "";

    return {
      name: name.substring(0, 50),
      sku: sku.substring(0, 50),
      units: item.quantity,
      selling_price: item.price,
      tax: item.gstPercentage || 0,
      hsn,
    };
  });

  const address = order.shippingAddress;
  const customerEmail = order.isGuestOrder ? (order.guestEmail || "customer@zenfaz.com") : "customer@zenfaz.com";

  const payload: ShiprocketCreateOrderPayload = {
    order_id: order._id.toString(),
    order_date: formattedOrderDate,
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
    billing_customer_name: address.firstName,
    billing_last_name: address.lastName || "",
    billing_address: address.street,
    billing_city: address.city,
    billing_pincode: address.postalCode,
    billing_state: address.state,
    billing_country: address.country || "India",
    billing_email: customerEmail,
    billing_phone: address.phone,
    shipping_is_billing: true,
    order_items: orderItems,
    payment_method: order.paymentMethod === "cod" ? "COD" : "Prepaid",
    shipping_charges: order.shippingCharge || 0,
    total_discount: order.discountAmount || 0,
    sub_total: order.totalPrice,
    length,
    width,
    height,
    weight,
  };

  console.log(`[DeliveryService] Sending order creation request to Shiprocket for order ${order._id}`);

  const res = await shiprocketService.createOrder(payload);

  const shipmentId = res?.shipment_id ? String(res.shipment_id) : undefined;

  if (!shipmentId) {
    throw new AppError(res?.message || "Failed to create shipment on Shiprocket", 500);
  }

  order.deliveryDetails = {
    ...(order.deliveryDetails || {}),
    shipmentId,
    currentStatus: "SHIPMENT_CREATED",
    pickupScheduledAt: new Date(),
    lastTrackingUpdate: new Date(),
  };

  if (order.status === "pending") {
    order.status = "processing";
  }

  await order.save();

  console.log(`[DeliveryService] Created Shiprocket shipment ${shipmentId} for order ${order._id}`);
  return order;
};

/**
 * Assigns Courier / AWB to a Shipment.
 */
export const assignAwbToOrder = async (orderId: string, courierId?: number): Promise<any> => {
  let order: any = await Order.findById(orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (!order.deliveryDetails?.shipmentId) {
    console.log(`[DeliveryService] No shipmentId for order ${orderId}. Creating shipment first...`);
    order = await createShiprocketOrderForOrder(orderId);
  }

  if (order.deliveryDetails?.awbCode) {
    console.log(`[DeliveryService] AWB code already assigned: ${order.deliveryDetails.awbCode}`);
    return order;
  }

  const shipmentId = order.deliveryDetails!.shipmentId!;

  const res = await shiprocketService.assignAwb({
    shipment_id: shipmentId,
    courier_id: courierId,
  });

  const awbCode = res?.response?.data?.awb_code || res?.awb_code;
  const courierName = res?.response?.data?.courier_name || res?.courier_name;
  const assignedCourierId = res?.response?.data?.courier_company_id || res?.courier_company_id || courierId;

  if (!awbCode) {
    throw new AppError(res?.message || "Failed to assign AWB on Shiprocket", 500);
  }

  const trackingUrl = `https://shiprocket.co/tracking/${awbCode}`;

  order.deliveryDetails = {
    ...(order.deliveryDetails || {}),
    awbCode,
    courierName: courierName || "Shiprocket Partner",
    courierId: assignedCourierId ? Number(assignedCourierId) : undefined,
    trackingUrl,
    currentStatus: "AWB_ASSIGNED",
    shippedAt: new Date(),
    lastTrackingUpdate: new Date(),
  };

  if (order.status === "pending" || order.status === "processing") {
    order.status = "shipped";
  }

  await order.save();

  console.log(`[DeliveryService] AWB ${awbCode} assigned to order ${orderId}`);
  return order;
};

/**
 * Generates and saves Shipping Label for an order.
 */
export const generateOrderShippingLabel = async (orderId: string): Promise<{ labelUrl: string }> => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (!order.deliveryDetails?.shipmentId) {
    throw new AppError("Shipment must be created before generating shipping label", 400);
  }

  const shipmentId = order.deliveryDetails.shipmentId;
  const res = await shiprocketService.generateLabel(shipmentId);

  const labelUrl = res?.label_created ? res.label_url : (res?.label_url || res?.url);

  if (!labelUrl) {
    throw new AppError(res?.message || "Shipping label URL not available", 500);
  }

  order.deliveryDetails = {
    ...(order.deliveryDetails || {}),
    labelUrl,
    lastTrackingUpdate: new Date(),
  };

  await order.save();

  return { labelUrl };
};

/**
 * Fetch live shipment tracking details.
 */
export const getOrderTrackingDetails = async (orderId: string): Promise<TrackingResponse> => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  const delivery = order.deliveryDetails;

  if (!delivery?.shipmentId && !delivery?.awbCode) {
    return {
      orderId: order._id.toString(),
      status: "PROCESSING",
      events: [
        {
          status: "ORDER_CONFIRMED",
          description: "Order confirmed and being prepared for shipment",
          timestamp: order.createdAt.toISOString(),
        },
      ],
    };
  }

  try {
    let rawTracking: any = null;

    if (delivery.shipmentId) {
      rawTracking = await shiprocketService.trackShipment(delivery.shipmentId);
    } else if (delivery.awbCode) {
      rawTracking = await shiprocketService.trackAwb(delivery.awbCode);
    }

    const trackingData = rawTracking?.tracking_data || rawTracking;
    const trackStatus = trackingData?.shipment_track?.[0]?.current_status || trackingData?.track_status || delivery.currentStatus || "IN_TRANSIT";
    const etd = trackingData?.shipment_track?.[0]?.etd || trackingData?.etd;

    const rawActivities = trackingData?.shipment_track_activities || trackingData?.scans || [];
    const events: TrackingEvent[] = rawActivities.map((act: any) => ({
      status: act.status || act.activity || "UPDATED",
      description: act.activity || act.status || "Package update",
      location: act.location || act["sr-status-label"] || "",
      timestamp: act.date || act.time || new Date().toISOString(),
    }));

    if (events.length === 0) {
      events.push({
        status: trackStatus,
        description: "Package in transit",
        timestamp: new Date().toISOString(),
      });
    }

    // Update order status if delivery date or currentStatus changed
    if (trackStatus && order.deliveryDetails) {
      order.deliveryDetails.currentStatus = trackStatus;
      order.deliveryDetails.lastTrackingUpdate = new Date();
      if (etd) {
        order.deliveryDetails.estimatedDeliveryDate = new Date(etd);
      }
      await order.save();
    }

    return {
      orderId: order._id.toString(),
      awbCode: delivery.awbCode,
      courierName: delivery.courierName,
      status: trackStatus,
      trackingUrl: delivery.trackingUrl,
      estimatedDeliveryDate: etd || (delivery.estimatedDeliveryDate ? delivery.estimatedDeliveryDate.toISOString() : undefined),
      events,
    };
  } catch (error: any) {
    console.warn(`[DeliveryService] Live tracking request error for order ${orderId}:`, error.message);
    return {
      orderId: order._id.toString(),
      awbCode: delivery?.awbCode,
      courierName: delivery?.courierName,
      status: delivery?.currentStatus || "IN_TRANSIT",
      trackingUrl: delivery?.trackingUrl,
      estimatedDeliveryDate: delivery?.estimatedDeliveryDate?.toISOString(),
      events: [
        {
          status: delivery?.currentStatus || "PROCESSING",
          description: "Shipment update in progress",
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }
};

/**
 * Cancel Shipment on Shiprocket
 */
export const cancelOrderShipment = async (orderId: string): Promise<any> => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.status === "delivered") {
    throw new AppError("Cannot cancel a delivered order shipment", 400);
  }

  const shipmentId = order.deliveryDetails?.shipmentId;

  if (shipmentId) {
    try {
      await shiprocketService.cancelOrder([shipmentId]);
    } catch (error: any) {
      console.warn(`[DeliveryService] Shiprocket API cancel warning for order ${orderId}:`, error.message);
    }
  }

  order.status = "cancelled";
  if (order.deliveryDetails) {
    order.deliveryDetails.currentStatus = "CANCELED";
    order.deliveryDetails.lastTrackingUpdate = new Date();
  }

  // Restore stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity },
    });
  }

  await order.save();

  return order;
};

/**
 * Shiprocket Webhook Handler (Idempotent)
 */
export const processShiprocketWebhookPayload = async (payload: ShiprocketWebhookPayload): Promise<void> => {
  const orderId = payload.order_id;
  const shipmentId = payload.shipment_id ? String(payload.shipment_id) : undefined;
  const awb = payload.awb;

  let order: IOrder | null = null;

  if (orderId) {
    order = await Order.findById(orderId);
  }

  if (!order && shipmentId) {
    order = await Order.findOne({ "deliveryDetails.shipmentId": shipmentId });
  }

  if (!order && awb) {
    order = await Order.findOne({ "deliveryDetails.awbCode": awb });
  }

  if (!order) {
    console.warn("[ShiprocketWebhook] Order not found for payload:", { orderId, shipmentId, awb });
    return;
  }

  const rawStatus = (payload.current_status || payload.shipment_status || payload.status || "").toUpperCase();

  console.log(`[ShiprocketWebhook] Processing status '${rawStatus}' for order ${order._id}`);

  order.deliveryDetails = {
    ...(order.deliveryDetails || {}),
    shipmentId: shipmentId || order.deliveryDetails?.shipmentId,
    awbCode: awb || order.deliveryDetails?.awbCode,
    courierName: payload.courier_name || order.deliveryDetails?.courierName,
    currentStatus: rawStatus || order.deliveryDetails?.currentStatus,
    lastTrackingUpdate: new Date(),
  };

  if (payload.etd) {
    order.deliveryDetails.estimatedDeliveryDate = new Date(payload.etd);
  }

  // Map Shiprocket Status to Zenfaz Order Status
  if (rawStatus.includes("DELIVERED")) {
    order.status = "delivered";
    order.deliveryDetails.deliveredAt = new Date();
  } else if (
    rawStatus.includes("OUT FOR DELIVERY") ||
    rawStatus.includes("IN TRANSIT") ||
    rawStatus.includes("PICKED UP") ||
    rawStatus.includes("SHIPPED") ||
    rawStatus.includes("AWB ASSIGNED")
  ) {
    if (order.status !== "delivered") {
      order.status = "shipped";
    }
    if (!order.deliveryDetails.shippedAt) {
      order.deliveryDetails.shippedAt = new Date();
    }
  } else if (rawStatus.includes("CANCELED") || rawStatus.includes("CANCELLED")) {
    if (order.status !== "delivered") {
      order.status = "cancelled";
    }
  }

  await order.save();
  console.log(`[ShiprocketWebhook] Successfully updated order ${order._id} status to ${order.status}`);
};
