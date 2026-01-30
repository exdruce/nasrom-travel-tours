/**
 * Bayarcash Payment Gateway Utility
 * API Documentation: https://api.webimpian.support/bayarcash
 */

import crypto from "crypto";

// ============================================
// Configuration
// ============================================

const SANDBOX_API_URL = "https://console.bayarcash-sandbox.com/api/v2";
const PRODUCTION_API_URL = "https://console.bayar.cash/api/v2";

export function getBayarcashConfig() {
  const isSandbox = process.env.BAYARCASH_SANDBOX === "true";
  return {
    apiUrl: isSandbox ? SANDBOX_API_URL : PRODUCTION_API_URL,
    portalKey: process.env.BAYARCASH_PORTAL_KEY || "",
    apiToken: process.env.BAYARCASH_API_TOKEN || "",
    secretKey: process.env.BAYARCASH_API_SECRET_KEY || "",
    isSandbox,
  };
}

// ============================================
// Payment Channels
// ============================================

export const PAYMENT_CHANNELS = {
  FPX: 1,
  MANUAL_TRANSFER: 2,
  FPX_DIRECT_DEBIT: 3,
  FPX_LINE_OF_CREDIT: 4,
  DUITNOW_DOBW: 5,
  DUITNOW_QR: 6,
  SPAYLATER: 7,
  BOOST_PAYFLEX: 8,
  QRISOB: 9,
  QRISWALLET: 10,
  NETS: 11,
  CREDIT_CARD: 12,
  ALIPAY: 13,
  WECHATPAY: 14,
  PROMPTPAY: 15,
  TOUCH_N_GO: 16,
  BOOST_WALLET: 17,
  GRABPAY: 18,
  GRABPL: 19,
  SHOPEE_PAY: 20,
} as const;

export type PaymentChannel = keyof typeof PAYMENT_CHANNELS;

export const PAYMENT_CHANNEL_LABELS: Record<PaymentChannel, string> = {
  FPX: "FPX Online Banking",
  MANUAL_TRANSFER: "Manual Bank Transfer",
  FPX_DIRECT_DEBIT: "FPX Direct Debit",
  FPX_LINE_OF_CREDIT: "FPX Line of Credit",
  DUITNOW_DOBW: "DuitNow Online Banking",
  DUITNOW_QR: "DuitNow QR",
  SPAYLATER: "SPayLater",
  BOOST_PAYFLEX: "Boost PayFlex",
  QRISOB: "QRIS Online Banking",
  QRISWALLET: "QRIS Wallet",
  NETS: "NETS",
  CREDIT_CARD: "Credit/Debit Card",
  ALIPAY: "Alipay",
  WECHATPAY: "WeChat Pay",
  PROMPTPAY: "PromptPay",
  TOUCH_N_GO: "Touch 'n Go",
  BOOST_WALLET: "Boost",
  GRABPAY: "GrabPay",
  GRABPL: "Grab PayLater",
  SHOPEE_PAY: "ShopeePay",
};

// Primary channels - update this based on what's enabled in your Bayarcash portal
export const PRIMARY_CHANNELS: PaymentChannel[] = [
  "FPX",
  "FPX_LINE_OF_CREDIT",
  "DUITNOW_DOBW",
  "DUITNOW_QR",
];

// ============================================
// Payment Status Mapping
// ============================================

export const BAYARCASH_STATUS = {
  NEW: 0,
  PENDING: 1,
  UNSUCCESSFUL: 2,
  SUCCESSFUL: 3,
  CANCELLED: 4,
} as const;

export function mapBayarcashStatus(status: number): string {
  switch (status) {
    case BAYARCASH_STATUS.NEW:
      return "pending";
    case BAYARCASH_STATUS.PENDING:
      return "processing";
    case BAYARCASH_STATUS.SUCCESSFUL:
      return "succeeded";
    case BAYARCASH_STATUS.UNSUCCESSFUL:
    case BAYARCASH_STATUS.CANCELLED:
      return "failed";
    default:
      return "pending";
  }
}

// ============================================
// Checksum Functions
// ============================================

export interface PaymentIntentData {
  portal_key: string;
  order_number: string;
  amount: string; // In cents (e.g., "10000" for RM100.00)
  payer_name: string;
  payer_email: string;
  payer_telephone_number: string;
  payment_channel: number;
  return_url: string;
}

/**
 * Create checksum for payment intent request
 * Based on Bayarcash PHP SDK: createPaymentIntentChecksumValue
 * Checksum = HMAC-SHA256(secret_key, sorted_concatenated_values)
 */
