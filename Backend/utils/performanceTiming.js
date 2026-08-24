const toMilliseconds = (nanoseconds) => Number(nanoseconds) / 1e6;

function createPerformanceTimer(operation, logger, req) {
  const requestTiming = req?.performanceTiming;
  const startedAt = requestTiming?.startedAt || process.hrtime.bigint();
  const timings = requestTiming?.timings || {};

  const measure = async (name, work) => {
    const started = process.hrtime.bigint();
    try {
      return await work();
    } finally {
      timings[name] = toMilliseconds(process.hrtime.bigint() - started);
    }
  };

  const mark = (name, started) => {
    timings[name] = toMilliseconds(process.hrtime.bigint() - started);
  };

  const finish = (message = `${operation} performance`) => {
    timings.totalMs = toMilliseconds(process.hrtime.bigint() - startedAt);
    logger.info({ operation, timings }, message);
    return timings;
  };

  if (req) req.performanceTiming = { startedAt, timings };
  return { measure, mark, finish, timings };
}

function getRequestTiming(req) {
  if (!req.performanceTiming) {
    req.performanceTiming = {
      startedAt: process.hrtime.bigint(),
      timings: {},
    };
  }
  return req.performanceTiming;
}

function recordRequestTiming(req, name, startedAt) {
  const timing = getRequestTiming(req);
  timing.timings[name] = toMilliseconds(process.hrtime.bigint() - startedAt);
}

function finishRequestTiming(req, operation, logger) {
  const timing = getRequestTiming(req);
  timing.timings.totalMs = toMilliseconds(process.hrtime.bigint() - timing.startedAt);
  logger.info({ operation, timings: timing.timings }, `${operation} performance`);
  return timing.timings;
}

module.exports = {
  createPerformanceTimer,
  getRequestTiming,
  recordRequestTiming,
  finishRequestTiming,
};
