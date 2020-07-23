const { authnMW, authrMW } = require("../RBAC_Auth/models/auth");
const { AppSettings } = require("../models/appSettings");
const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  let stngs = await AppSettings.findOne({});
  res.send(stngs);
});

router.put("/", async (req, res) => {
  let stngs = await AppSettings.findOneAndUpdate({}, req.body);
  res.send(stngs);
});

module.exports = router;
