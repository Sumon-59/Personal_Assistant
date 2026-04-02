import { Module } from '@nestjs/common';
import { MarketPriceController } from './presentation/market-price.controller';
import { MarketPriceUseCase } from './application/market-price.usecase';
import { PostgresMarketPriceRepository } from './infrastructure/repositories/postgres-market-price.repository';
import { MarketPriceFetcherService } from './infrastructure/services/market-price-fetcher.service';
import { MarketPriceScheduler } from './infrastructure/scheduler/market-price.scheduler';
import { MarketPriceScraperScheduler } from './infrastructure/scheduler/market-price-scraper.scheduler';

/**
 * Market Price Module
 *
 * Manages daily market price tracking and reporting for multiple asset types.
 *
 * Features:
 * - Track multiple markets: crypto, stocks, commodities, currencies, indices, forex
 * - Daily price fetching from external APIs
 * - Historical price data storage
 * - Daily, weekly, monthly reports
 * - Trend analysis and volatility calculation
 * - Automatic daily price updates via scheduler
 *
 * Architecture:
 * - Domain: MarketPrice entity with market types and validation
 * - Application: Use-cases for price management and reporting
 * - Infrastructure: PostgreSQL persistence, API fetcher, scheduler service
 * - Presentation: REST endpoints for public price data and reports
 *
 * Scheduler:
 * - Runs every 24 hours
 * - Updates all stale prices (older than 24 hours)
 * - Automatic startup and graceful shutdown
 *
 * Data Sources:
 * - Mock data for MVP/development
 * - Extensible to include: CoinGecko, Alpha Vantage, Yahoo Finance, Finnhub, etc.
 *
 * Security:
 * - Market price data is public (no authentication required)
 * - Read-only endpoints for external consumers
 */
@Module({
  controllers: [MarketPriceController],
  providers: [
    MarketPriceUseCase,
    MarketPriceFetcherService,
    MarketPriceScheduler,
    MarketPriceScraperScheduler,
    {
      provide: 'MarketPriceRepositoryInterface',
      useClass: PostgresMarketPriceRepository,
    },
  ],
  exports: [MarketPriceUseCase, MarketPriceFetcherService],
})
export class MarketPriceModule {}
