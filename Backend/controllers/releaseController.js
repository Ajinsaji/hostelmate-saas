const versionService = require("../services/VersionService");
const ReleaseNote = require("../models/ReleaseNote");

const getLatestRelease = async (req, res) => {
  try {
    const release = await versionService.getLatestRelease();
    res.status(200).json({ success: true, release });
  } catch (error) {
    console.error("getLatestRelease error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAllReleases = async (req, res) => {
  try {
    const releases = await versionService.getAllReleases();
    res.status(200).json({ success: true, releases });
  } catch (error) {
    console.error("getAllReleases error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getReleaseByVersion = async (req, res) => {
  try {
    const { version } = req.params;
    const release = await ReleaseNote.findOne({ version });
    if (!release) {
      return res.status(404).json({ success: false, message: "Release note not found" });
    }
    res.status(200).json({ success: true, release });
  } catch (error) {
    console.error("getReleaseByVersion error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const createRelease = async (req, res) => {
  try {
    const release = await ReleaseNote.create(req.body);
    res.status(201).json({ success: true, release });
  } catch (error) {
    console.error("createRelease error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateRelease = async (req, res) => {
  try {
    const release = await ReleaseNote.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, release });
  } catch (error) {
    console.error("updateRelease error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteRelease = async (req, res) => {
  try {
    await ReleaseNote.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Release deleted" });
  } catch (error) {
    console.error("deleteRelease error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const markReleaseAsRead = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const workspaceId = req.context?.workspaceId;
    const { version } = req.body;
    const result = await versionService.markAsRead(userId, workspaceId, version);
    res.status(200).json(result);
  } catch (error) {
    console.error("markReleaseAsRead error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getLatestRelease,
  getAllReleases,
  getReleaseByVersion,
  createRelease,
  updateRelease,
  deleteRelease,
  markReleaseAsRead
};
