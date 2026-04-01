import { IsString, IsEnum, IsNumber, IsOptional, IsNotEmpty, MaxLength, Min } from 'class-validator';
import { MarketPrice, MarketType } from '../domain/market-price.entity';

/**
 * DTO for creating/updating market price
 */
export class CreateMarketPriceDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  symbol!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsNotEmpty()
  @IsEnum(MarketType)
  marketType!: MarketType;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  priceUSD!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  openPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  highPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lowPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  closePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  volume?: number;

  @IsOptional()
  @IsNumber()
  changePercent?: number;

  @IsNotEmpty()
  @IsString()
  source!: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string = 'USD';
}

/**
 * DTO for updating market price
 */
export class UpdateMarketPriceDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceUSD?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  openPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  highPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lowPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  closePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  volume?: number;

  @IsOptional()
  @IsNumber()
  changePercent?: number;

  @IsOptional()
  @IsNumber()
  marketCap?: number;
}

/**
 * Response DTO for market price
 */
export class MarketPriceResponseDto {
  id!: string;
  symbol!: string;
  name!: string;
  marketType!: string;
  priceUSD!: number;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  closePrice?: number;
  volume?: number;
  marketCap?: number;
  changePercent?: number;
  changeAmount?: number;
  currency!: string;
  source!: string;
  lastFetchedAt!: Date;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(marketPrice: MarketPrice) {
    this.id = marketPrice.id;
    this.symbol = marketPrice.symbol;
    this.name = marketPrice.name;
    this.marketType = marketPrice.marketType;
    this.priceUSD = marketPrice.priceUSD;
    this.openPrice = marketPrice.openPrice;
    this.highPrice = marketPrice.highPrice;
    this.lowPrice = marketPrice.lowPrice;
    this.closePrice = marketPrice.closePrice;
    this.volume = marketPrice.volume;
    this.marketCap = marketPrice.marketCap;
    this.changePercent = marketPrice.changePercent;
    this.changeAmount = marketPrice.changeAmount || marketPrice.calculateChangeAmount() || undefined;
    this.currency = marketPrice.currency;
    this.source = marketPrice.source;
    this.lastFetchedAt = marketPrice.lastFechedAt;
    this.createdAt = marketPrice.createdAt;
    this.updatedAt = marketPrice.updatedAt;
  }
}

/**
 * Response DTO for market price report
 */
export class MarketPriceReportDto {
  period!: 'daily' | 'weekly' | 'monthly';
  symbol!: string;
  name!: string;
  startDate!: Date;
  endDate!: Date;
  latestPrice!: number;
  openPrice?: number;
  closePrice?: number;
  highPrice!: number;
  lowPrice!: number;
  averagePrice!: number;
  changePercent!: number;
  changeAmount?: number;
  priceDataPoints!: number;
}

/**
 * Response DTO for trend analysis
 */
export class TrendAnalysisDto {
  symbol!: string;
  currentPrice!: number;
  lowestPrice!: number;
  highestPrice!: number;
  averagePrice!: number;
  trend!: 'uptrend' | 'downtrend' | 'sideways';
  volatility!: number;
}

/**
 * Query DTO for filtering prices
 */
export class FilterMarketPriceDto {
  @IsOptional()
  @IsEnum(MarketType)
  marketType?: MarketType;

  @IsOptional()
  @IsString()
  symbol?: string;
}
