const config = require("config");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const _ = require("lodash");
const { t2 } = require("../services/langs");
const { AppSettings } = require("./appSettings");
const { ProviderSubscription } = require("./providerSubscription");
const {
  getHashPassword,
  sendMessage,
  randomString,
} = require("../services/helper");
const { Product } = require("./product");
const { shipItems } = require("./shipItems");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    minlength: 5,
    maxlength: 50,
  },
  isActivated: {
    type: Boolean,
    default: false,
  },
  isNeglected: {
    type: Boolean,
    default: false,
  },
  providerStatus: Boolean,
  avatar: {
    type: String,
    required: true,
  },
  deliveryMethod: {
    type: String,
    enum: ["admin", "provider"],
  },
  commercialName: String,
  commercialNumber: {
    type: Number,
    unique: true,
  },
  desc: String,
  icon: String,
  phone: {
    type: String,
    required: true,
  },
  contacts: [
    {
      contact: String,
      name: String,
      job: String,
      default: {
        type: Boolean,
        default: false,
      },
    },
  ],
  email: {
    type: String,
    required: true,
    unique: true,
  },
  // identificationImages: [{
  //   type: String,
  // }],
  type: {
    type: String,
    enum: ["admin", "client", "vendor", "productiveFamily", "advertisment"],
    required: true,
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: true,
  },
  password: {
    type: String,
    minlength: 5,
    maxlength: 1024,
  },
  callsCount: Number,
  location: {
    area: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Area",
    },
    desc: String,
    lng: Number,
    lat: Number,
  },
  openingTime: String,
  closingTime: String,
  latestActivationCode: String,
  connectionId: {
    type: String,
    default: null,
  },
  deviceId: [
    {
      type: String,
    },
  ],

  dateCreate: {
    type: Date,
    default: Date.now(),
  },
});

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id, type: this.type },
    config.get("jwtPrivateKey")
  );
  return token;
};

const User = mongoose.model("User", userSchema);

const validateRegister = (body) => {
  let schema = {
    name: Joi.string().min(5).required(),
    isActivated: Joi.bool().optional(),
    avatar: Joi.string().required(),
    icon: Joi.string().optional(),
    commercialName: Joi.string().optional(),
    commercialNumber: Joi.number().optional(),
    desc: Joi.string().optional(),
    openingTime: Joi.string().optional(),
    closingTime: Joi.string().optional(),
    deliveryMethod: Joi.string().optional(),
    phone: Joi.string().required(),
    contacts: Joi.array().optional(),
    email: Joi.string().required(),
    type: Joi.string().required(),
    password: Joi.string().min(5).required(),
    location: Joi.object().optional(),
    role: Joi.string().length(24).optional(),
  };

  return Joi.validate(body, schema);
};

const validateUpdate = (body) => {
  let schema = {
    name: Joi.string().min(5).optional(),
    isActivated: Joi.bool().optional(),
    avatar: Joi.string().optional(),
    icon: Joi.string().optional(),
    commercialName: Joi.string().optional(),
    commercialNumber: Joi.number().optional(),
    desc: Joi.string().optional(),
    openingTime: Joi.string().optional(),
    closingTime: Joi.string().optional(),
    deliveryMethod: Joi.string().optional(),
    phone: Joi.string().optional(),
    contacts: Joi.array().optional(),
    email: Joi.string().optional(),
    password: Joi.string().min(2).optional(),
    location: Joi.object().optional(),
    isNeglected: Joi.bool().optional(),
    providerStatus: Joi.bool().optional(),
    connectionId: Joi.string().optional(),
    deviceId: Joi.array().optional(),
  };

  return Joi.validate(body, schema);
};

const validateLogin = (body) => {
  let schema = {
    phone: Joi.string().required(),
    password: Joi.string().min(5).required(),
  };

  return Joi.validate(body, schema);
};

