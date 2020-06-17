const Joi = require('joi');
const mongoose = require('mongoose');
const {Order} = require("./order");
const _ = require("lodash");


const orderShipSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "order",
        required: true,
    },
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }, 
    delivery: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeliveryPerson",
    }, 
    shippingFees: {
        type: Number,
        required: true
    },
    profitCalcMethod : {
        type: String,
        enum: ['provider','cat']
    },
    profitPercentage: {
        type: Number,
        required: true,
    },
    profitValue: {
        type: Number,
        required: true,
    },
    taxPercentage: {
        type: Number,
        required: true,
    },
    taxValue: {
        type: Number,
        required: true,
    },
    deliveryMethod: {
        type: String,
        enum: ['provider','admin']
    },
    totalAdminBalance: {
        type: Number,
        required: true,
    },
    number: {
        type: String,
      },
    shipmentStatus : {
        type: String,
        default: "new",
        enum: ['new', 'completed','canceled','returned']
    },
    log: [{
        date: {
            type: Date,
            default: Date.now()
        },
        state: {
            type: String,
            default: "new",
            enum: ['new', 'progress','onWay','delivered', 'canceled','returned']
        }
    }],
    isNeglected: {
        type: Boolean,
        default: false
    },
    dateCreate: {
        type: Date,
        default: Date.now
    }
});


const orderShip = mongoose.model('orderShip', orderShipSchema);