export function createPaymentIntentChecksum(
  secretKey: string,
  data: PaymentIntentData,
): string {
  // Only use specific fields for checksum (matching Bayarcash PHP SDK)
  const payload: Record<string, string> = {
    payment_channel: String(data.payment_channel),
    order_number: data.order_number,
    amount: data.amount,
    payer_name: data.payer_name,
    payer_email: data.payer_email,
  };

  // Sort keys alphabetically (like PHP ksort)
  const sortedKeys = Object.keys(payload).sort();

  // Concatenate sorted values with |
  const concatenated = sortedKeys.map((key) => payload[key]).join("|");

  return crypto
    .createHmac("sha256", secretKey)
    .update(concatenated)
    .digest("hex");
}

/**
 * Verify callback checksum from Bayarcash
 */
export function verifyCallbackChecksum(
  secretKey: string,
  callbackData: Record<string, string>,
  receivedChecksum: string,
): boolean {
  // Fields used for callback checksum verification
  const fieldsToHash = [
    "record_type",
    "transaction_id",
    "exchange_reference_number",
    "exchange_transaction_id",
    "order_number",
    "currency",
    "amount",
    "payer_name",
    "payer_email",
    "payer_bank_name",
    "status",
    "status_description",
    "datetime",
  ];

  const concatenated = fieldsToHash
    .map((field) => callbackData[field] || "")
    .join("|");

  const calculatedChecksum = crypto
    .createHmac("sha256", secretKey)
    .update(concatenated)
    .digest("hex");

  return calculatedChecksum === receivedChecksum;
}

// ============================================
// API Functions
// ============================================

export interface CreatePaymentIntentRequest {
  orderNumber: string;
  amount: number; // In RM (e.g., 100.00)
  payerName: string;
  payerEmail: string;
  payerPhone: string;
  paymentChannel: PaymentChannel;
  returnUrl: string;
}

export interface CreatePaymentIntentResponse {
  success: boolean;
  url?: string;
  paymentIntentId?: string;
  error?: string;
}

export async function createPaymentIntent(
  request: CreatePaymentIntentRequest,
): Promise<CreatePaymentIntentResponse> {
  const config = getBayarcashConfig();

  if (!config.portalKey || !config.apiToken || !config.secretKey) {
    return {
      success: false,
      error: "Bayarcash credentials not configured",
    };
  }

  // Bayarcash expects amount in sen (cents) as string
  // Based on testing: Bayarcash treats the value as the actual currency (ringgit)
  // So RM 80.00 should be sent as "80", NOT "8000"
  const amountStr = Math.round(request.amount).toString();

  const data: PaymentIntentData = {
    portal_key: config.portalKey,
    order_number: request.orderNumber,
    amount: amountStr,
    payer_name: request.payerName,
    payer_email: request.payerEmail,
    payer_telephone_number: request.payerPhone,
    payment_channel: PAYMENT_CHANNELS[request.paymentChannel],
    return_url: request.returnUrl,
  };

  const checksum = createPaymentIntentChecksum(config.secretKey, data);

  try {
    const response = await fetch(`${config.apiUrl}/payment-intents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${config.apiToken}`,
      },
      body: JSON.stringify({
        ...data,
        checksum,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Bayarcash API Error:", result);
      return {
        success: false,
        error: result.message || result.error || JSON.stringify(result),
      };
    }

    // Extract Payment Intent ID from response ID or URL
    let paymentIntentId = result.id?.toString();

    if (!paymentIntentId && result.url) {
      const match = result.url.match(/\/payment-intent\/(pi_[a-zA-Z0-9]+)/);
      if (match && match[1]) {
        paymentIntentId = match[1];
      }
    }

    return {
      success: true,
      url: result.url,
      paymentIntentId: paymentIntentId,
    };
  } catch (error) {
    console.error("Bayarcash API error:", error);
    return {
      success: false,
      error: "Failed to connect to payment gateway",
    };
  }
}

// ============================================
// Transaction Status Query
// ============================================

interface TransactionStatusResponse {
  success: boolean;
  status?: string; // Our mapped status: pending, succeeded, failed
  bayarcashStatus?: number; // Original Bayarcash status code
  transactionId?: string;
  exchangeRefNumber?: string;
  error?: string;
}

/**
 * Get transaction status by order number
 * Useful for checking payment status when callback can't reach localhost
 */
export async function getTransactionByOrderNumber(
  orderNumber: string,
): Promise<TransactionStatusResponse> {
  const config = getBayarcashConfig();

  if (!config.apiToken) {
    return {
      success: false,
      error: "Bayarcash credentials not configured",
    };
  }

  try {
    const url = `${config.apiUrl}/transactions?order_number=${encodeURIComponent(orderNumber)}`;
    console.log("Querying transaction status URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${config.apiToken}`,
      },
    });

    const result = await response.json();
    console.log("Transaction query response status:", response.status);
    console.log(
      "Transaction query response body:",
      JSON.stringify(result, null, 2),
    );

    if (!response.ok) {
      return {
        success: false,
        error: result.message || "Failed to get transaction status",
      };
    }

    // Result should be an array of transactions
    const transactions = Array.isArray(result.data) ? result.data : [result];
    const transaction = transactions[0];

    if (!transaction) {
      return {
        success: false,
        error: "Transaction not found",
      };
    }

    return {
      success: true,
      status: mapBayarcashStatus(parseInt(transaction.status)),
      bayarcashStatus: parseInt(transaction.status),
      transactionId: transaction.transaction_id,
      exchangeRefNumber: transaction.exchange_reference_number,
    };
  } catch (error) {
    console.error("Error getting transaction status:", error);
    return {
      success: false,
      error: "Failed to connect to payment gateway",
    };
  }
}

