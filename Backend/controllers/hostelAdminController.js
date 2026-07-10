const { getHostelDirectory } = require("../services/hostels/hostelDirectoryService");
const { getHostelProfile } = require("../services/hostels/hostelProfileService");
const { getOwnerProfileByHostelId } = require("../services/hostels/ownerService");
const { getHostelFinancials: getHostelFinancialsService } = require("../services/hostels/hostelFinancialService");
const { getHostelSubscription: getHostelSubscriptionService } = require("../services/hostels/hostelSubscriptionService");

const parseIntSafe = (v, fallback) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

function getQueryParams(req) {
  const q = req.query || {};
  const filters = {
    status: q.status,
    subscription: q.subscription,
    plan: q.plan,
    city: q.city,
    district: q.district,
    state: q.state,
  };

  // strip empty filters
  Object.keys(filters).forEach((k) => {
    if (filters[k] === undefined || filters[k] === "") delete filters[k];
  });

  return {
    page: parseIntSafe(q.page, 1),
    pageSize: parseIntSafe(q.pageSize, 25),
    search: q.search || "",
    sortField: q.sortField || "createdAt",
    sortOrder: q.sortOrder || "desc",
    filters,
  };
}

// Thin controller: validate + call service + return JSON
async function getHostels(req, res) {
  try {
    const params = getQueryParams(req);
    const result = await getHostelDirectory(params);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load hostels", error: error?.message });
  }
}

async function getHostel(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "Hostel id is required" });
    const data = await getHostelProfile(id);
    if (!data) return res.status(404).json({ success: false, message: "Hostel not found" });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load hostel", error: error?.message });
  }
}

async function getOwner(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "Hostel id is required" });
    const data = await getOwnerProfileByHostelId(id);
    if (!data) return res.status(404).json({ success: false, message: "Owner not found" });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load owner", error: error?.message });
  }
}

async function getHostelFinancials(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "Hostel id is required" });
    }

    const data = await getHostelFinancialsService(id);
    if (!data) {
      return res.status(404).json({ success: false, message: "Financials not found" });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load financials", error: error?.message });
  }
}

async function getHostelSubscription(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "Hostel id is required" });
    }

    const data = await getHostelSubscriptionService(id);
    if (!data) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load subscription", error: error?.message });
  }
}

module.exports = {
  getHostels,
  getHostel,
  getOwner,
  getHostelFinancials,
  getHostelSubscription,
};


