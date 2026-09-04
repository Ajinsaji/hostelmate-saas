const mongoose = require("mongoose");
const Owner = require("../models/Owner");
const Hostel = require("../models/Hostel");
const Workspace = require("../models/Workspace");
const Subscription = require("../models/Subscription");
const FeatureGateService = require("../services/FeatureGateService");

const contextMiddleware = async (req, res, next) => {
  // If context is already resolved on this request, avoid duplicate execution
  if (req.context) {
    return next();
  }

  // If not authenticated, we cannot populate context. Wait for JWT validation to populate req.user.
  if (!req.user) {
    return next();
  }

  try {
    const ownerId = req.user.userId;
    const role = req.user.role;

    // Find the Owner profile
    let owner = await Owner.findById(ownerId).lean();
    if (!owner) {
      // Legacy user (staff/warden) or Admin
      // Look up via User model if staff
      const User = require("../models/User");
      const userRecord = await User.findById(ownerId).lean();
      
      let workspaceId = null;
      let hostelId = req.user.hostelId || null;

      if (userRecord && userRecord.tenantId) {
        // Look up corresponding hostel workspace
        const hostelRecord = await Hostel.findById(userRecord.tenantId).select("workspaceId").lean();
        if (hostelRecord) {
          workspaceId = hostelRecord.workspaceId;
        }
        hostelId = userRecord.tenantId;
      }

      req.context = {
        workspaceId,
        hostelId,
        userId: ownerId,
        role,
        plan: "base",
        permissions: [],
      };
      return next();
    }

    let workspaceId = owner.workspaceId || owner.activeWorkspaceId;

    // Auto-provision workspace if missing (Never allow owner without a workspace)
    if (!workspaceId) {
      let defaultWorkspace = await Workspace.findOne({ ownerId }).lean();
      if (!defaultWorkspace) {
        const WorkspaceModel = require("../models/Workspace");
        const SubscriptionModel = require("../models/Subscription");
        const StorageUsageModel = require("../models/StorageUsage");
        const PlanModel = require("../models/Plan");

        const ws = await WorkspaceModel.create({
          name: `${owner.ownerName || "My"}'s Workspace`,
          ownerId,
          activeHostelId: owner.hostelId || null,
        });

        const basePlan = await PlanModel.findOne({ name: "base" }).lean();
        const sub = await SubscriptionModel.create({
          workspaceId: ws._id,
          plan: "base",
          status: "Active",
          storageLimit: basePlan?.storageLimit || 5368709120,
          residentLimit: basePlan?.residentLimit || 100,
          staffLimit: basePlan?.staffLimit || 5,
          hostelLimit: basePlan?.hostelLimit || 1,
          features: basePlan?.features || [],
        });

        const storage = await StorageUsageModel.create({
          workspaceId: ws._id,
          usedBytes: 0,
        });

        ws.subscriptionId = sub._id;
        ws.storageId = storage._id;
        await ws.save();

        await Owner.findByIdAndUpdate(ownerId, {
          workspaceId: ws._id,
          activeWorkspaceId: ws._id,
          activeHostelId: owner.hostelId || null,
        });

        workspaceId = ws._id;
        owner.workspaceId = ws._id;
        owner.activeWorkspaceId = ws._id;
        owner.activeHostelId = owner.hostelId || null;
      } else {
        workspaceId = defaultWorkspace._id;
        await Owner.findByIdAndUpdate(ownerId, {
          workspaceId: defaultWorkspace._id,
          activeWorkspaceId: defaultWorkspace._id,
        });
      }
    }

    // Determine Requested Active Hostel ID
    const requestedHostelCandidate = req.headers["x-active-hostel-id"] || req.query.hostelId || null;
    let resolvedHostelId = null;

    if (requestedHostelCandidate) {
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(requestedHostelCandidate)) {
        return res.status(400).json({
          success: false,
          code: "INVALID_TENANT_ID",
          message: "Invalid hostel ID format",
        });
      }

      const hostelRecord = await Hostel.findById(requestedHostelCandidate).select("_id workspaceId ownerId isDeleted").lean();

      if (!hostelRecord || hostelRecord.isDeleted) {
        return res.status(403).json({
          success: false,
          code: "FORBIDDEN_TENANT",
          message: "Forbidden: Inaccessible or invalid hostel context.",
        });
      }

      // Check authorization unless super_admin/admin/eps_admin
      if (!["super_admin", "admin", "eps_admin"].includes(role)) {
        const isAuthorized =
          (hostelRecord.workspaceId && workspaceId && String(hostelRecord.workspaceId) === String(workspaceId)) ||
          (hostelRecord.ownerId && String(hostelRecord.ownerId) === String(ownerId)) ||
          (owner.hostelId && String(hostelRecord._id) === String(owner.hostelId));

        if (!isAuthorized) {
          return res.status(403).json({
            success: false,
            code: "FORBIDDEN_TENANT",
            message: "Forbidden: Access denied to this hostel under your workspace context.",
          });
        }
      }

      resolvedHostelId = hostelRecord._id;
    } else {
      // Fallback chain for default active context
      const fallback = owner.activeHostelId || owner.hostelId || null;
      if (fallback && mongoose.Types.ObjectId.isValid(fallback)) {
        const hostelRecord = await Hostel.findOne({ _id: fallback, isDeleted: { $ne: true } }).select("_id").lean();
        if (hostelRecord) {
          resolvedHostelId = hostelRecord._id;
        }
      }
    }

    // Load Subscription and features
    const subContext = await FeatureGateService.getSubscriptionContext(workspaceId);

    req.context = {
      workspaceId,
      hostelId: resolvedHostelId,
      userId: ownerId,
      role,
      plan: subContext.planName,
      permissions: subContext.features,
    };

    next();
  } catch (error) {
    console.error("Context middleware error:", error);
    next(error);
  }
};

module.exports = contextMiddleware;
