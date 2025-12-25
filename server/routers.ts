import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { freqtradeRouter } from "./routers/freqtrade";
import { systemHealthRouter } from "./routers/systemHealth";
import { strategiesRouter } from "./routers/strategies";
import { performanceRouter } from "./routers/performance";
import { testTradingRouter } from "./routers/testTrading";
import { marketDataRouter } from "./routers/marketData";
import { autoTraderRouter } from "./routers/autoTrader";
import { autoTradingExecutorRouter } from "./routers/autoTradingExecutor";
import { rsiMacdBollingerBandsRouter } from "./routers/rsiMacdBollingerBands";
import { aggressiveScalperRouter } from "./routers/aggressiveScalper";
import { selfLearningRouter } from "./routers/selfLearning";
import { advancedTradingRouter } from "./routers/advancedTrading";
import { continuousLearningRouter } from "./routers/continuousLearning";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  freqtrade: freqtradeRouter,
  health: systemHealthRouter,
  strategies: strategiesRouter,
  performance: performanceRouter,
  testTrading: testTradingRouter,
  marketData: marketDataRouter,
  autoTrader: autoTraderRouter,
  autoTradingExecutor: autoTradingExecutorRouter,
  rsiMacdBollingerBands: rsiMacdBollingerBandsRouter,
  scalper: aggressiveScalperRouter,
  learning: selfLearningRouter,
  advanced: advancedTradingRouter,
  ai: continuousLearningRouter,
});

export type AppRouter = typeof appRouter;
