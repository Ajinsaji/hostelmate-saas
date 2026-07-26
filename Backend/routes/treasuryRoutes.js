const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const {
  createBankAccount,
  getBankAccounts,
  recordCashBook,
  getCashBook,
  recordBankTx,
  reconcileBankTx,
  getLedger,
  getTreasurySummary,
} = require("../controllers/treasuryController");

router.use(ownerAuth);

router.post("/bank-accounts", createBankAccount);
router.get("/bank-accounts", getBankAccounts);
router.post("/cash-book", recordCashBook);
router.get("/cash-book", getCashBook);
router.post("/bank-transactions", recordBankTx);
router.patch("/bank-transactions/:id/reconcile", reconcileBankTx);
router.get("/ledger", getLedger);
router.get("/summary", getTreasurySummary);

module.exports = router;

