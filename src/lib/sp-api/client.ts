/**
 * Amazon SP-API Client
 * Central client for making authenticated calls to Selling Partner APIs
 */

import { getAccessToken, getSTSCredentials } from './auth';
import aws4 from 'aws4';

export interface SPAPIRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface SPAPIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

// Rate limiting configuration per API
const RATE_LIMITS: Record<string, { requests: number; period: number }> = {
  default: { requests: 10, period: 1000 },
  inventory: { requests: 2, period: 1000 },
  orders: { requests: 5, period: 1000 },
  reports: { requests: 0.0167, period: 1000 }, // 1 per minute
};

const requestTimestamps: Record<string, number[]> = {};

/**
 * Check rate limiting before making request
 */
async function checkRateLimit(apiType: string): Promise<void> {
  const limit = RATE_LIMITS[apiType] || RATE_LIMITS.default;
  const now = Date.now();
  
  if (!requestTimestamps[apiType]) {
    requestTimestamps[apiType] = [];
  }

  // Remove old timestamps
  requestTimestamps[apiType] = requestTimestamps[apiType].filter(
    (ts) => now - ts < limit.period
  );

  // Check if we're at the limit
  if (requestTimestamps[apiType].length >= limit.requests) {
    const waitTime = limit.period - (now - requestTimestamps[apiType][0]);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  requestTimestamps[apiType].push(now);
}

/**
 * Build query string from params object
 */
function buildQueryString(params: Record<string, string | string[] | undefined>): string {
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map((v) => [key, v]);
      }
      return [[key, value as string]];
    });

  if (entries.length === 0) return '';
  
  return '?' + new URLSearchParams(entries as [string, string][]).toString();
}

/**
 * Make an authenticated request to SP-API
 */
