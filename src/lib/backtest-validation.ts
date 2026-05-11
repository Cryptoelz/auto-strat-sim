import { z } from 'zod';

/**
 * Valid trading assets
 */
export const AssetSchema = z.enum(['BTCUSDT', 'XRPUSDT', 'FETUSDT', 'XLMUSDT', 'ETHUSDT', 'SOLUSDT']);

/**
 * Valid candle timeframes
 */
export const TimeframeSchema = z.enum(['5m', '15m', '1h', '4h']);

/**
 * Validation schema for backtest configuration
 * Ensures all parameters are within valid ranges before running a backtest
 */
export const BacktestConfigSchema = z.object({
  /** At least one asset must be selected */
  assets: z.array(AssetSchema).min(1, 'At least one trading pair must be selected'),
  
  /** Start date must be in the past */
  startDate: z.date().refine(
    (date) => date < new Date(),
    'Start date must be in the past'
  ),
  
  /** End date must be after start date */
  endDate: z.date(),
  
  /** Valid timeframe */
  timeframe: TimeframeSchema,
  
  /** Fast SMA period (5-100) */
  fastSMA: z.number()
    .int('Fast SMA must be a whole number')
    .min(5, 'Fast SMA must be at least 5')
    .max(100, 'Fast SMA must not exceed 100'),
  
  /** Slow SMA period (10-200, must be greater than fast SMA) */
  slowSMA: z.number()
    .int('Slow SMA must be a whole number')
    .min(10, 'Slow SMA must be at least 10')
    .max(200, 'Slow SMA must not exceed 200'),
  
  /** Initial balance in USD (minimum $100) */
  initialBalance: z.number()
    .min(100, 'Initial balance must be at least $100')
    .max(100000000, 'Initial balance must not exceed $100,000,000'),
  
  /** Position size as percentage of balance (1-100%) */
  positionSizePercent: z.number()
    .min(1, 'Position size must be at least 1%')
    .max(100, 'Position size must not exceed 100%'),
  
  /** Stop loss as percentage (0.1-50%) */
  stopLossPercent: z.number()
    .min(0.1, 'Stop loss must be at least 0.1%')
    .max(50, 'Stop loss must not exceed 50%'),
  
  /** Take profit as percentage (0.1-100%) */
  takeProfitPercent: z.number()
    .min(0.1, 'Take profit must be at least 0.1%')
    .max(100, 'Take profit must not exceed 100%'),
  
  /** Trading fee as percentage (0-5%) */
  feePercent: z.number()
    .min(0, 'Fee cannot be negative')
    .max(5, 'Fee must not exceed 5%'),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
).refine(
  (data) => data.slowSMA > data.fastSMA,
  {
    message: 'Slow SMA must be greater than Fast SMA',
    path: ['slowSMA'],
  }
);

/**
 * Type inferred from the schema
 */
export type ValidatedBacktestConfig = z.infer<typeof BacktestConfigSchema>;

/**
 * Validation result type
 */
export interface ValidationResult {
  success: boolean;
  errors: string[];
  data?: ValidatedBacktestConfig;
}

/**
 * Validate a backtest configuration
 * @param config - The configuration to validate
 * @returns Validation result with errors if any
 */
export function validateBacktestConfig(config: unknown): ValidationResult {
  const result = BacktestConfigSchema.safeParse(config);
  
  if (result.success) {
    return {
      success: true,
      errors: [],
      data: result.data,
    };
  }
  
  const errors = result.error.errors.map((err) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
  
  return {
    success: false,
    errors,
  };
}

/**
 * Quick validation check (returns boolean)
 */
export function isValidBacktestConfig(config: unknown): config is ValidatedBacktestConfig {
  return BacktestConfigSchema.safeParse(config).success;
}