/**
 * Get payment intent status by ID
 * Tries multiple endpoints since documentation is sparse
 */
export async function getPaymentIntentStatus(
  paymentIntentId: string,
): Promise<TransactionStatusResponse> {
  const config = getBayarcashConfig();

  if (!config.apiToken) {
    return {
      success: false,
      error: "Bayarcash credentials not configured",
    };
  }

  // Helper to fetch and parse
  const fetchEndpoint = async (url: string) => {
    try {
      console.log("Querying URL:", url);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${config.apiToken}`,
        },
      });
      const result = await response.json();
      console.log(
        `Response ${response.status}:`,
        JSON.stringify(result, null, 2),
      );
      return { ok: response.ok, status: response.status, result };
    } catch (e) {
      console.error("Fetch error:", e);
      return { ok: false, status: 500, result: null, error: e };
    }
  };

  // Strategy 1: Singular payment-intent endpoint
  // Use regex to get just the ID if it's not clean (e.g. if it has prefix)
  // But usually it's passed clean "pi_..."

  let res = await fetchEndpoint(
    `${config.apiUrl}/payment-intent/${paymentIntentId}`,
  );

  if (res.ok) {
    const intent = res.result.data || res.result;
    if (
      intent &&
      (intent.status !== undefined || intent.payment_status !== undefined)
    ) {
      return parseBayarcashResponse(intent);
    }
  }

  // Strategy 2: Transactions by payment intent ID
  res = await fetchEndpoint(
    `${config.apiUrl}/transactions?payment_intent_id=${paymentIntentId}`,
  );
  if (res.ok) {
    // Transaction list?
    const data = res.result.data || res.result;
    const transactions = Array.isArray(data) ? data : [data];
    if (transactions.length > 0) {
      return parseBayarcashResponse(transactions[0]);
    }
  }

  // Strategy 3: Transactions by uuid (sometimes PI ID is UUID?)
  res = await fetchEndpoint(`${config.apiUrl}/transactions/${paymentIntentId}`);
  if (res.ok) {
    const intent = res.result.data || res.result;
    return parseBayarcashResponse(intent);
  }

  // If all fail
  return {
    success: false,
    error: "Could not retrieve status from any known endpoint",
  };
}

function parseBayarcashResponse(data: any): TransactionStatusResponse {
  // Check for various status fields
  const rawStatus =
    data.status ?? data.payment_status ?? data.transaction_status;

  // Map status
  let status = "pending";
  if (
    rawStatus === 1 ||
    rawStatus === "1" ||
    rawStatus === "SUCCESSFUL" ||
    rawStatus === "COMPLETED" ||
    rawStatus === "succeeded"
  ) {
    status = "succeeded";
  } else if (rawStatus === 2 || rawStatus === "2" || rawStatus === "FAILED") {
    status = "failed";
  } else {
    // Try parsing int
    const intStatus = parseInt(rawStatus);
    if (!isNaN(intStatus)) {
      status = mapBayarcashStatus(intStatus);
    }
  }

  return {
    success: true,
    status,
    bayarcashStatus: rawStatus,
    transactionId: data.transaction_id ?? data.id,
    exchangeRefNumber: data.exchange_reference_number ?? data.reference_number,
  };
}
