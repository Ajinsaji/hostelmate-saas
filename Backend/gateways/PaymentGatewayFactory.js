const RazorpayGateway = require("./RazorpayGateway");

class PaymentGatewayFactory {
  static getGateway(providerName = "Razorpay") {
    switch (providerName.toLowerCase()) {
      case "razorpay":
        return new RazorpayGateway();
      default:
        return new RazorpayGateway();
    }
  }
}

module.exports = PaymentGatewayFactory;