export async function spApiRequest<T = unknown>(
  options: SPAPIRequestOptions
): Promise<SPAPIResponse<T>> {
  try {
    const { method = 'GET', path, query, body, headers = {} } = options;
    
    // Get auth credentials
    const accessToken = await getAccessToken();
    const credentials = await getSTSCredentials();
    
    // Build the full URL
    const endpoint = process.env.SP_API_ENDPOINT || 'https://sellingpartnerapi-na.amazon.com';
    const queryString = query ? buildQueryString(query) : '';
    const fullPath = path + queryString;
    
    // Determine API type for rate limiting
    const apiType = path.split('/')[1] || 'default';
    await checkRateLimit(apiType);
    
    // Prepare the request for signing
    const requestOptions: aws4.Request = {
      host: new URL(endpoint).host,
      method,
      path: fullPath,
      headers: {
        'Content-Type': 'application/json',
        'x-amz-access-token': accessToken,
        ...headers,
      },
      service: 'execute-api',
      region: 'us-east-1',
    };

    if (body) {
      requestOptions.body = JSON.stringify(body);
    }

    // Sign the request with AWS4
    const signedRequest = aws4.sign(requestOptions, {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    });

    // Make the request
    const response = await fetch(endpoint + fullPath, {
      method,
      headers: signedRequest.headers as Record<string, string>,
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseText = await response.text();
    let responseData: T | undefined;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      // Response might not be JSON
    }

    if (!response.ok) {
      return {
        success: false,
        error: responseText || `HTTP ${response.status}`,
        statusCode: response.status,
      };
    }

    return {
      success: true,
      data: responseData,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * SP-API Client class with methods for each API
 */
export class SPAPIClient {
  private sellerId: string;
  private marketplaceId: string;

  constructor() {
    this.sellerId = process.env.SELLER_ID || '';
    this.marketplaceId = process.env.MARKETPLACE_ID || 'ATVPDKIKX0DER';
  }

  // ==================== SELLERS API ====================
  async getMarketplaceParticipations() {
    return spApiRequest({
      path: '/sellers/v1/marketplaceParticipations',
    });
  }

  // ==================== ORDERS API ====================
  async getOrders(params: {
    createdAfter?: string;
    createdBefore?: string;
    orderStatuses?: string[];
    maxResultsPerPage?: number;
    nextToken?: string;
  } = {}) {
    const query: Record<string, string | string[] | undefined> = {
      MarketplaceIds: this.marketplaceId,
    };
    
    if (params.createdAfter) query.CreatedAfter = params.createdAfter;
    if (params.createdBefore) query.CreatedBefore = params.createdBefore;
    if (params.orderStatuses) query.OrderStatuses = params.orderStatuses.join(',');
    if (params.maxResultsPerPage) query.MaxResultsPerPage = params.maxResultsPerPage.toString();
    if (params.nextToken) query.NextToken = params.nextToken;

    return spApiRequest({
      path: '/orders/v0/orders',
      query,
    });
  }

  async getOrder(orderId: string) {
    return spApiRequest({
      path: `/orders/v0/orders/${orderId}`,
    });
  }

  async getOrderItems(orderId: string) {
    return spApiRequest({
      path: `/orders/v0/orders/${orderId}/orderItems`,
    });
  }

  // ==================== FBA INVENTORY API ====================
  async getInventorySummaries(params: {
    granularityType?: 'Marketplace';
    granularityId?: string;
    sellerSkus?: string[];
    nextToken?: string;
  } = {}) {
    return spApiRequest({
      path: '/fba/inventory/v1/summaries',
      query: {
        details: 'true',
        granularityType: params.granularityType || 'Marketplace',
        granularityId: params.granularityId || this.marketplaceId,
        marketplaceIds: this.marketplaceId,
        sellerSkus: params.sellerSkus?.join(','),
        nextToken: params.nextToken,
      },
    });
  }

  // ==================== CATALOG API ====================
  async searchCatalogItems(params: {
    keywords?: string[];
    identifiers?: string[];
    identifiersType?: 'ASIN' | 'EAN' | 'GTIN' | 'ISBN' | 'JAN' | 'MINSAN' | 'SKU' | 'UPC';
    includedData?: string[];
    pageSize?: number;
    pageToken?: string;
  }) {
    return spApiRequest({
      path: '/catalog/2022-04-01/items',
      query: {
        marketplaceIds: this.marketplaceId,
        keywords: params.keywords?.join(','),
        identifiers: params.identifiers?.join(','),
        identifiersType: params.identifiersType,
        includedData: params.includedData?.join(',') || 'summaries,images',
        pageSize: params.pageSize?.toString() || '10',
        pageToken: params.pageToken,
      },
    });
  }

  async getCatalogItem(asin: string, includedData?: string[]) {
    return spApiRequest({
      path: `/catalog/2022-04-01/items/${asin}`,
      query: {
        marketplaceIds: this.marketplaceId,
        includedData: includedData?.join(',') || 'summaries,images,attributes',
      },
    });
  }

  // ==================== LISTINGS API ====================
  async getListingsItem(sku: string, includedData?: string[]) {
    return spApiRequest({
      path: `/listings/2021-08-01/items/${this.sellerId}/${encodeURIComponent(sku)}`,
      query: {
        marketplaceIds: this.marketplaceId,
        includedData: includedData?.join(',') || 'summaries,attributes,issues',
      },
    });
  }

  async patchListingsItem(sku: string, patches: unknown[]) {
    return spApiRequest({
      method: 'PATCH',
      path: `/listings/2021-08-01/items/${this.sellerId}/${encodeURIComponent(sku)}`,
      query: { marketplaceIds: this.marketplaceId },
      body: { patches },
    });
  }

  // ==================== PRICING API ====================
  async getCompetitivePricing(asins: string[]) {
    return spApiRequest({
      path: '/products/pricing/v0/competitivePrice',
      query: {
        MarketplaceId: this.marketplaceId,
        ItemType: 'Asin',
        Asins: asins.join(','),
      },
    });
  }

  async getItemOffers(asin: string, itemCondition: string = 'New') {
    return spApiRequest({
      path: `/products/pricing/v0/items/${asin}/offers`,
      query: {
        MarketplaceId: this.marketplaceId,
        ItemCondition: itemCondition,
      },
    });
  }

  // ==================== PRODUCT FEES API ====================
  async getMyFeesEstimateForSKU(sku: string, price: number, currency: string = 'USD') {
    return spApiRequest({
      method: 'POST',
      path: `/products/fees/v0/listings/${encodeURIComponent(sku)}/feesEstimate`,
      body: {
        FeesEstimateRequest: {
          MarketplaceId: this.marketplaceId,
          IsAmazonFulfilled: true,
          PriceToEstimateFees: {
            ListingPrice: { CurrencyCode: currency, Amount: price },
          },
          Identifier: sku,
        },
      },
    });
  }

  // ==================== FULFILLMENT INBOUND API ====================
  async getInboundShipments(params: {
    shipmentStatusList?: string[];
    shipmentIdList?: string[];
    lastUpdatedAfter?: string;
    lastUpdatedBefore?: string;
    nextToken?: string;
  } = {}) {
    return spApiRequest({
      path: '/fba/inbound/v0/shipments',
      query: {
        MarketplaceId: this.marketplaceId,
        ShipmentStatusList: params.shipmentStatusList?.join(','),
        ShipmentIdList: params.shipmentIdList?.join(','),
        LastUpdatedAfter: params.lastUpdatedAfter,
        LastUpdatedBefore: params.lastUpdatedBefore,
        QueryType: params.shipmentIdList ? 'SHIPMENT' : 'DATE_RANGE',
        NextToken: params.nextToken,
      },
    });
  }

  async getShipmentItems(shipmentId: string) {
    return spApiRequest({
      path: `/fba/inbound/v0/shipments/${shipmentId}/items`,
      query: { MarketplaceId: this.marketplaceId },
    });
  }

  // ==================== FULFILLMENT OUTBOUND API (MCF) ====================
  async getFulfillmentPreview(address: unknown, items: unknown[]) {
    return spApiRequest({
      method: 'POST',
      path: '/fba/outbound/2020-07-01/fulfillmentOrders/preview',
      body: {
        marketplaceId: this.marketplaceId,
        address,
        items,
      },
    });
  }

  async createFulfillmentOrder(order: unknown) {
    return spApiRequest({
      method: 'POST',
      path: '/fba/outbound/2020-07-01/fulfillmentOrders',
      body: order,
    });
  }

  async getFulfillmentOrder(sellerFulfillmentOrderId: string) {
    return spApiRequest({
      path: `/fba/outbound/2020-07-01/fulfillmentOrders/${sellerFulfillmentOrderId}`,
    });
  }

  // ==================== SHIPPING API ====================
  async getRates(shipmentDetails: unknown) {
    return spApiRequest({
      method: 'POST',
      path: '/shipping/v2/shipments/rates',
      body: shipmentDetails,
    });
  }

  async purchaseShipment(shipment: unknown) {
    return spApiRequest({
      method: 'POST',
      path: '/shipping/v2/shipments',
      body: shipment,
    });
  }

  async getShipment(shipmentId: string) {
    return spApiRequest({
      path: `/shipping/v2/shipments/${shipmentId}`,
    });
  }

  // ==================== MERCHANT FULFILLMENT API ====================
  async getEligibleShipmentServices(shipmentRequestDetails: unknown) {
    return spApiRequest({
      method: 'POST',
      path: '/mfn/v0/eligibleShippingServices',
      body: { ShipmentRequestDetails: shipmentRequestDetails },
    });
  }

  async createShipment(shipmentRequestDetails: unknown, shippingServiceId: string) {
    return spApiRequest({
      method: 'POST',
      path: '/mfn/v0/shipments',
      body: {
        ShipmentRequestDetails: shipmentRequestDetails,
        ShippingServiceId: shippingServiceId,
      },
    });
  }

  // ==================== FINANCES API ====================
  async listFinancialEventGroups(params: {
    financialEventGroupStartedAfter?: string;
    financialEventGroupStartedBefore?: string;
    maxResultsPerPage?: number;
    nextToken?: string;
  } = {}) {
    return spApiRequest({
      path: '/finances/v0/financialEventGroups',
      query: {
        FinancialEventGroupStartedAfter: params.financialEventGroupStartedAfter,
        FinancialEventGroupStartedBefore: params.financialEventGroupStartedBefore,
        MaxResultsPerPage: params.maxResultsPerPage?.toString(),
        NextToken: params.nextToken,
      },
    });
  }

  async listFinancialEvents(params: {
    postedAfter?: string;
    postedBefore?: string;
    maxResultsPerPage?: number;
    nextToken?: string;
  } = {}) {
    return spApiRequest({
      path: '/finances/v0/financialEvents',
      query: {
        PostedAfter: params.postedAfter,
        PostedBefore: params.postedBefore,
        MaxResultsPerPage: params.maxResultsPerPage?.toString(),
        NextToken: params.nextToken,
      },
    });
  }

  // ==================== REPORTS API ====================
  async createReport(params: {
    reportType: string;
    dataStartTime?: string;
    dataEndTime?: string;
    reportOptions?: Record<string, string>;
    marketplaceIds?: string[];
  }) {
    return spApiRequest({
      method: 'POST',
      path: '/reports/2021-06-30/reports',
      body: {
        reportType: params.reportType,
        dataStartTime: params.dataStartTime,
        dataEndTime: params.dataEndTime,
        reportOptions: params.reportOptions,
        marketplaceIds: params.marketplaceIds || [this.marketplaceId],
      },
    });
  }

  async getReport(reportId: string) {
    return spApiRequest({
      path: `/reports/2021-06-30/reports/${reportId}`,
    });
  }

  async getReportDocument(reportDocumentId: string) {
    return spApiRequest({
      path: `/reports/2021-06-30/documents/${reportDocumentId}`,
    });
  }

  async getReports(params: {
    reportTypes?: string[];
    processingStatuses?: string[];
    createdSince?: string;
    createdUntil?: string;
    pageSize?: number;
    nextToken?: string;
  } = {}) {
    return spApiRequest({
      path: '/reports/2021-06-30/reports',
      query: {
        reportTypes: params.reportTypes?.join(','),
        processingStatuses: params.processingStatuses?.join(','),
        createdSince: params.createdSince,
        createdUntil: params.createdUntil,
        pageSize: params.pageSize?.toString(),
        nextToken: params.nextToken,
        marketplaceIds: this.marketplaceId,
      },
    });
  }

  // ==================== FEEDS API ====================
  async createFeed(params: {
    feedType: string;
    inputFeedDocumentId: string;
    marketplaceIds?: string[];
  }) {
    return spApiRequest({
      method: 'POST',
      path: '/feeds/2021-06-30/feeds',
      body: {
        feedType: params.feedType,
        inputFeedDocumentId: params.inputFeedDocumentId,
        marketplaceIds: params.marketplaceIds || [this.marketplaceId],
      },
    });
  }

  async getFeed(feedId: string) {
    return spApiRequest({
      path: `/feeds/2021-06-30/feeds/${feedId}`,
    });
  }

  async createFeedDocument(contentType: string) {
    return spApiRequest({
      method: 'POST',
      path: '/feeds/2021-06-30/documents',
      body: { contentType },
    });
  }

  // ==================== NOTIFICATIONS API ====================
  async getSubscription(notificationType: string) {
    return spApiRequest({
      path: `/notifications/v1/subscriptions/${notificationType}`,
    });
  }

  async createSubscription(notificationType: string, destinationId: string) {
    return spApiRequest({
      method: 'POST',
      path: `/notifications/v1/subscriptions/${notificationType}`,
      body: { destinationId },
    });
  }

  async getDestinations() {
    return spApiRequest({
      path: '/notifications/v1/destinations',
    });
  }

  // ==================== MESSAGING API ====================
  async getMessagingActionsForOrder(amazonOrderId: string) {
    return spApiRequest({
      path: `/messaging/v1/orders/${amazonOrderId}`,
      query: { marketplaceIds: this.marketplaceId },
    });
  }

  // ==================== SOLICITATIONS API ====================
  async getSolicitationActionsForOrder(amazonOrderId: string) {
    return spApiRequest({
      path: `/solicitations/v1/orders/${amazonOrderId}`,
      query: { marketplaceIds: this.marketplaceId },
    });
  }

  async createProductReviewAndSellerFeedbackSolicitation(amazonOrderId: string) {
    return spApiRequest({
      method: 'POST',
      path: `/solicitations/v1/orders/${amazonOrderId}/solicitations/productReviewAndSellerFeedback`,
      query: { marketplaceIds: this.marketplaceId },
    });
  }

  // ==================== AWD API ====================
  async getAWDInventory(params: {
    sku?: string;
    sortOrder?: string;
    nextToken?: string;
  } = {}) {
    return spApiRequest({
      path: '/awd/2024-05-09/inventory',
      query: {
        sku: params.sku,
        sortOrder: params.sortOrder,
        nextToken: params.nextToken,
      },
    });
  }

  async getAWDShipment(shipmentId: string) {
    return spApiRequest({
      path: `/awd/2024-05-09/inboundShipments/${shipmentId}`,
    });
  }

  async listAWDShipments(params: {
    sortOrder?: string;
    shipmentStatus?: string;
    createdAfter?: string;
    createdBefore?: string;
    nextToken?: string;
  } = {}) {
    return spApiRequest({
      path: '/awd/2024-05-09/inboundShipments',
      query: {
        sortOrder: params.sortOrder,
        shipmentStatus: params.shipmentStatus,
        createdAfter: params.createdAfter,
        createdBefore: params.createdBefore,
        nextToken: params.nextToken,
      },
    });
  }

  // ==================== LISTINGS RESTRICTIONS API ====================
  async getListingsRestrictions(params: {
    asin: string;
    conditionType?: string;
    reasonLocale?: string;
  }) {
    return spApiRequest({
      path: '/listings/2021-08-01/restrictions',
      query: {
        asin: params.asin,
        sellerId: this.sellerId,
        marketplaceIds: this.marketplaceId,
        conditionType: params.conditionType,
        reasonLocale: params.reasonLocale || 'en_US',
      },
    });
  }

  // ==================== SALES API ====================
  async getOrderMetrics(params: {
    interval: string;
    granularity: string;
    granularityTimeZone?: string;
    buyerType?: string;
    fulfillmentNetwork?: string;
    firstDayOfWeek?: string;
    asin?: string;
    sku?: string;
  }) {
    return spApiRequest({
      path: '/sales/v1/orderMetrics',
      query: {
        marketplaceIds: this.marketplaceId,
        interval: params.interval,
        granularity: params.granularity,
        granularityTimeZone: params.granularityTimeZone,
        buyerType: params.buyerType || 'All',
        fulfillmentNetwork: params.fulfillmentNetwork,
        firstDayOfWeek: params.firstDayOfWeek,
        asin: params.asin,
        sku: params.sku,
      },
    });
  }
}

// Export singleton instance
export const spApiClient = new SPAPIClient();
