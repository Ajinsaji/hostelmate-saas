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

    // 2. Notification Pipeline & WhatsApp Communication Engine Listener hooks
    this.on("ADMISSION_SUBMITTED", async (data) => {
      if (data.phone) {
        try {
          const { dispatchWhatsAppMessage } = require("./whatsappService");
          await dispatchWhatsAppMessage({
            hostelId: data.hostelId,
            recipientPhone: data.phone,
            recipientName: data.applicantName || "Applicant",
            recipientType: "Resident",
            templateCode: "ADMISSION_SUBMITTED",
            variables: {
              applicantName: data.applicantName || "Applicant",
              hostelName: data.hostelName || "HostelMate",
              referenceId: String(data.referenceId || data.admissionId || "-"),
              submissionDate: data.submissionDate || new Date().toLocaleDateString(),
              status: data.status || "Pending",
            },
            businessEvent: "ADMISSION_SUBMITTED",
            referenceId: `ADM_SUB_${data.admissionId || data.referenceId}`,
          });
        } catch (err) {
          logger.error({ err }, "[EventBus] WhatsApp trigger for ADMISSION_SUBMITTED failed");
        }
      }
    });

    this.on("ADMISSION_REJECTED", async (data) => {
      if (data.phone) {
        try {
          const { dispatchWhatsAppMessage } = require("./whatsappService");
          await dispatchWhatsAppMessage({
            hostelId: data.hostelId,
            recipientPhone: data.phone,
            recipientName: data.applicantName || "Applicant",
            recipientType: "Resident",
            templateCode: "ADMISSION_REJECTED",
            variables: {
              applicantName: data.applicantName || "Applicant",
              hostelName: data.hostelName || "HostelMate",
              referenceId: String(data.referenceId || data.admissionId || "-"),
              rejectionReason: data.rejectionReason || "Not specified",
            },
            businessEvent: "ADMISSION_REJECTED",
            referenceId: `ADM_REJ_${data.admissionId || data.referenceId}`,
          });
        } catch (err) {
          logger.error({ err }, "[EventBus] WhatsApp trigger for ADMISSION_REJECTED failed");
        }
      }
    });

    this.on("ROOM_TRANSFERRED", async (data) => {
      const NotificationPipelineService = require("./NotificationPipelineService");
      NotificationPipelineService.routeNotification({
        workspaceId: data.workspaceId,
        hostelId: data.hostelId,
        category: "Rooms",
        title: "Resident Room Transferred",
        body: `Resident ${data.residentName || "Resident"} has been transferred to Room ${data.newRoom || ""}, Bed ${data.newBed || ""}.`,
      });

      if (data.phone) {
        try {
          const { dispatchWhatsAppMessage } = require("./whatsappService");
          await dispatchWhatsAppMessage({
            hostelId: data.hostelId,
            residentId: data.residentId,
            recipientPhone: data.phone,
            recipientName: data.residentName || "Resident",
            templateCode: "ROOM_TRANSFERRED",
            variables: {
              residentName: data.residentName || "Resident",
              hostelName: data.hostelName || "HostelMate",
              oldRoom: data.oldRoom || "—",
              oldBed: data.oldBed || "—",
              newRoom: data.newRoom || "—",
              newBed: data.newBed || "—",
            },
            businessEvent: "ROOM_TRANSFERRED",
            referenceId: data.referenceId || `TRANSFER_${data.residentId}_${Date.now()}`,
          });
        } catch (err) {
          logger.error({ err }, "[EventBus] WhatsApp trigger for ROOM_TRANSFERRED failed");
        }
      }
    });

    this.on("RESIDENT_CREATED", async (data) => {
      const NotificationPipelineService = require("./NotificationPipelineService");
      NotificationPipelineService.routeNotification({
        workspaceId: data.workspaceId,
        hostelId: data.hostelId,
        category: "Admissions",
        title: "New Admission Approved",
        body: `Resident ${data.name || "New Resident"} has been admitted to Room ${data.roomNumber || ""}.`,
      });

      if (data.phone) {
        try {
          const { dispatchWhatsAppMessage } = require("./whatsappService");
          await dispatchWhatsAppMessage({
            hostelId: data.hostelId,
            residentId: data.residentId || data._id,
            recipientPhone: data.phone,
            recipientName: data.name || data.firstName || "Resident",
            templateCode: "ADMISSION_APPROVED",
            variables: {
              residentName: data.name || data.firstName || "Resident",
              hostelName: data.hostelName || "HostelMate",
              roomNumber: data.roomNumber || "—",
              bedNumber: data.bedNumber || "—",
            },
            businessEvent: "ADMISSION_APPROVED",
            referenceId: String(data.residentId || data._id),
          });
        } catch (err) {
          logger.error({ err }, "[EventBus] WhatsApp trigger for RESIDENT_CREATED failed");
        }
      }
    });

    this.on("PAYMENT_RECEIVED", async (data) => {
      const NotificationPipelineService = require("./NotificationPipelineService");
      NotificationPipelineService.routeNotification({
        workspaceId: data.workspaceId,
        hostelId: data.hostelId,
        category: "Payments",
        title: "Payment Received",
        body: `Payment of ₹${data.amount} received from Resident ID: ${data.residentId}.`,
      });

      if (data.phone || data.residentPhone) {
        try {
          const { dispatchWhatsAppMessage } = require("./whatsappService");
          await dispatchWhatsAppMessage({
            hostelId: data.hostelId,
            residentId: data.residentId,
            recipientPhone: data.phone || data.residentPhone,
            recipientName: data.residentName || "Resident",
            templateCode: "PAYMENT_RECEIVED",
            variables: {
              residentName: data.residentName || "Resident",
              amount: data.amount || "0",
              month: data.month || "Current Month",
              balance: data.balance || "0",
              hostelName: data.hostelName || "HostelMate",
              receiptNo: data.receiptNo || "REC-001",
            },
            businessEvent: "PAYMENT_RECEIVED",
            referenceId: String(data.paymentId || data._id),
          });
        } catch (err) {
          logger.error({ err }, "[EventBus] WhatsApp trigger for PAYMENT_RECEIVED failed");
        }
      }
    });

    this.on("RESIDENT_CHECKED_OUT", async (data) => {
      if (data.phone) {
        try {
          const { dispatchWhatsAppMessage } = require("./whatsappService");
          await dispatchWhatsAppMessage({
            hostelId: data.hostelId,
            residentId: data.residentId,
            recipientPhone: data.phone,
            recipientName: data.residentName || "Resident",
            templateCode: "CHECKOUT_CLEARANCE",
            variables: {
              residentName: data.residentName || "Resident",
              hostelName: data.hostelName || "HostelMate",
              roomNumber: data.roomNumber || "—",
              checkoutDate: data.actualCheckoutDate ? new Date(data.actualCheckoutDate).toLocaleDateString() : new Date().toLocaleDateString(),
            },
            businessEvent: "CHECKOUT_CLEARANCE",
            referenceId: String(data.residentId || data._id),
          });
        } catch (err) {
          logger.error({ err }, "[EventBus] WhatsApp trigger for RESIDENT_CHECKED_OUT failed");
        }
      }
    });

    this.on("ROOM_ASSIGNED", async (data) => {
      if (data.phone) {
        try {
          const { dispatchWhatsAppMessage } = require("./whatsappService");
          await dispatchWhatsAppMessage({
            hostelId: data.hostelId,
            residentId: data.residentId,
            recipientPhone: data.phone,
            recipientName: data.residentName || "Resident",
            templateCode: "ROOM_ASSIGNED",
            variables: {
              residentName: data.residentName || "Resident",
              hostelName: data.hostelName || "HostelMate",
              roomNumber: data.roomNumber || "—",
              bedNumber: data.bedNumber || "—",
            },
            businessEvent: "ROOM_ASSIGNED",
            referenceId: `ROOM_${data.residentId}_${data.roomNumber}`,
          });
        } catch (err) {
          logger.error({ err }, "[EventBus] WhatsApp trigger for ROOM_ASSIGNED failed");
        }
      }
    });

    this.on("OWNER_ACCOUNT_ACTIVATED", async (data) => {
      try {
        const { publishNotification } = require("../utils/notificationPublisher");
        await publishNotification({
          userId: data.ownerId,
          hostelId: data.hostelId,
          role: "owner",
          type: "account_activated",
          category: "system",
          priority: "critical",
          title: "HostelMate Account Activated",
          message: `Welcome to HostelMate! Your account for ${data.hostelName || "your hostel"} is now active.`,
          actionUrl: "/dashboard",
          meta: {
            route: "/dashboard",
            deepLink: "/dashboard",
            hostelId: String(data.hostelId),
          },
        });
      } catch (e) {
        logger.error({ err: e }, "[EventBus] Push notification for OWNER_ACCOUNT_ACTIVATED failed");
      }

      if (data.phone) {
        try {
          const { dispatchWhatsAppMessage } = require("./whatsappService");
          await dispatchWhatsAppMessage({
            hostelId: data.hostelId,
            ownerId: data.ownerId,
            recipientPhone: data.phone,
            recipientName: data.ownerName || "Hostel Owner",
            recipientType: "Owner",
            templateCode: "OWNER_ACCOUNT_ACTIVATED",
            variables: {
              ownerName: data.ownerName || "Hostel Owner",
              hostelName: data.hostelName || "HostelMate",
              username: data.username || data.phone,
              temporaryPassword: data.temporaryPassword || data.tempPassword || "-",
              planType: data.planType || "HostelMate Unified Plan",
              trialDays: data.trialDays !== undefined ? data.trialDays : 30,
              trialStartDate: data.trialStartDate || data.startDate || "",
              trialEndDate: data.trialEndDate || data.endDate || data.expiryDate || "",
              trialAmount: data.trialAmount !== undefined ? data.trialAmount : "0",
              subscriptionAmount: data.subscriptionAmount !== undefined ? data.subscriptionAmount : (data.amount || "10"),
              billingCycle: data.billingCycle || "Month",
              expiryDate: data.expiryDate || data.trialEndDate || "",
              loginUrl: data.loginUrl || "https://hostelmate-saas.vercel.app/owner/login",
            },
            businessEvent: "OWNER_ACCOUNT_ACTIVATED",
            referenceId: `OWNER_ACT_${data.ownerId}`,
          });
        } catch (err) {
          logger.error({ err }, "[EventBus] WhatsApp trigger for OWNER_ACCOUNT_ACTIVATED failed");
        }
      }
    });

    this.on("HOSTEL_ACTIVATED_FOR_EXISTING_OWNER", async (data) => {
      try {
        const { publishNotification } = require("../utils/notificationPublisher");
        await publishNotification({
          userId: data.ownerId,
          hostelId: data.hostelId,
          role: "owner",
          type: "hostel_activated",
          category: "system",
          priority: "high",
          title: "New Hostel Activated",
          message: `Your new hostel "${data.hostelName || "New Property"}" has been approved and activated.`,
          actionUrl: "/dashboard",
          meta: {
            route: "/dashboard",
            deepLink: "/dashboard",
            hostelId: String(data.hostelId),
          },
        });
      } catch (e) {
        logger.error({ err: e }, "[EventBus] Push notification for HOSTEL_ACTIVATED_FOR_EXISTING_OWNER failed");
      }

      if (data.phone) {
        try {
          const { dispatchWhatsAppMessage } = require("./whatsappService");
          await dispatchWhatsAppMessage({
            hostelId: data.hostelId,
            ownerId: data.ownerId,
            recipientPhone: data.phone,
            recipientName: data.ownerName || "Hostel Owner",
            recipientType: "Owner",
            templateCode: "HOSTEL_ACTIVATED_FOR_EXISTING_OWNER",
            variables: {
              ownerName: data.ownerName || "Hostel Owner",
              hostelName: data.hostelName || "HostelMate",
              location: data.city ? `${data.city}, ${data.district || ""}`.trim() : (data.location || "Hostel Location"),
              rooms: String(data.rooms || 0),
              beds: String(data.beds || 0),
              activationDate: data.activationDate || new Date().toLocaleDateString(),
              loginUrl: data.loginUrl || "https://hostelmate-saas.vercel.app/owner/login",
            },
            businessEvent: "HOSTEL_ACTIVATED_FOR_EXISTING_OWNER",
            referenceId: `HOSTEL_ACT_${data.hostelId}`,
          });
        } catch (err) {
          logger.error({ err }, "[EventBus] WhatsApp trigger for HOSTEL_ACTIVATED_FOR_EXISTING_OWNER failed");
        }
      }
    });

    this.on("RENT_DUE", async (data) => {
      if (data.phone) {
        try {
          const { dispatchWhatsAppMessage } = require("./whatsappService");
          await dispatchWhatsAppMessage({
            hostelId: data.hostelId,
            residentId: data.residentId,
            recipientPhone: data.phone,
            recipientName: data.residentName || "Resident",
            templateCode: "RENT_REMINDER",
            variables: {
              residentName: data.residentName || "Resident",
              amount: String(data.amount || "0"),
              month: data.month || "Current Month",
              dueDate: data.dueDate ? new Date(data.dueDate).toLocaleDateString() : "Due Today",
              hostelName: data.hostelName || "HostelMate",
              roomNumber: data.roomNumber || "—",
            },
            businessEvent: "RENT_REMINDER",
            referenceId: data.referenceId || `RENT_DUE_${data.residentId}_${data.month}`,
          });
        } catch (err) {
          logger.error({ err }, "[EventBus] WhatsApp trigger for RENT_DUE failed");
        }
      }
    });

    this.on("RENT_OVERDUE", async (data) => {
      if (data.phone) {
        try {
          const { dispatchWhatsAppMessage } = require("./whatsappService");
          await dispatchWhatsAppMessage({
            hostelId: data.hostelId,
            residentId: data.residentId,
            recipientPhone: data.phone,
            recipientName: data.residentName || "Resident",
            templateCode: "RENT_REMINDER",
            variables: {
              residentName: data.residentName || "Resident",
              amount: String(data.amount || "0"),
              month: data.month || "Current Month",
              dueDate: data.dueDate ? new Date(data.dueDate).toLocaleDateString() : "Overdue",
              hostelName: data.hostelName || "HostelMate",
              roomNumber: data.roomNumber || "—",
            },
            businessEvent: "RENT_REMINDER",
            referenceId: data.referenceId || `RENT_OVERDUE_${data.residentId}_${data.month}`,
          });
        } catch (err) {
          logger.error({ err }, "[EventBus] WhatsApp trigger for RENT_OVERDUE failed");
        }
      }
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
