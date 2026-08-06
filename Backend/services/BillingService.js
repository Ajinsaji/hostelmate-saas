class BillingService {
  async getBillingOverview(workspaceId) {
    return {
      success: true,
      currentPlan: {
        name: "Pro Plan",
        renewalDate: "2026-09-01",
        storageUsedMB: 12,
        storageLimitMB: 5000,
        hostelsUsed: 2,
        hostelsLimit: 5,
        residentsUsed: 85,
        residentsLimit: 250,
        staffUsed: 6,
        staffLimit: 20
      },
      billingHistory: [
        { id: "inv_101", date: "2026-08-01", plan: "Pro Plan", amount: 1999, currency: "INR", status: "Paid", invoiceUrl: "#" },
        { id: "inv_100", date: "2026-07-01", plan: "Pro Plan", amount: 1999, currency: "INR", status: "Paid", invoiceUrl: "#" }
      ],
      gstSummary: {
        gstin: "29AAAAA0000A1Z5",
        taxRate: "18%",
        cgst: 179.91,
        sgst: 179.91,
        totalTax: 359.82
      }
    };
  }

  async processCheckout(workspaceId, { planName, gateway, couponCode }) {
    let discount = 0;
    if (couponCode === "HOSTEL10") discount = 10;

    return {
      success: true,
      message: `Sandbox checkout initiated for ${planName} via ${gateway || "Razorpay"}`,
      transactionId: `tx_sb_${Date.now()}`,
      amount: planName === "Enterprise" ? 4999 : 1999,
      appliedDiscountPercent: discount
    };
  }

  async validateCoupon(couponCode) {
    if (couponCode === "HOSTEL10" || couponCode === "WELCOME20") {
      return { success: true, valid: true, discountPercent: couponCode === "WELCOME20" ? 20 : 10 };
    }
    return { success: true, valid: false, message: "Invalid or expired coupon code" };
  }

  async getInvoices(workspaceId) {
    return {
      success: true,
      invoices: [
        { id: "inv_101", date: "2026-08-01", plan: "Pro Plan", amount: 1999, status: "Paid" },
        { id: "inv_100", date: "2026-07-01", plan: "Pro Plan", amount: 1999, status: "Paid" }
      ]
    };
  }
}

module.exports = new BillingService();
