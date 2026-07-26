const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { receiveDeposit, refundDeposit, getDeposits } = require("../controllers/depositController");

router.use(ownerAuth);

router.post("/", receiveDeposit);
router.post("/refund", refundDeposit);
router.get("/", getDeposits);

module.exports = router;
