const { logger } = require("../logger");

class WhatsAppProvider {
  /**
   * Send WhatsApp message to recipient
   * @param {string} to Phone number with country code
   * @param {string} message Message body
   * @param {object} templateData Any template data
   * @returns {Promise<{success: boolean, messageId: string}>}
   */
  async sendMessage(to, message, templateData = {}) {
    throw new Error("Method not implemented.");
  }
}

class MockProvider extends WhatsAppProvider {
  async sendMessage(to, message, templateData = {}) {
    logger.info({ to, messageLength: message.length }, "[MOCK WHATSAPP] Message sent");
    return { success: true, messageId: `mock-${Date.now()}` };
  }
}

class MetaCloudProvider extends WhatsAppProvider {
  async sendMessage(to, message, templateData = {}) {
    // Stub implementation for Meta Cloud API
    logger.info({ to }, "Calling Meta Cloud API...");
    return { success: true, messageId: `meta-${Date.now()}` };
  }
}

class TwilioProvider extends WhatsAppProvider {
  async sendMessage(to, message, templateData = {}) {
    // Stub implementation for Twilio API
    logger.info({ to }, "Calling Twilio API...");
    return { success: true, messageId: `twilio-${Date.now()}` };
  }
}

module.exports = {
  WhatsAppProvider,
  MockProvider,
  MetaCloudProvider,
  TwilioProvider
};
