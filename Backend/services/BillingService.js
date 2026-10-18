class BillingService {
  async getBillingOverview(workspaceId) {
    return {
      success: false,
      preview: true,
      currentPlan: null,
      billingHistory: [],
      gstSummary: null,
      message: "Workspace billing is unavailable through this preview endpoint.",
    };
  }

  async processCheckout(workspaceId, { planName, gateway, couponCode }) {
    return { success: false, preview: true, message: "Workspace checkout is not available through this preview endpoint." };
  }

  async validateCoupon(couponCode) {
    return { success: false, preview: true, valid: false, message: "Coupon validation is unavailable through this preview endpoint." };
  }

  async getInvoices(workspaceId) {
    return { success: false, preview: true, invoices: [], message: "Workspace invoices are unavailable through this preview endpoint." };
  }
}

module.exports = new BillingService();
