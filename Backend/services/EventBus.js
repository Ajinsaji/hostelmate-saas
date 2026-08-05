const EventEmitter = require("events");
const { logger } = require("../utils/logger");

class EventBus extends EventEmitter {
  constructor() {
    super();
    // Increase maximum listener limit just in case
    this.setMaxListeners(30);
    this.registerDefaultListeners();
  }

  emit(eventName, payload) {
    logger.info(`[EventBus] Emitting event: ${eventName} with payload keys: ${payload ? Object.keys(payload).join(", ") : "none"}`);
    return super.emit(eventName, payload);
  }

  registerDefaultListeners() {
    // 1. Audit Logger Listener
    this.on("RESIDENT_CREATED", async (data) => {
      this.triggerAuditLog("CREATE", "Resident", data);
    });
    this.on("RESIDENT_UPDATED", async (data) => {
      this.triggerAuditLog("UPDATE", "Resident", data);
    });
    this.on("RESIDENT_DELETED", async (data) => {
      this.triggerAuditLog("DELETE", "Resident", data);
    });
    this.on("ROOM_CREATED", async (data) => {
      this.triggerAuditLog("CREATE", "Room", data);
    });
    this.on("PAYMENT_RECEIVED", async (data) => {
      this.triggerAuditLog("CREATE", "Payment", data);
    });
    this.on("PAYMENT_UPDATED", async (data) => {
      this.triggerAuditLog("UPDATE", "Payment", data);
    });
    this.on("EXPENSE_CREATED", async (data) => {
      this.triggerAuditLog("CREATE", "Expense", data);
    });
    this.on("STAFF_ADDED", async (data) => {
      this.triggerAuditLog("CREATE", "Staff", data);
    });
    this.on("HOSTEL_CREATED", async (data) => {
      this.triggerAuditLog("CREATE", "Hostel", data);
    });
    this.on("HOSTEL_UPDATED", async (data) => {
      this.triggerAuditLog("UPDATE", "Hostel", data);
    });
    this.on("HOSTEL_SWITCHED", async (data) => {
      this.triggerAuditLog("SWITCH", "HostelContext", data);
      
      // Invalidate cache on switcher context update
      const WorkspaceCacheService = require("./WorkspaceCacheService");
      WorkspaceCacheService.invalidateWorkspace(data.workspaceId);
    });
    this.on("SUBSCRIPTION_UPDATED", async (data) => {
      this.triggerAuditLog("UPDATE", "Subscription", data);
      const WorkspaceCacheService = require("./WorkspaceCacheService");
      WorkspaceCacheService.invalidateWorkspace(data.workspaceId);
    });
    this.on("STORAGE_LIMIT_WARNING", async (data) => {
      this.triggerAuditLog("WARNING", "StorageUsage", data);
    });

    // 2. Notification Pipeline Listener hook
    this.on("RESIDENT_CREATED", (data) => {
      const NotificationPipelineService = require("./NotificationPipelineService");
      NotificationPipelineService.routeNotification({
        workspaceId: data.workspaceId,
        hostelId: data.hostelId,
        category: "Admissions",
        title: "New Admission Approved",
        body: `Resident ${data.name || "New Resident"} has been admitted to Room ${data.roomNumber || ""}.`,
      });
    });

    this.on("PAYMENT_RECEIVED", (data) => {
      const NotificationPipelineService = require("./NotificationPipelineService");
      NotificationPipelineService.routeNotification({
        workspaceId: data.workspaceId,
        hostelId: data.hostelId,
        category: "Payments",
        title: "Payment Received",
        body: `Payment of ₹${data.amount} received from Resident ID: ${data.residentId}.`,
      });
    });

    this.on("EXPENSE_CREATED", (data) => {
      const NotificationPipelineService = require("./NotificationPipelineService");
      NotificationPipelineService.routeNotification({
        workspaceId: data.workspaceId,
        hostelId: data.hostelId,
        category: "Finance",
        title: "New Expense Logged",
        body: `An expense of ₹${data.amount} has been added.`,
      });
    });

    this.on("STORAGE_LIMIT_WARNING", (data) => {
      const NotificationPipelineService = require("./NotificationPipelineService");
      NotificationPipelineService.routeNotification({
        workspaceId: data.workspaceId,
        category: "Subscription",
        title: "Storage Warning Alert",
        body: data.message,
      });
    });
  }

  async triggerAuditLog(actionType, entity, data) {
    try {
      const AuditLog = require("../models/AuditLog");
      await AuditLog.create({
        workspaceId: data.workspaceId || null,
        hostelId: data.hostelId || null,
        userId: data.ownerId || data.userId || null,
        action: `${actionType}_${entity.toUpperCase()}`,
        actionType,
        entity,
        newValue: data,
        details: `Event trigger for ${actionType} on ${entity}`,
        timestamp: new Date(),
      });
    } catch (err) {
      logger.error(`[EventBus] AuditLog creation failed: ${err.message}`);
    }
  }
}

module.exports = new EventBus();