const validateChangePassword = (body) => {
  let schema = {
    phone: Joi.string().required(),
    password: Joi.string().min(5).required(),
    newPassword: Joi.string().min(5).required(),
  };

  return Joi.validate(body, schema);
};

const validateResetPassword = (body) => {
  let schema = {
    phone: Joi.string().required(),
    password: Joi.string().min(5).required(),
  };

  return Joi.validate(body, schema);
};

const validateActivate = (body) => {
  let schema = {
    phone: Joi.string().required(),
    code: Joi.string().min(5).required(),
  };

  return Joi.validate(body, schema);
};

const validateSendActivationCode = (body) => {
  let schema = {
    phone: Joi.string().required(),
  };

  return Joi.validate(body, schema);
};

const getUsers = async (input) => {
  let {
    startId = false,
    limit = 10,
    all = false,
    filter = "{}",
    fields = "{}",
    sort = `{"_id": -1}`,
  } = input.query;

  startId = !startId || startId == "false" ? false : startId;

  startId = all || !startId ? {} : { _id: { $lt: startId } };
  limit = all ? null : !isNaN(limit) ? parseInt(limit) : 10;

  sort = JSON.parse(sort);

  fields = JSON.parse(fields);

  fields = Object.keys(fields).reduce(
    (ac, f) => `${ac} ${fields[f] == "1" ? "" : "-"}${f}`,
    ""
  );

  let users = await User.find({
    ...startId,
    ...JSON.parse(filter),
  })
    .sort(sort)
    .select(fields)
    .populate("role")
    .limit(limit);

  if (users.length)
    users = users.map((user) => {
      if (fields.avatar != 0) {
        if (user.avatar)
          user.avatar =
            input.app.get("defaultAvatar")(input, "host") + user.avatar;
        else user.avatar = input.app.get("defaultAvatar")(input);
      }

      if (fields.icon != 0 && user.icon)
        user.icon = input.app.get("defaultAvatar")(input, "host") + user.icon;

      return _.omit(user.toObject(), [
        "password",
        "latestActivationCode",
        "connectionId",
        "deviceId",
        "__v",
      ]);
    });

  return users;
};