const validateAddOrderShip = (body) => {
    let schema = {
        shippingFees:Joi.number().required(),
        profitPercentage:Joi.number().required(),
        profitValue:Joi.number().required(),
        totalAdminBalance:Joi.number().required(),
        taxPercentage:Joi.number().required(),
        taxValue:Joi.number().required(),
        deliveryMethod:Joi.string().required(),
        profitCalcMethod:Joi.string().required(),
        provider: Joi.string().length(24).required(),
        order: Joi.string().length(24).required(),
        shipItems: Joi.array().required(),
        log: Joi.array().optional(),
        shipmentStatus:Joi.string().optional(),
    };

    return Joi.validate(body, schema);
}
const validateUpdate = (body) => {
    let schema = {
        date:Joi.date().optional(),
        state:Joi.string().optional(),
        delivery: Joi.string().length(24).optional(),
    };
    return Joi.validate(body, schema);
}
const validateUpdateForAdmin = (body) => {
    let schema = {
        state:Joi.string().optional(),
        shipmentStatus:Joi.string().optional(),
        isNeglected:Joi.bool().optional(),
        delivery: Joi.string().optional(),
    };
  
    return Joi.validate(body, schema);
  }
  const updateDelivery = async (input) => {

    let {id} = input.params;
    let body = input.body;
  
    const { error } = validateUpdate(body);
    if (error) return (error.details[0]);
  
    let updatedDelivery = await orderShip.findByIdAndUpdate(
        id,
        {
           $set: { delivery:body.delivery }
      },
        { new: true }
    );
    return updatedDelivery;
  }
  

  async function getProviderDetails(input) {
    let providerId = input.params.id;
    let { startId = false, limit = 10, all = false } = input.query;

    startId = (!startId || startId == "false") ? false : startId

    startId = (all || !startId) ? {} : { '_id._id': { '$gt': mongoose.Types.ObjectId(startId) } };
    limit = (all) ? null : (!isNaN(limit) ? parseInt(limit) : 10);


    let aggr = [
        {
          '$match': {
            'provider': mongoose.Types.ObjectId(providerId),
            'isNeglected': false    
  
          }
        },
        {
            '$lookup': {
              'from': 'shipitems', 
              'localField': '_id', 
              'foreignField': 'orderShips', 
              'as': 'shipitems'
            }
        },
        {
            '$unwind': {
              'path': '$shipitems',
              'preserveNullAndEmptyArrays': true
            }
          },
          {
            $facet: {
              new: [
                  {
                $match: {
                    shipmentStatus: "new"            
                }
              },
              
              { $count: "newCount" },
              ],
              totalOrderNew: [
                {
              $match: {
                  shipmentStatus: "new"            
              }
            },
            {
                $bucket: {
                  groupBy: "$shipmentStatus",
                  boundaries: [  0, 150, 200, 300, 400 ],
                  default: "Other",
                  output: {
                    "totalOrderNew": { $sum: "$shipitems.product.total" },
                  }
                }
              }
            ],
              completed: [
                {
                  $match: {
                    shipmentStatus: "completed"
                  }
                },
                { $count: "completedCount" }
              ],
            totalOrderCompleted: [
                {
              $match: {
                  shipmentStatus: "completed"            
              }
            },
            {
                $bucket: {
                  groupBy: "$shipmentStatus",
                  boundaries: [  0, 150, 200, 300, 400 ],
                  default: "Other",
                  output: {
                    "totalProfitValue": { $sum: "$profitValue" },
                    "totalOrderCompleted": { $sum: "$shipitems.product.total" },
                  }
                }
              }
            ],
              canceled: [{
                $match: {
                    shipmentStatus: "canceled"
                }  
              },
              { $count: "canceledCount" }
              ],
              totalOrderCanceled: [
                {
              $match: {
                  shipmentStatus: "canceled"            
              }
            },
            {
                $bucket: {
                  groupBy: "$shipmentStatus",
                  boundaries: [  0, 150, 200, 300, 400 ],
                  default: "Other",
                  output: {
                    "totalOrderCanceled": { $sum: "$shipitems.product.total" },
                  }
                }
              }
            ],
              returned: [{
                $match: {
                    shipmentStatus: "returned",
                }
              },
              { $count: "returnedCount" }
              ],
              totalOrderReturned: [
                {
              $match: {
                  shipmentStatus: "returned"            
              }
            },
            {
                $bucket: {
                  groupBy: "$shipmentStatus",
                  boundaries: [  0, 150, 200, 300, 400 ],
                  default: "Other",
                  output: {
                    "totalOrderReturned": { $sum: "$shipitems.product.total" },
                  }
                }
              }
            ],
            }
          },
      ];
      let providerDetails = await orderShip.aggregate(aggr);
      console.log(providerDetails[0].new);
      if(providerDetails[0].new.length == 0 ){
        providerDetails[0].new[0]= {newCount: 0};
      }
      if(providerDetails[0].totalOrderNew.length == 0 ){
        providerDetails[0].totalOrderNew[0]= {totalOrderNew: 0};
      }
      if(providerDetails[0].completed.length == 0 ){
        providerDetails[0].completed[0]= {completedCount: 0};
      }
      if(providerDetails[0].totalOrderCompleted.length == 0){
        providerDetails[0].totalOrderCompleted[0]= {totalProfitValue: 0,totalOrderCompleted:0};
      }
      if(providerDetails[0].canceled.length == 0){
        providerDetails[0].canceled[0]= {canceledCount: 0};
      }
      if(providerDetails[0].totalOrderCanceled.length == 0 ){
        providerDetails[0].totalOrderCanceled[0]= {totalOrderCanceled: 0};
      }
      if(providerDetails[0].returned.length == 0 ){
        providerDetails[0].returned[0]= {returnedCount: 0};
      }
      if(providerDetails[0].totalOrderReturned.length == 0){
        providerDetails[0].totalOrderReturned[0]= {totalOrderReturned: 0};
      }
        return providerDetails[0];
      
  }




  const updateOrderShipForAdmin = async (input) => {
  
    const { error } = validateUpdateForAdmin(input.body);
    if (error) return (error.details[0]);
  
    let body = input.body,
        {id} = input.params
  
    let state = body.state || false

    let delivery = body.delivery != "0" ? {delivery: body.delivery}: {$unset: {delivery: 1 }}

  
      let updatedOrderShip = await orderShip.findByIdAndUpdate(id, {
          ...(state && { $push: { log: { state } } }),
          ..._.omit(body, ['state', 'delivery']),
          ...(body.delivery != undefined && delivery)
      },
          { new: true })


      if (updatedOrderShip._id) {
          let allShipsStatus = await orderShip
              .find({ order: updatedOrderShip.order }, { shipmentStatus: 1 })

          let orderLogState =
              allShipsStatus.some(s => s.shipmentStatus == "completed") ? "completed" :
                  allShipsStatus.some(s => s.shipmentStatus == "new") ? "new" :
                      allShipsStatus.some(s => s.shipmentStatus == "returned") ? "returned" : "canceled"
                       
          await mongoose.model("Order")
              .findByIdAndUpdate(updatedOrderShip.order,
                  { $push: { log: { state: orderLogState } } })

      }
  
    return updatedOrderShip
  }


  const updateOrderShip = async (input) => {
  const {Order} = require("./order");
    let {id} = input.params;
    console.log(typeof(id));
    let body = input.body;
    let shipState = "";;
    const { error } = validateUpdate(body);
    if (error) return (error.details[0]);
    if(body.state == "new" || body.state =="progress" || body.state =="onWay"){
       shipState = "new";
    }
    else if(body.state == "delivered"){
        shipState = "completed";
     }
    else if (body.state == "canceled"){
        shipState = "canceled";
    }
    else{
        shipState = "returned";
    }
    let updatedOrder = await orderShip.findByIdAndUpdate(
      id,
      {
           $addToSet: {log:body},
           $set: { shipmentStatus:shipState }
    },
      { new: true }
  );
    
    let allOrderShips = await orderShip.find({order:updatedOrder.order});
    let status =[];
    allOrderShips.map(orderShip =>{
      status.push(orderShip.shipmentStatus);
    });
    console.log(status);
    let countnew = 0;
    let countCancel = 0;
    let countComplete = 0;
    let countReturned = 0;
    let st = status.map(status=>{
        if(status == "new")
        {
            countnew++;
        }
        else if(status == "canceled")
        {
            countCancel++;
        }
        else if(status == "returned")
        {
            countReturned++;
        }
        else{
           countComplete++
        }

       
    })
    console.log(countnew,countCancel,countComplete,countReturned);
    if(countnew >=1){
       st = "new";
    }
    else if(countCancel == status.length){
        st = "canceled";
    }
    else if(countReturned == status.length || countComplete == 0){
        st = "returned";
    }
     else{
         st = "completed";
     }
     let orderID = (updatedOrder.order).toString();
    let order = await Order.findByIdAndUpdate(
        orderID,
        {$addToSet: {log:{state:st,date :Date.now()}}},
        { new: true }
    );
    return updatedOrder;
}

module.exports = {
    orderShip,
    validateAddOrderShip,
    updateOrderShipForAdmin,
    updateOrderShip,
    updateDelivery,
    getProviderDetails
}


