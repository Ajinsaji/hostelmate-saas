const express = require("express");
const router = express.Router();
const accountantAuth = require("../middleware/accountantAuth");
const { receiveDeposit, refundDeposit, getDeposits } = require("../controllers/depositController");

router.use(accountantAuth);

router.post("/", receiveDeposit);
router.post("/refund", refundDeposit);
router.get("/", getDeposits);

module.exports = router;
