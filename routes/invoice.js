const express = require("express");
const {
  addInvoice,
  getInvoicesForAdmin,
  deleteInvoice,
  updateInvoiceForAdmin,
} = require("../models/invoice");
const router = express.Router();

router.post("/add", async (req, res) => {
  let newInvoice = await addInvoice(req);

  if (
    newInvoice.message &&
    newInvoice.path &&
    newInvoice.type &&
    newInvoice.context
  )
    return res.status(400).send(newInvoice.message);

  res.send(newInvoice);
});

router.get("/getInvoicesForAdmin", async (req, res) => {
  let invoices = await getInvoicesForAdmin(req);

  if (invoices.message && invoices.path && invoices.type && invoices.context)
    return res.status(400).send(invoices.message);

  res.send(invoices);
});

router.put("/delete/:id", async (req, res) => {
  res.send(await deleteInvoice(req.params.id));
});
router.put("/editInvoiceForAdmin/:id", async (req, res) => {
  let updatedInvoice = await updateInvoiceForAdmin(req);

  if (
    updatedInvoice.message &&
    updatedInvoice.path &&
    updatedInvoice.type &&
    updatedInvoice.context
  )
    return res.status(400).send(updatedInvoice.message);

  res.send(updatedInvoice);
});

module.exports = router;