const getInvoicesOnUsers = async (input) => {
  let {
    startId = false,
    limit = 10,
    all = false,
    filter = "{}",
    fields = "{}",
    sort = "{}",
  } = input.query;

  startId = !startId || startId == "false" ? false : startId;

  startId = all || !startId ? {} : { _id: { $gt: startId } };
  limit = all ? null : !isNaN(limit) ? parseInt(limit) : 10;

  sort = JSON.parse(sort);

  fields = JSON.parse(fields);

  fields = Object.keys(fields).reduce(
    (ac, f) => `${ac} ${fields[f] == "1" ? "" : "-"}${f}`,
    ""
  );

  // await User.find({ ...startId, ...JSON.parse(filter) })
  //   .sort(sort)
  //   .select(fields)
  //   .populate("Product")
  //   .limit(limit);

  let aggr = [
    {
      $match: {
        ...JSON.parse(filter),
        $or: [
          { type: "vendor" },
          { type: "productiveFamily" },
          { type: "advertisment" },
        ],
      },
    },
    // {
    //   $lookup: {
    //     from: "products",
    //     localField: "_id",
    //     foreignField: "provider",
    //     as: "products",
    //   },
    // },

    // {
    //   $lookup: {
    //     from: "productprices",
    //     localField: "products._id",
    //     foreignField: "product",
    //     as: "productPrices",
    //   },
    // },

    // {
    //   $lookup: {
    //     from: "shipItems",
    //     localField: "productprices._id",
    //     foreignField: "productPrice",
    //     as: "shipItems",
    //   },
    // },
    {
      $lookup: {
        from: "orderships",
        let: { id: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$provider", "$$id"],
              },
            },
          },
          {
            $project: {
              _id: 1,
              deliveryMethod: 1,
              shipitems: 1,
              taxPercentage: 1,
              shipmentStatus: 1,
            },
          },
        ],
        as: "orderships",
      },
    },
    // {
    //   $lookup: {
    //     from: "orderships",
    //     let: { id: "$_id.provider" },
    //     pipeline: [
    //       { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
    //       { $project: { log: 1 } },
    //     ],
    //     as: "orderships",
    //   },
    // },
    {
      $unwind: {
        path: "$orderships",
        preserveNullAndEmptyArrays: true,
      },
    },

    // {
    //   $addFields: {
    //     orderships: {
    //       $filter: {
    //         input: "$orderships",
    //         as: "order",
    //         cond: {
    //           $eq: ["$$order.shipmentStatus", "completed"],
    //         },
    //       },
    //     },
    //   },
    // },

    {
      $lookup: {
        from: "shipitems",

        let: { id: "$orderships._id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$orderShips", "$$id"] } } },
          {
            $project: {
              _id: 1,
              dtlsProfitValue: 1,
              product: 1,
            },
          },
        ],
        as: "orderships.shipitems",
      },
    },

    {
      $group: {
        _id: "$_id",
        name: { $first: "$name" },
        deliveryMethod: { $first: "$deliveryMethod" },

        orderships: { $push: "$orderships" },
        // invoices: { $push: "$invoices" },
      },
    },

    {
      $lookup: {
        from: "invoices",
        let: { id: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$client", "$$id"] } } },
          { $project: { quantity: 1 } },
        ],
        as: "invoices",
      },
    },
    {
      $unwind: {
        path: "$invoices",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $group: {
        _id: "$_id",
        name: { $first: "$name" },
        deliveryMethod: { $first: "$deliveryMethod" },

        orderships: { $first: "$orderships" },
        invoices: { $push: "$invoices" },
      },
    },

    {
      $project: {
        _id: 1,
        name: 1,
        deliveryMethod: 1,

        orderships: {
          $filter: {
            input: "$orderships",
            as: "order",
            cond: { $eq: ["$$order.shipmentStatus", "completed"] },
          },
        },
        // invoices: 1,
        totalPaidInvoices: { $sum: "$invoices.quantity" },
      },
    },
    // db.party.aggregate([
    //   {
    //     $lookup: {
    //       from: "address",
    //       localField: "_id",
    //       foreignField: "party_id",
    //       as: "address",
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: "$address",
    //       preserveNullAndEmptyArrays: true,
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "addressComment",
    //       localField: "address._id",
    //       foreignField: "address_id",
    //       as: "address.addressComment",
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: "$_id",
    //       name: { $first: "$name" },
    //       address: { $push: "$address" },
    //     },
    //   },
    //   {
    //     $project: {
    //       _id: 1,
    //       name: 1,
    //       address: {
    //         $filter: {
    //           input: "$address",
    //           as: "a",
    //           cond: { $ifNull: ["$$a._id", false] },
    //         },
    //       },
    //     },
    //   },
    // ]),
    // {
    //   $project: {
    //     name: 1,
    //     totalPaidInvoices: { $sum: "$invoices.quantity" },
    //     // totalInvoices: { $sum: "$shipItems.dtlsProfitValue" },

    //     shipItems: 1,
    //     // productPrices: 1,
    //     orderships: 1,
    //   },
    // },
    // {
    //   $group: { _id: "$orderships._id", total: { $sum: "$invoices.quantity" } },
    // },
  ];
  let users = await User.aggregate(aggr);

  // if (users.length)
  //   users = users.map((user) => {
  //     if (fields.avatar != 0) {
  //       if (user.avatar)
  //         user.avatar =
  //           input.app.get("defaultAvatar")(input, "host") + user.avatar;
  //       else user.avatar = input.app.get("defaultAvatar")(input);
  //     }

  //     if (fields.icon != 0 && user.icon)
  //       user.icon = input.app.get("defaultAvatar")(input, "host") + user.icon;

  //     return _.omit(user.toObject(), [
  //       "password",
  //       "latestActivationCode",
  //       "connectionId",
  //       "deviceId",
  //       "__v",
  //     ]);
  //   });
  // await shipItems.find().populate("orderShips");
  return users;
};

