/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  // ==================== RUNNER ====================
  testRunner: "vitest",
  vitest: {
    configFile: "vitest.config.ts",
  },

  // ==================== MUTATION TARGETS ====================
  // Only mutate critical domain modules — pure business logic.
  // Hooks, components, and infrastructure are excluded (too expensive, too flaky).
  mutate: [
    // Tier 1: Pure state machine — highest priority
    "src/services/roomStateMachine.ts",

    // Tier 2: Scoring & distance — deterministic math
    "src/utils/index.ts",

    // Tier 3: Room logic — pure multiplayer functions
    "src/utils/roomLogic.ts",

    // Tier 4: Location engine — selection algorithm
    "src/services/locationEngine.ts",

    // Tier 5: City data integrity
    "src/data/turkeyCities.ts",

    // Exclude logging, telemetry, and non-critical helpers from mutation
    "!src/utils/logger.ts",
    "!src/utils/telemetry.ts",
    "!src/utils/rateLimiter.ts",
  ],

  // ==================== PERFORMANCE ====================
  // Mutation testing is CPU-heavy. These settings prevent runaway execution.
  timeoutMS: 60000,          // 60s per mutant (some tests do 1000-draw simulations)
  timeoutFactor: 2.5,        // Allow 2.5x the initial test run time
  concurrency: 2,            // Limit parallel workers (avoid OOM on dev machine)
  maxTestRunnerReuse: 20,    // Recycle workers to prevent memory leaks

  // ==================== THRESHOLDS ====================
  // Mutation score thresholds (percentage of killed mutants)
  //   high  >= 80% : green  (good)
  //   low   >= 60% : yellow (needs attention)
  //   break >= 50% : red    (CI fails below this)
  thresholds: {
    high: 80,
    low: 60,
    break: 50,
  },

  // ==================== REPORTING ====================
  reporters: [
    "html",          // Interactive HTML report in reports/mutation/
    "clear-text",    // Console summary
    "progress",      // Progress bar during run
  ],
  htmlReporter: {
    fileName: "reports/mutation/index.html",
  },

  // ==================== MUTATOR CONFIG ====================
  // Fine-tune which mutation operators to apply.
  // We exclude mutations on string literals and logging calls
  // because they generate noise without testing real logic.
  mutator: {
    excludedMutations: [
      "StringLiteral",          // Logger messages, error reasons — not critical
    ],
  },

  // ==================== MISC ====================
  tempDirName: ".stryker-tmp",
  cleanTempDir: "always",
};

export default config;
