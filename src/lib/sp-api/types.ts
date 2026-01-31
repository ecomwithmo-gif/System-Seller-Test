/**
 * SP-API TypeScript Types
 */

// ==================== COMMON ====================
export interface PaginatedResponse<T> {
  payload: T;
  errors?: APIError[];
  pagination?: {
    nextToken?: string;
  };
}

export interface APIError {
  code: string;
  message: string;
  details?: string;
}

// ==================== ORDERS ====================
export interface Order {
  AmazonOrderId: string;
  SellerOrderId?: string;
  PurchaseDate: string;
  LastUpdateDate: string;
  OrderStatus: OrderStatus;
  FulfillmentChannel: 'AFN' | 'MFN';
  SalesChannel?: string;
  ShipServiceLevel?: string;
  OrderTotal?: Money;
  NumberOfItemsShipped?: number;
  NumberOfItemsUnshipped?: number;
  PaymentMethod?: string;
  PaymentMethodDetails?: string[];
  MarketplaceId?: string;
  ShipmentServiceLevelCategory?: string;
  OrderType?: string;
  EarliestShipDate?: string;
  LatestShipDate?: string;
  EarliestDeliveryDate?: string;
  LatestDeliveryDate?: string;
  IsBusinessOrder?: boolean;
  IsPrime?: boolean;
  IsPremiumOrder?: boolean;
  IsGlobalExpressEnabled?: boolean;
  IsSoldByAB?: boolean;
  DefaultShipFromLocationAddress?: Address;
  BuyerInfo?: BuyerInfo;
  ShippingAddress?: Address;
}

export type OrderStatus = 
  | 'Pending'
  | 'Unshipped'
  | 'PartiallyShipped'
  | 'Shipped'
  | 'Canceled'
  | 'Unfulfillable'
  | 'InvoiceUnconfirmed'
  | 'PendingAvailability';

export interface OrderItem {
  ASIN: string;
  SellerSKU?: string;
  OrderItemId: string;
  Title?: string;
  QuantityOrdered: number;
  QuantityShipped?: number;
  ProductInfo?: ProductInfo;
  ItemPrice?: Money;
  ItemTax?: Money;
  PromotionDiscount?: Money;
  IsGift?: boolean;
}

export interface Money {
  CurrencyCode: string;
  Amount: string;
}

export interface Address {
  Name?: string;
  AddressLine1?: string;
  AddressLine2?: string;
  AddressLine3?: string;
  City?: string;
  County?: string;
  District?: string;
  StateOrRegion?: string;
  Municipality?: string;
  PostalCode?: string;
  CountryCode?: string;
  Phone?: string;
}

export interface BuyerInfo {
  BuyerEmail?: string;
  BuyerName?: string;
  BuyerCounty?: string;
  BuyerTaxInfo?: TaxInfo;
}

export interface TaxInfo {
  CompanyLegalName?: string;
  TaxingRegion?: string;
  TaxClassifications?: TaxClassification[];
}

export interface TaxClassification {
  Name: string;
  Value: string;
}

export interface ProductInfo {
  NumberOfItems?: number;
}

// ==================== INVENTORY ====================
export interface InventorySummary {
  asin: string;
  fnSku: string;
  sellerSku: string;
  condition: string;
  inventoryDetails?: InventoryDetails;
  lastUpdatedTime?: string;
  productName?: string;
  totalQuantity: number;
}

export interface InventoryDetails {
  fulfillableQuantity?: number;
  inboundWorkingQuantity?: number;
  inboundShippedQuantity?: number;
  inboundReceivingQuantity?: number;
  reservedQuantity?: ReservedQuantity;
  researchingQuantity?: ResearchingQuantity;
  unfulfillableQuantity?: UnfulfillableQuantity;
}

export interface ReservedQuantity {
  totalReservedQuantity?: number;
  pendingCustomerOrderQuantity?: number;
  pendingTransshipmentQuantity?: number;
  fcProcessingQuantity?: number;
}

export interface ResearchingQuantity {
  totalResearchingQuantity?: number;
}

export interface UnfulfillableQuantity {
  totalUnfulfillableQuantity?: number;
  customerDamagedQuantity?: number;
  warehouseDamagedQuantity?: number;
  distributorDamagedQuantity?: number;
  carrierDamagedQuantity?: number;
  defectiveQuantity?: number;
  expiredQuantity?: number;
}

// ==================== CATALOG ====================
export interface CatalogItem {
  asin: string;
  attributes?: Record<string, unknown>;
  identifiers?: ItemIdentifiers[];
  images?: ItemImages[];
  productTypes?: ItemProductType[];
  salesRanks?: ItemSalesRanks[];
  summaries?: ItemSummary[];
  relationships?: ItemRelationships[];
}

export interface ItemIdentifiers {
  marketplaceId: string;
  identifiers: Identifier[];
}

export interface Identifier {
  identifierType: string;
  identifier: string;
}

export interface ItemImages {
  marketplaceId: string;
  images: ItemImage[];
}

export interface ItemImage {
  variant: string;
  link: string;
  height: number;
  width: number;
}

export interface ItemProductType {
  marketplaceId: string;
  productType: string;
}

export interface ItemSalesRanks {
  marketplaceId: string;
  classificationRanks?: SalesRank[];
  displayGroupRanks?: SalesRank[];
}

export interface SalesRank {
  classificationId?: string;
  displayGroupId?: string;
  title: string;
  link?: string;
  rank: number;
}

export interface ItemSummary {
  marketplaceId: string;
  brandName?: string;
  browseNode?: string;
  colorName?: string;
  itemName?: string;
  manufacturer?: string;
  modelNumber?: string;
  sizeName?: string;
  styleName?: string;
}