const register = async (input) => {
  let body = input.body,
    activationCode = randomString(4, "#");

  const { error } = validateRegister(body);
  if (error) return error.details[0];

  let checkUser = await User.findOne({
    $or: [{ phone: body.phone }, { email: body.email }, { name: body.name }],
  });
  if (checkUser) {
    if (checkUser.name == body.name) {
      return t2(input.header("Accept-Language"), "name already registered.");
    } else if (checkUser.phone == body.phone)
      return t2(input.header("Accept-Language"), "Phone already registered.");
    else if (checkUser.email == body.email)
      return t2(input.header("Accept-Language"), "Email already registered.");
  }

  if (!body.role) {
    let Role = mongoose.model("Role"),
      userRole = await Role.findOne({ name: body.type });

    if (userRole._id) body.role = userRole._id;
  }

  body.password = await getHashPassword(body.password);
  body.isActivated = body.type == "admin" ? true : false;
  body.latestActivationCode = activationCode;

  if (["productiveFamily", "vendor"].includes(body.type))
    body.providerStatus = true;

  let user = new User(body);
  user = await user.save();

  let code =
    body.type == "admin"
      ? "Send Successful"
      : await sendMessage(user.phone, activationCode);
  //if (true) {
  code = code.replace(/^\s+|\s+$/g, "").trim();
  if (user._id && code == "Send Successful") {
    if (user.avatar)
      user.avatar = input.app.get("defaultAvatar")(input, "host") + user.avatar;
    else user.avatar = input.app.get("defaultAvatar")(input);

    if (user.icon)
      user.icon = input.app.get("defaultAvatar")(input, "host") + user.icon;

    // i will show activation code in the response for mahmoud for testing purpose don't forget to delete it from response after that
    return _.omit(user.toObject(), [
      "password",
      //'latestActivationCode',
      "connectionId",
      "deviceId",
      "__v",
    ]);
  } else return "cant create user";
};

const updateUser = async (input) => {
  let body = input.body,
    { id } = input.params;

  const { error } = validateUpdate(body);
  if (error) return error.details[0];
  if (body.providerStatus == true) {
    await Product.updateMany(
      { provider: id },
      { $set: { available: true } },
      { new: true }
    );
  } else if (body.providerStatus == false) {
    await Product.updateMany(
      { provider: id },
      { $set: { available: false } },
      { new: true }
    );
  }

  let user = await User.findByIdAndUpdate(id, body, { new: true });
  if (!user)
    return t2(input.header("Accept-Language"), "Invalid Phone or password.");

  if (user._id) {
    if (user.avatar)
      user.avatar = input.app.get("defaultAvatar")(input, "host") + user.avatar;
    else user.avatar = input.app.get("defaultAvatar")(input);

    if (user.icon)
      user.icon = input.app.get("defaultAvatar")(input, "host") + user.icon;
  }

  return _.omit(user.toObject(), [
    "password",
    "latestActivationCode",
    "connectionId",
    "deviceId",
    "__v",
  ]);
};

async function login(input) {
  const { error } = validateLogin(input.body);
  if (error) return error.details[0];

  let { phone, password } = input.body;

  if (!phone || !password)
    return t2(input.header("Accept-Language"), "Invalid phone or password.");

  let user = await User.findOne({ phone });

  if (!user)
    return t2(input.header("Accept-Language"), "Invalid phone or password.");

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword)
    return t2(input.header("Accept-Language"), "Invalid password.");

  const token = user.generateAuthToken();

  ret = {
    ..._.omit(user.toObject(), [
      "password",
      "latestActivationCode",
      "connectionId",
      "deviceId",
      "__v",
    ]),
    ...{ token: token },
  };

  if (user._id) {
    if (ret.avatar)
      ret.avatar = input.app.get("defaultAvatar")(input, "host") + ret.avatar;
    else ret.avatar = input.app.get("defaultAvatar")(input);

    if (ret.icon)
      ret.icon = input.app.get("defaultAvatar")(input, "host") + ret.icon;
  }

  return ret;
}

