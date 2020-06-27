const { authnMW, authrMW } = require("../RBAC_Auth/models/auth");
const {
  Order,
  addOrder,
  getOrders,
  getOrderDetails,
  updateOrder,
  getAllNumbers,
  getOrdersForAdmin,
  getOrderDetailsForAdmin,
  updateOrderForAdmin,
  getVendorOrders,
  getVendorOrderDetails,
} = require("../models/order");
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
// router.get("/getVendorOrders/:id", async (req, res) => {
//   let orders = await getVendorOrders(req);

//   if (orders.message && orders.path && orders.type && orders.context)
//     return res.status(400).send(orders.message);

//   res.send(orders);
// });

// router.get("/getOrderDetailsForAdmin/:id", async (req, res) => {
//   let order = await getOrderDetailsForAdmin(req);

//   if (order.message && order.path && order.type && order.context)
//     return res.status(400).send(order.message);

//   res.send(order);
// });

// router.get("/getOrderDetails/:id", async (req, res) => {
//   let orderDetails = await getOrderDetails(req);

//   if (
//     orderDetails.message &&
//     orderDetails.path &&
//     orderDetails.type &&
//     orderDetails.context
//   )
//     return res.status(400).send(orderDetails.message);

//   res.send(orderDetails);
// });

// router.get("/getVendorOrderDetails/:id", async (req, res) => {
//   let orderDetails = await getVendorOrderDetails(req);

//   if (
//     orderDetails.message &&
//     orderDetails.path &&
//     orderDetails.type &&
//     orderDetails.context
//   )
//     return res.status(400).send(orderDetails.message);

//   res.send(orderDetails);
// });

// router.put("/edit/:id", async (req, res) => {
//   let updatedOrder = await updateOrder(req);

//   if (
//     updatedOrder.message &&
//     updatedOrder.path &&
//     updatedOrder.type &&
//     updatedOrder.context
//   )
//     return res.status(400).send(updatedOrder.message);

//   res.send(updatedOrder);
// });

// router.put("/editOrderForAdmin/:id", async (req, res) => {
//   let updatedOrder = await updateOrderForAdmin(req);

//   if (
//     updatedOrder.message &&
//     updatedOrder.path &&
//     updatedOrder.type &&
//     updatedOrder.context
//   )
//     return res.status(400).send(updatedOrder.message);

//   res.send(updatedOrder);
// });

// router.get("/getAllNumbers", async (req, res) => {
//   let all = await getAllNumbers(req);
//   res.send(all);
// });

module.exports = router;
