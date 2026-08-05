const { logger } = require("../utils/logger");

class WorkspaceCacheService {
  constructor() {
    this.cache = new Map();
    this.ttls = new Map();
  }

  async get(key) {
    if (!this.cache.has(key)) return null;

    const expiry = this.ttls.get(key);
    if (expiry && Date.now() > expiry) {
      this.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  async set(key, value, ttlSeconds = 300) {
    this.cache.set(key, value);
    this.ttls.set(key, Date.now() + ttlSeconds * 1000);
  }

  delete(key) {
    this.cache.delete(key);
    this.ttls.delete(key);
  }

  invalidateWorkspace(workspaceId) {
    if (!workspaceId) return;
    logger.info(`[Cache] Invalidating workspace cache for: ${workspaceId}`);
    for (const key of this.cache.keys()) {
      if (key.includes(String(workspaceId))) {
        this.delete(key);
      }
    }
  }
}

module.exports = new WorkspaceCacheService();