async function changePassword(input) {
  const { error } = validateChangePassword(input.body);
  if (error) return error.details[0];

  let { phone, password, newPassword } = input.body;

  let user = await User.findOne({ phone });
  if (!user)
    return t2(input.header("Accept-Language"), "Invalid Phone or password.");

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword)
    return t2(input.header("Accept-Language"), "Invalid  password.");

  user.password = await getHashPassword(newPassword);
  await user.save();

  return user._id ? true : false;
}

async function resetPassword(input) {
  const { error } = validateResetPassword(input.body);
  if (error) return error.details[0];

  let { phone, password } = input.body;

  let user = await User.findOne({ phone });
  if (!user)
    return t2(input.header("Accept-Language"), "Invalid email or password.");

  user.password = await getHashPassword(password);
  await user.save();

  const token = user.generateAuthToken();

  if (user.avatar)
    user.avatar = input.app.get("defaultAvatar")(input, "host") + user.avatar;
  else user.avatar = input.app.get("defaultAvatar")(input);

  if (user.icon)
    user.icon = input.app.get("defaultAvatar")(input, "host") + user.icon;

  return {
    ..._.omit(user.toObject(), [
      "password",
      "latestActivationCode",
      "connectionId",
      "deviceId",
      "__v",
    ]),

    ...{ token: token },
  };
}

async function activate(input) {
  const { error } = validateActivate(input.body);
  if (error) return error.details[0];

  let { phone, code } = input.body;

  let user = await User.findOne({ phone });

  if (user._id && user.latestActivationCode == code) {
    user.isActivated = true;
    await user.save();
  }

  const token = user.generateAuthToken();

  if (user.avatar)
    user.avatar = input.app.get("defaultAvatar")(input, "host") + user.avatar;
  else user.avatar = input.app.get("defaultAvatar")(input);

  if (user.icon)
    user.icon = input.app.get("defaultAvatar")(input, "host") + user.icon;

  return {
    ..._.omit(user.toObject(), [
      "password",
      "latestActivationCode",
      "connectionId",
      "deviceId",
      "__v",
    ]),

    ...{ token: token },
  };
}

async function sendActivationCode(input) {
  const { error } = validateSendActivationCode(input.params);
  if (error) return error.details[0];

  let { phone } = input.params,
    latestActivationCode = randomString(4, "#");
  let user = await User.findOne({ phone });
  if (!user) {
    return "user not registered";
  } else {
    let code = await sendMessage(user.phone, latestActivationCode);
    code = code.replace(/^\s+|\s+$/g, "").trim();

    //if (true) {
    if (user._id && code == "Send Successful") {
      let user = await User.findOneAndUpdate(
        { phone },
        { latestActivationCode },
        { new: true }
      );

      if (user.avatar)
        user.avatar =
          input.app.get("defaultAvatar")(input, "host") + user.avatar;
      else user.avatar = input.app.get("defaultAvatar")(input);

      if (user.icon)
        user.icon = input.app.get("defaultAvatar")(input, "host") + user.icon;

      const token = user.generateAuthToken();

      return {
        ..._.omit(user.toObject(), ["connectionId", "deviceId", "__v"]),
        ...{ token: token },
      };
    }
  }
}

async function getUser(input) {
  let { id } = input.params;
  let user = await User.findById(id)
    .populate("role")
    .populate({
      path: "location.area",
      populate: {
        path: "city",
        populate: {
          path: "country",
        },
      },
    });

  if (user._id) {
    if (user.avatar)
      user.avatar = input.app.get("defaultAvatar")(input, "host") + user.avatar;
    else user.avatar = input.app.get("defaultAvatar")(input);

    if (user.icon)
      user.icon = input.app.get("defaultAvatar")(input, "host") + user.icon;
  }

  return {
    ..._.omit(user.toObject(), ["password", "__v"]),
  };
}

