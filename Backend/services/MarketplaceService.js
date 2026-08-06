class MarketplaceService {
  async getPlugins(workspaceId) {
    return {
      success: true,
      plugins: [
        { id: "cloudinary", name: "Cloudinary", category: "Storage", description: "Cloud image & asset management", installed: true, status: "Connected" },
        { id: "aws_s3", name: "AWS S3", category: "Storage", description: "Secure object storage buckets", installed: false, status: "Available" },
        { id: "google_drive", name: "Google Drive", category: "Storage", description: "Sync document backups to Drive", installed: true, status: "Connected" },
        { id: "whatsapp", name: "WhatsApp Business API", category: "Communication", description: "Send automated payment receipts on WhatsApp", installed: true, status: "Connected" },
        { id: "twilio_sms", name: "Twilio SMS", category: "Communication", description: "SMS alerts for dues & admissions", installed: false, status: "Available" },
        { id: "razorpay", name: "Razorpay Gateway", category: "Payments", description: "UPI, Cards & Netbanking checkout", installed: true, status: "Connected" },
        { id: "stripe", name: "Stripe Connect", category: "Payments", description: "International credit card processing", installed: true, status: "Connected" },
        { id: "quickbooks", name: "QuickBooks Online", category: "Accounting", description: "Automatic ledger & tax sync", installed: false, status: "Available" },
        { id: "gcal", name: "Google Calendar", category: "Productivity", description: "Sync shift schedules & inspection reminders", installed: false, status: "Available" }
      ]
    };
  }

  async installPlugin(workspaceId, { pluginId, config }) {
    return {
      success: true,
      message: `Plugin ${pluginId} installed and configured`
    };
  }

  async configurePlugin(workspaceId, { pluginId, config }) {
    return {
      success: true,
      message: `Plugin ${pluginId} configuration saved`
    };
  }

  async uninstallPlugin(workspaceId, pluginId) {
    return {
      success: true,
      message: `Plugin ${pluginId} uninstalled`
    };
  }
}

module.exports = new MarketplaceService();
