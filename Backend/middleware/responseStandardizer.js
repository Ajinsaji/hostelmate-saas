/**
 * Middleware to standardize API responses across the platform.
 * Ensures every response matches:
 * Success: { success: true, message: "", data: {} }
 * Error: { success: false, message: "", errors: [] }
 */
const responseStandardizer = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (body) {
    if (body && typeof body === "object") {
      // If it already matches the standard, just send it
      if ("success" in body) {
        if (body.success === true) {
          body.message = body.message || "";
          body.data = body.data || (body.hostel || body.owner || body.admission || {});
          // cleanup old keys
          delete body.hostel;
          delete body.owner;
          delete body.admission;
        } else {
          body.message = body.message || "An error occurred";
          body.errors = body.errors || [];
        }
      } else {
        // Wrap non-standard responses
        body = {
          success: res.statusCode < 400,
          message: "",
          data: res.statusCode < 400 ? body : null,
          errors: res.statusCode >= 400 ? [body] : [],
        };
      }
    }
    return originalJson.call(this, body);
  };

  next();
};

module.exports = responseStandardizer;
