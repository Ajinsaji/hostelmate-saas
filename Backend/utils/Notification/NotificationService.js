const { MockProvider, MetaCloudProvider, TwilioProvider } = require("./WhatsAppProviders");
const Communication = require("../../models/Communication");
const { logger } = require("../logger");

class NotificationService {
  constructor(providerName = "mock") {
    switch(providerName.toLowerCase()) {
      case "meta":
        this.provider = new MetaCloudProvider();
        break;
      case "twilio":
        this.provider = new TwilioProvider();
        break;
      case "mock":
      default:
        this.provider = new MockProvider();
        break;
    }
  }

  async sendWhatsApp(to, message, metadata = {}) {
    try {
      const result = await this.provider.sendMessage(to, message);
      
      // Save to communication history
      if (metadata.hostelId || metadata.ownerId) {
        await Communication.create({
          hostelId: metadata.hostelId,
          ownerId: metadata.ownerId,
          type: "whatsapp",
          recipient: to,
          message: message,
          status: result.success ? "delivered" : "failed",
          metadata: { messageId: result.messageId, provider: this.provider.constructor.name },
          sentAt: new Date()
        });
      }

      return result;
    } catch (error) {
      logger.error({ to, error: error.message }, "WhatsApp delivery failed");
      
      if (metadata.hostelId || metadata.ownerId) {
        await Communication.create({
          hostelId: metadata.hostelId,
          ownerId: metadata.ownerId,
          type: "whatsapp",
          recipient: to,
          message: message,
          status: "failed",
          error: error.message,
          metadata: { provider: this.provider.constructor.name },
          sentAt: new Date()
        });
      }
      
      return { success: false, error: error.message };
    }
  }
}

// Export a singleton instance using the environment configured provider
const providerName = process.env.WHATSAPP_PROVIDER || "mock";
module.exports = new NotificationService(providerName);
