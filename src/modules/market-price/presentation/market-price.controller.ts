import { Controller, Get, Param, Query } from '@nestjs/common';
import { MarketPriceUseCase } from '../application/market-price.usecase';
import {
  MarketPriceResponseDto,
  MarketPriceReportDto,
  TrendAnalysisDto,
  FilterMarketPriceDto,
} from '../application/market-price.dto';

/**
 * Market Price Controller
 *
 * Handles HTTP requests for market price data and analysis.
 * No authentication required - market data is public
 *
 * Routing:
 * GET /api/v1/market-prices              - Get all tracked prices
 * GET /api/v1/market-prices/:symbol      - Get latest price for symbol
 * GET /api/v1/market-prices/type/:type   - Get prices by market type
 * GET /api/v1/market-prices/:symbol/history    - Get historical data
 * GET /api/v1/market-prices/:symbol/reports/daily    - Daily report
 * GET /api/v1/market-prices/:symbol/reports/weekly   - Weekly report
 * GET /api/v1/market-prices/:symbol/reports/monthly  - Monthly report
 * GET /api/v1/market-prices/:symbol/trends    - Trend analysis
 */
@Controller('market-prices')
export class MarketPriceController {
  constructor(private readonly marketPriceUseCase: MarketPriceUseCase) {}

  /**
   * Get all tracked market prices
   *
   * GET /api/v1/market-prices
   */
  @Get()
  async getAllPrices(
    @Query() filterDto?: FilterMarketPriceDto,
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      items: MarketPriceResponseDto[];
      total: number;
    };
  }> {
    let prices = await this.marketPriceUseCase.getAllPrices();

    // Apply filters if provided
    if (filterDto?.marketType) {
      prices = prices.filter((p) => p.marketType === filterDto.marketType);
    }

    if (filterDto?.symbol) {
      prices = prices.filter((p) => p.symbol.toLowerCase().includes(filterDto.symbol!.toLowerCase()));
    }

    return {
      success: true,
      message: 'Market prices retrieved successfully',
      data: {
        items: prices.map((p) => new MarketPriceResponseDto(p)),
        total: prices.length,
      },
    };
  }

  /**
   * Get latest price for a symbol
   *
   * GET /api/v1/market-prices/:symbol
   */
  @Get(':symbol')
  async getLatestPrice(
    @Param('symbol') symbol: string,
  ): Promise<{ success: boolean; message: string; data: MarketPriceResponseDto }> {
    const price = await this.marketPriceUseCase.getLatestPrice(symbol.toUpperCase());

    return {
      success: true,
      message: 'Price retrieved successfully',
      data: new MarketPriceResponseDto(price),
    };
  }

  /**
   * Get prices by market type
   *
   * GET /api/v1/market-prices/type/:type
   */
  @Get('type/:type')
  async getPricesByType(
    @Param('type') type: string,
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      items: MarketPriceResponseDto[];
      total: number;
    };
  }> {
    const prices = await this.marketPriceUseCase.getPricesByMarketType(type as any);

    return {
      success: true,
      message: 'Prices retrieved successfully',
      data: {
        items: prices.map((p) => new MarketPriceResponseDto(p)),
        total: prices.length,
      },
    };
  }

  /**
   * Get historical price data
   *
   * GET /api/v1/market-prices/:symbol/history?days=30
   */
  @Get(':symbol/history')
  async getPriceHistory(
    @Param('symbol') symbol: string,
    @Query('days') days?: string,
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      items: MarketPriceResponseDto[];
      total: number;
      symbol: string;
    };
  }> {
    const daysNum = days ? parseInt(days, 10) : 30;
    const prices = await this.marketPriceUseCase.getPriceHistory(symbol.toUpperCase(), daysNum);

    return {
      success: true,
      message: 'Price history retrieved successfully',
      data: {
        items: prices.map((p) => new MarketPriceResponseDto(p)),
        total: prices.length,
        symbol: symbol.toUpperCase(),
      },
    };
  }

  /**
   * Generate daily price report
   *
   * GET /api/v1/market-prices/:symbol/reports/daily?date=2026-04-01
   */
  @Get(':symbol/reports/daily')
  async getDailyReport(
    @Param('symbol') symbol: string,
    @Query('date') dateStr?: string,
  ): Promise<{ success: boolean; message: string; data: MarketPriceReportDto }> {
    const date = dateStr ? new Date(dateStr) : new Date();
    const report = await this.marketPriceUseCase.generateDailyReport(symbol.toUpperCase(), date);

    return {
      success: true,
      message: 'Daily report generated successfully',
      data: report as MarketPriceReportDto,
    };
  }

  /**
   * Generate weekly price report
   *
   * GET /api/v1/market-prices/:symbol/reports/weekly?weekStart=2026-03-30
   */
  @Get(':symbol/reports/weekly')
  async getWeeklyReport(
    @Param('symbol') symbol: string,
    @Query('weekStart') weekStartStr?: string,
  ): Promise<{ success: boolean; message: string; data: MarketPriceReportDto }> {
    const weekStart = weekStartStr ? new Date(weekStartStr) : this.getMonday(new Date());
    const report = await this.marketPriceUseCase.generateWeeklyReport(symbol.toUpperCase(), weekStart);

    return {
      success: true,
      message: 'Weekly report generated successfully',
      data: report as MarketPriceReportDto,
    };
  }

  /**
   * Generate monthly price report
   *
   * GET /api/v1/market-prices/:symbol/reports/monthly?year=2026&month=4
   */
  @Get(':symbol/reports/monthly')
  async getMonthlyReport(
    @Param('symbol') symbol: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ): Promise<{ success: boolean; message: string; data: MarketPriceReportDto }> {
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    const m = month ? parseInt(month, 10) : new Date().getMonth() + 1;

    const report = await this.marketPriceUseCase.generateMonthlyReport(symbol.toUpperCase(), y, m);

    return {
      success: true,
      message: 'Monthly report generated successfully',
      data: report as MarketPriceReportDto,
    };
  }

  /**
   * Get trend analysis for a symbol
   *
   * GET /api/v1/market-prices/:symbol/trends?days=30
   */
  @Get(':symbol/trends')
  async getTrendAnalysis(
    @Param('symbol') symbol: string,
    @Query('days') days?: string,
  ): Promise<{ success: boolean; message: string; data: TrendAnalysisDto }> {
    const daysNum = days ? parseInt(days, 10) : 30;
    const analysis = await this.marketPriceUseCase.getTrendAnalysis(symbol.toUpperCase(), daysNum);

    return {
      success: true,
      message: 'Trend analysis retrieved successfully',
      data: analysis,
    };
  }

  /**
   * Helper: Get Monday of the current week
   */
  private getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }
}