async function getProducts(input) {
  let userId = input.params.id;
  let { startId = false, limit = 10, all = false } = input.query;

  startId = !startId || startId == "false" ? false : startId;

  startId =
    all || !startId
      ? {}
      : { "_id._id": { $gt: mongoose.Types.ObjectId(startId) } };
  limit = all ? null : !isNaN(limit) ? parseInt(limit) : 10;

  let aggr = [
    {
      $match: {
        _id: mongoose.Types.ObjectId(userId),
        isNeglected: false,
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "provider",
        as: "products",
      },
    },
    {
      $unwind: {
        path: "$products",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        "products.available": true,
      },
    },
    {
      $lookup: {
        from: "productprices",
        localField: "products._id",
        foreignField: "product",
        as: "productPrices",
      },
    },
    {
      $addFields: {
        "products.price": "$productPrices.price",
        "products.props": "$productPrices.props",
      },
    },
    {
      $addFields: {
        "products.type": "$type",
      },
    },
    {
      $group: {
        _id: "$products",
        subCategoryImage: {
          $first: "$avatar",
        },
      },
    },
    {
      $addFields: {
        subCategoryImage: {
          $concat: [
            input.app.get("defaultAvatar")(input, "host"),
            "$subCategoryImage",
          ],
        },
      },
    },
    {
      $project: {
        subCategoryImage: 1,
        "_id._id": 1,
        "_id.nameAr": 1,
        "_id.nameEn": 1,
        "_id.available": 1,
        "_id.avatar": 1,
        "_id.type": 1,
        "_id.price": 1,
        "_id.props": 1,
      },
    },
    {
      $match: startId,
    },
    {
      $sort: {
        "_id._id": 1,
      },
    },
    {
      $limit: limit ? limit : Infinity,
    },
  ];
  let getProducts = await User.aggregate(aggr);
  getProducts.map((product) => {
    product._id.price.map((price) => {
      if (price.reducedPrice == undefined) {
        price.reducedPrice = price.initialPrice;
      }
      price.discountPrecentage =
        ((price.initialPrice - price.reducedPrice) / price.initialPrice) * 100;
      return price;
    });
    return product;
  });
  if (getProducts.length == 0) return getProducts;
  else {
    getProducts = getProducts.map((product) => {
      product._id.avatar =
        input.app.get("defaultAvatar")(input, "host") + product._id.avatar;
      return product;
    });
    return getProducts;
  }
}