export interface ItemRelationships {
  marketplaceId: string;
  relationships: Relationship[];
}

export interface Relationship {
  childAsins?: string[];
  parentAsins?: string[];
  variationTheme?: VariationTheme;
  type: string;
}

export interface VariationTheme {
  attributes?: string[];
  theme?: string;
}

// ==================== PRICING ====================
export interface CompetitivePricing {
  ASIN: string;
  Product: {
    Identifiers: {
      MarketplaceASIN: {
        MarketplaceId: string;
        ASIN: string;
      };
    };
    CompetitivePricing: {
      CompetitivePrices: CompetitivePrice[];
      NumberOfOfferListings?: OfferListingCount[];
    };
  };
}

export interface CompetitivePrice {
  CompetitivePriceId: string;
  Price: {
    LandedPrice?: Money;
    ListingPrice: Money;
    Shipping?: Money;
  };
  condition?: string;
  subcondition?: string;
  belongsToRequester?: boolean;
}

export interface OfferListingCount {
  Count: number;
  condition: string;
}

// ==================== FULFILLMENT ====================
export interface InboundShipment {
  ShipmentId: string;
  ShipmentName: string;
  ShipFromAddress: Address;
  DestinationFulfillmentCenterId: string;
  ShipmentStatus: ShipmentStatus;
  LabelPrepType?: string;
  AreCasesRequired?: boolean;
  ConfirmedNeedByDate?: string;
  BoxContentsSource?: string;
  EstimatedBoxContentsFee?: Money;
}

export type ShipmentStatus =
  | 'WORKING'
  | 'SHIPPED'
  | 'RECEIVING'
  | 'CANCELLED'
  | 'DELETED'
  | 'CLOSED'
  | 'ERROR'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CHECKED_IN';

export interface ShipmentItem {
  ShipmentId: string;
  SellerSKU: string;
  FulfillmentNetworkSKU?: string;
  QuantityShipped: number;
  QuantityReceived?: number;
  QuantityInCase?: number;
  ReleaseDate?: string;
  PrepDetailsList?: PrepDetails[];
}

export interface PrepDetails {
  PrepInstruction: string;
  PrepOwner: 'AMAZON' | 'SELLER';
}

// ==================== REPORTS ====================
export interface Report {
  reportId: string;
  reportType: string;
  dataStartTime?: string;
  dataEndTime?: string;
  reportScheduleId?: string;
  createdTime: string;
  processingStatus: ReportProcessingStatus;
  processingStartTime?: string;
  processingEndTime?: string;
  reportDocumentId?: string;
  marketplaceIds?: string[];
}

export type ReportProcessingStatus =
  | 'CANCELLED'
  | 'DONE'
  | 'FATAL'
  | 'IN_PROGRESS'
  | 'IN_QUEUE';

export interface ReportDocument {
  reportDocumentId: string;
  url: string;
  compressionAlgorithm?: 'GZIP';
}

// ==================== FINANCES ====================
export interface FinancialEventGroup {
  FinancialEventGroupId: string;
  ProcessingStatus: string;
  FundTransferStatus?: string;
  OriginalTotal?: Money;
  ConvertedTotal?: Money;
  FundTransferDate?: string;
  TraceId?: string;
  AccountTail?: string;
  BeginningBalance?: Money;
  FinancialEventGroupStart?: string;
  FinancialEventGroupEnd?: string;
}

export interface FinancialEvents {
  ShipmentEventList?: ShipmentEvent[];
  RefundEventList?: ShipmentEvent[];
  ServiceFeeEventList?: ServiceFeeEvent[];
  PayWithAmazonEventList?: unknown[];
}

export interface ShipmentEvent {
  AmazonOrderId: string;
  SellerOrderId?: string;
  MarketplaceName?: string;
  PostedDate?: string;
  ShipmentItemList?: ShipmentItemFinance[];
}

export interface ShipmentItemFinance {
  SellerSKU: string;
  OrderItemId: string;
  QuantityShipped?: number;
  ItemChargeList?: ChargeComponent[];
  ItemFeeList?: FeeComponent[];
}

export interface ChargeComponent {
  ChargeType: string;
  ChargeAmount: Money;
}

export interface FeeComponent {
  FeeType: string;
  FeeAmount: Money;
}

export interface ServiceFeeEvent {
  AmazonOrderId?: string;
  FeeReason?: string;
  FeeList?: FeeComponent[];
  SellerSKU?: string;
  FnSKU?: string;
  FeeDescription?: string;
  ASIN?: string;
}

// ==================== SELLER ====================
export interface MarketplaceParticipation {
  marketplace: Marketplace;
  participation: Participation;
}

export interface Marketplace {
  id: string;
  name: string;
  countryCode: string;
  defaultCurrencyCode: string;
  defaultLanguageCode: string;
  domainName: string;
}

export interface Participation {
  isParticipating: boolean;
  hasSuspendedListings: boolean;
}

// ==================== AWD ====================
export interface AWDInventory {
  sku: string;
  availableQuantity: number;
  reservedQuantity: number;
  totalQuantity: number;
}

export interface AWDShipment {
  shipmentId: string;
  shipToAddress: Address;
  shipmentStatus: string;
  createdTime: string;
  updatedTime?: string;
}

// ==================== DASHBOARD ====================
export interface DashboardStats {
  totalInventory: number;
  lowStockItems: number;
  pendingOrders: number;
  shippedOrders: number;
  totalRevenue: number;
  inboundShipments: number;
}

export interface InventoryAlert {
  sku: string;
  asin: string;
  productName: string;
  currentQuantity: number;
  reorderLevel: number;
  alertType: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'OVERSTOCK';
}
