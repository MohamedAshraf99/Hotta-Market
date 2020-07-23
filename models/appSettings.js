const Joi = require("joi");
const mongoose = require("mongoose");

const appSettingsSchema = new mongoose.Schema({
  generalTax: {
    type: Number,
    required: true,
  },
  profitCalcMethod: {
    type: String,
    required: true,
    enum: ["cats", "provider"],
  },
  maxLimit: {
    type: Number,
  },
  productMethod: {
    type: String,
    required: true,
    enum: ["automatic", "manual"],
  },
  isNeglected: {
    type: Boolean,
    default: false,
  },
  dateCreate: {
    type: Date,
    default: Date.now,
  },
});

const AppSettings = mongoose.model("AppSettings", appSettingsSchema);

const seedAppSettings = async () => {
  let appSettings = await AppSettings.findOne();
  if (!appSettings) {
    let sett = new AppSettings({
      generalTax: 5,
      isNeglected: false,
      maxLimit: 10,
      productMethod: "manual",
      profitCalcMethod: "provider",
    });
    sett = await sett.save();
  }
};

seedAppSettings();
const getAppSettings = async (input) => {
  let appSettings = await AppSettings.findOne();

  return appSettings;
};

module.exports = {
  AppSettings,
  getAppSettings,
};
