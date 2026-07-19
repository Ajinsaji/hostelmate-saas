const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["Billing", "Technical", "Feature Request", "Other"],
      default: "Technical",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open",
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true },
    hostel: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel" },
    attachments: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