async function getCart(input, res) {
  let userId = input.params.id;
  let appSettings = await AppSettings.findOne();
  let generalTax = appSettings.generalTax;
  let ProfitCalcMethod = appSettings.profitCalcMethod;
  let { startId = false, limit = 10, all = false } = input.query;

  startId = !startId || startId == "false" ? false : startId;

  startId =
    all || !startId
      ? {}
      : { "_id._id": { $gt: mongoose.Types.ObjectId(startId) } };
  limit = all ? null : !isNaN(limit) ? parseInt(limit) : 10;

  let aggr = [
    {
      $match: {
        _id: mongoose.Types.ObjectId(userId),
        isNeglected: false,
      },
    },
    {
      $lookup: {
        from: "shipcards",
        localField: "_id",
        foreignField: "client",
        as: "shipcards",
      },
    },
    {
      $unwind: {
        path: "$shipcards",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "productprices",
        localField: "shipcards.productPrice",
        foreignField: "_id",
        as: "productPrices",
      },
    },
    {
      $unwind: {
        path: "$productPrices",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "productPrices.product",
        foreignField: "_id",
        as: "products",
      },
    },
    {
      $unwind: {
        path: "$products",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        "products.available": true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "products.provider",
        foreignField: "_id",
        as: "provider",
      },
    },
    {
      $unwind: {
        path: "$provider",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "cats",
        localField: "products.cats",
        foreignField: "_id",
        as: "cats",
      },
    },
    {
      $unwind: {
        path: "$cats",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        "products.price": "$productPrices.price",
        "products.quantity": "$shipcards.quantity",
        "products.generalTax": generalTax,
        "products.shipcard": "$shipcards._id",
        "products.providerId": "$products.provider",
        "products.type": "$cats.type",
        "products.productPrices": "$productPrices._id",
        "products.provider": "$productPrices._id",
        "products.openingTime": "$provider.openingTime",
        "products.closingTime": "$provider.closingTime",
      },
    },
    {
      $group: {
        _id: "$products",
      },
    },
    {
      $project: {
        "_id._id": 1,
        "_id.nameAr": 1,
        "_id.nameEn": 1,
        "_id.prepaireDurationType": 1,
        "_id.prepaireDurationValue": 1,
        "_id.openingTime": 1,
        "_id.closingTime": 1,
        "_id.avatar": 1,
        "_id.tax": 1,
        "_id.generalTax": 1,
        "_id.quantity": 1,
        "_id.shipcard": 1,
        "_id.type": 1,
        "_id.productPrices": 1,
        "_id.providerId": 1,
        "_id.price.initialPrice": 1,
        "_id.price.reducedPrice": {
          $ifNull: ["$_id.price.reducedPrice", "$_id.price.initialPrice"],
        },
      },
    },
    {
      $addFields: {
        "_id.discountPrecentage": {
          $multiply: [
            100,
            {
              $divide: [
                {
                  $subtract: [
                    "$_id.price.initialPrice",
                    "$_id.price.reducedPrice",
                  ],
                },
                "$_id.price.initialPrice",
              ],
            },
          ],
        },
      },
    },
    {
      $match: startId,
    },
    {
      $sort: {
        "_id._id": 1,
      },
    },
    {
      $limit: limit ? limit : Infinity,
    },
  ];
  let getProducts = await User.aggregate(aggr);
  if (getProducts.length == 0) return res.send(getProducts);
  else if (getProducts[0]._id.shipcard) {
    let someFunction = (getProducts) => {
      let Products = getProducts.map(async (product) => {
        if (ProfitCalcMethod == "provider") {
          let providerSubscription = await ProviderSubscription.find({
            provider: product._id.providerId,
          });
          let vendor = await User.find({ _id: product._id.providerId });
          if (
            providerSubscription[providerSubscription.length - 1].percentage ==
            undefined
          ) {
            providerSubscription[
              providerSubscription.length - 1
            ].percentage = 0;
          }
          product._id.deliveryMethod = vendor[0].deliveryMethod;
          product._id.profitCalcMethod = ProfitCalcMethod;
          product._id.dtlsProfitPercentage =
            providerSubscription[providerSubscription.length - 1].percentage;
          product._id.profitPercentage = product._id.dtlsProfitPercentage;
          product._id.avatar =
            input.app.get("defaultAvatar")(input, "host") + product._id.avatar;
          return product;
        } else {
          product._id.avatar =
            input.app.get("defaultAvatar")(input, "host") + product._id.avatar;

          return product;
        }
      });
      return Promise.all(Products);
    };
    someFunction(getProducts)
      .then((data) => {
        let sum = 0;
        let totalPrice = data.map((product) => {
          sum += product._id.price.reducedPrice;
          return sum;
        });
        data[0]._id.totalPrice = totalPrice[totalPrice.length - 1];
        return res.send(data);
      })
      .catch((error) => {
        return res.status(400).send(error);
      });
  } else {
    getProducts = [];
    return res.send(getProducts);
  }
}
module.exports = {
  User,
  register,
  login,
  changePassword,
  updateUser,
  resetPassword,
  getUser,
  getUsers,
  activate,
  sendActivationCode,
  getProducts,
  getCart,
  getInvoicesOnUsers,
};
