import Order from "../models/orderModel.js";
import Settlement from "../models/Settlement.js";
import crypto from "crypto";
import razorpay from "../config/razorpay.js";



export const createOrder = async (req, res) => {
  try {

    const {
      items,
      totalAmount,
      sprovid,
      customerMobile,
      paymentMethod,
      paymentStatus,
      orderStatus,
      sprovname,
              ordrType,
        tableNumber,
        additionalDetails
    } = req.body;

    // =====================================================
    // VALIDATION
    // =====================================================

    if (
      !items ||
      items.length === 0 ||
      !totalAmount ||
      !sprovid
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // =====================================================
    // FIND LAST TOKEN
    // =====================================================

    const lastOrder = await Order.findOne({
      sprovid,
    })
      .sort({ createdAt: -1 });

    // =====================================================
    // GENERATE TOKEN
    // =====================================================

    let tokenNumber = 1;

    if (lastOrder?.tokenNumber) {
      tokenNumber = lastOrder.tokenNumber + 1;
    }

    // =====================================================
    // CREATE ORDER
    // =====================================================

    const order = await Order.create({

      items,

      totalAmount,

      sprovid,
      sprovname,

      customerMobile,

      tokenNumber,

      paymentMethod,
      settleStatus:"counter_completed",
      settleDate:"",
         ordrType,
        tableNumber,         ordrType,
        tableNumber,
      paymentStatus:
        paymentStatus || "UnPaid",

      orderStatus:
        orderStatus || "Pending",
      additionalDetails
    });

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// export const createOrder = async (req, res) => {
//   try {
//     const { sprovid,customerMobile, items, totalAmount, paymentMethod ,paymentStatus} = req.body;

//     const order = await Order.create({
//       sprovid,customerMobile, 
//       items,
//       totalAmount,
//       paymentMethod,
//       paymentStatus
//     });

//     res.status(201).json(order);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// export const updateOrderStatus = async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id);

//     order.orderStatus = req.body.orderStatus;

//     await order.save();

//     res.json(order);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


export const getCustomerOrders = async (
  req,
  res
) => {
  try {

    const { mobile } = req.params;

    const orders = await Order.find({
      customerMobile: mobile,
    }).sort({ createdAt: -1 }).limit(10);

    return res.status(200).json({
      success: true,
      orders,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSingleOrder = async (
  req,
  res
) => {
  try {

    const order = await Order.findById(
      req.params.id
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




// export const getProviderOrders = async (
//   req,
//   res
// ) => {
//   try {

//     const orders = await Order.find({
//       sprovid: req.params.sprovid,
//     }).sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       orders,
//     });

//   } catch (error) {

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };


// export const getProviderOrders = async (req, res) => {
//   try {
//     const { sprovid } = req.params;

//     // pagination query
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;

//     const skip = (page - 1) * limit;

//     const total = await Order.countDocuments({
//       sprovid,
//     });

//     const orders = await Order.find({ sprovid })
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     return res.status(200).json({
//       success: true,
//       orders,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//       },
//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };


export const getProviderOrders = async (req, res) => {
  try {
    const { sprovid } = req.params;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, status, payment } = req.query;

    // ================================
    // BUILD FILTER QUERY
    // ================================
    let query = { sprovid };

    // status filter
    if (status && status !== "All") {
      query.orderStatus = status;
    }

    // payment filter
    if (payment && payment !== "All") {
      query.paymentStatus = payment;
    }

    // search filter (mobile or token)
    if (search) {
      query.$or = [
        { customerMobile: { $regex: search, $options: "i" } },
        { tokenNumber: Number(search) || -1 },
        { tableNumber: Number(search) || -1 },
      ];
    }

    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateOrderStatus = async (
  req,
  res
) => {
  try {

    const { orderStatus } = req.body;

    const order =
      await Order.findByIdAndUpdate(
        req.params.id,
        {
          orderStatus,
        },
        {
          new: true,
        }
      );

    return res.status(200).json({
      success: true,
      order,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const updatePaymentStatus = async (
  req,
  res
) => {
  try {

    const { paymentStatus } = req.body;

    const order =
      await Order.findByIdAndUpdate(
        req.params.id,
        {
          paymentStatus,
        },
        {
          new: true,
        }
      );

    return res.status(200).json({
      success: true,
      order,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateOrderItems = async (req, res) => {
  try {
    const { items } = req.body;

    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        items,
        totalAmount,
      },
      { new: true }
    );

    res.json({ success: true, order });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// ======================================================
// GET QUEUE ORDERS
// ======================================================

export const getQueueOrders = async (req, res) => {
  try {

    const { sprovid } = req.params;

    // show only active queue orders
    const orders = await Order.find({
      sprovid,
      orderStatus: {
        $nin: ["Completed", "Cancelled"],
      },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .select(
        "tokenNumber orderStatus paymentStatus createdAt items totalAmount updatedAt"
      );

    return res.status(200).json({
      success: true,
      orders,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



export const createRazorpayOrder = async (req, res) => {
  try {

    const { amount } = req.body;

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      order,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyPaymentAndCreateOrder = async (
  req,
  res
) => {
  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,

      items,
      totalAmount,
      sprovid,
       sprovname,
      customerMobile,
      paymentMethod,
       ordrType,
      tableNumber
    } = req.body;

    // ==========================
    // VERIFY SIGNATURE
    // ==========================

    const body =
      razorpay_order_id +
      "|" +
      razorpay_payment_id;

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(body.toString())
        .digest("hex");

    const isAuthentic =
      expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment",
      });
    }

    // ==========================
    // FIND LAST TOKEN
    // ==========================

    const lastOrder = await Order.findOne({
      sprovid,
    }).sort({ createdAt: -1 });

    let tokenNumber = 1;

    if (lastOrder?.tokenNumber) {
      tokenNumber = lastOrder.tokenNumber + 1;
    }

    // ==========================
    // CREATE FINAL ORDER
    // ==========================

    const order = await Order.create({
      items,
      totalAmount,
      sprovid,
      sprovname,
      customerMobile,
      tokenNumber,

      paymentMethod: "online",
      ordrType,
      tableNumber,
      setelStatus : "pending",
      settleDate:"",

      paymentStatus: "Paid",

      orderStatus: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Payment successful",
      order,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};





// ======================================================
// DASHBOARD ANALYTICS
// ======================================================

export const getDashboardAnalytics = async (req, res) => {
  try {

    const { sprovid } = req.params;

    // ==========================================
    // TODAY DATE
    // ==========================================

    const today = new Date();

    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const startOfWeek = new Date();
    startOfWeek.setDate(today.getDate() - 7);

    const startOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    // ==========================================
    // TOTAL ANALYTICS
    // ==========================================

    const totalOrders = await Order.countDocuments({
      sprovid,
    });

    const totalSalesResult =
      await Order.aggregate([
        {
          $match: { sprovid },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$totalAmount",
            },
          },
        },
      ]);

    const totalSales =
      totalSalesResult[0]?.total || 0;

    // ==========================================
    // TODAY REPORT
    // ==========================================

    const todayOrders =
      await Order.countDocuments({
        sprovid,
        createdAt: {
          $gte: startOfToday,
        },
      });

    const todaySalesResult =
      await Order.aggregate([
        {
          $match: {
            sprovid,
            createdAt: {
              $gte: startOfToday,
            },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$totalAmount",
            },
          },
        },
      ]);

    const todaySales =
      todaySalesResult[0]?.total || 0;

    // ==========================================
    // WEEKLY REPORT
    // ==========================================

    const weeklyReport =
      await Order.aggregate([
        {
          $match: {
            sprovid,
            createdAt: {
              $gte: startOfWeek,
            },
          },
        },

        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },

            totalOrders: {
              $sum: 1,
            },

            totalAmount: {
              $sum: "$totalAmount",
            },
          },
        },

        {
          $sort: {
            _id: 1,
          },
        },
      ]);

    // ==========================================
    // MONTHLY REPORT
    // ==========================================

    const monthlyReport =
      await Order.aggregate([
        {
          $match: {
            sprovid,
            createdAt: {
              $gte: startOfMonth,
            },
          },
        },

        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },

            totalOrders: {
              $sum: 1,
            },

            totalAmount: {
              $sum: "$totalAmount",
            },
          },
        },

        {
          $sort: {
            _id: 1,
          },
        },
      ]);

    // ==========================================
    // SETTLEMENT REPORT
    // ==========================================

    const settlementReport =
      await Order.aggregate([
        {
          $match: {
            sprovid,
          },
        },

        {
          $group: {
            _id: "$settleStatus",

            totalOrders: {
              $sum: 1,
            },

            totalAmount: {
              $sum: "$totalAmount",
            },
          },
        },
      ]);

    // ==========================================
    // PAYMENT REPORT
    // ==========================================

    const paymentReport =
      await Order.aggregate([
        {
          $match: {
            sprovid,
          },
        },

        {
          $group: {
            _id: "$paymentStatus",

            totalOrders: {
              $sum: 1,
            },

            totalAmount: {
              $sum: "$totalAmount",
            },
          },
        },
      ]);

    // ==========================================
    // ORDER STATUS REPORT
    // ==========================================

    const orderStatusReport =
      await Order.aggregate([
        {
          $match: {
            sprovid,
          },
        },

        {
          $group: {
            _id: "$orderStatus",

            totalOrders: {
              $sum: 1,
            },
          },
        },
      ]);

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      dashboard: {
        totalOrders,
        totalSales,
        todayOrders,
        todaySales,
      },

      weeklyReport,

      monthlyReport,

      settlementReport,

      paymentReport,

      orderStatusReport,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};



// ======================================================
// DASHBOARD ANALYTICS2222222222222222222222222
// ======================================================

export const getDashboardAnalytics222 = async (req, res) => {
  try {

    const { sprovid } = req.params;

    // ==========================================
    // TODAY DATE
    // ==========================================

    const today = new Date();

    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const startOfWeek = new Date();
    startOfWeek.setDate(today.getDate() - 7);

    const startOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    // ==========================================
    // TOTAL ANALYTICS
    // ==========================================

    const totalOrders = await Order.countDocuments({
      sprovid,
    });

    const totalSalesResult =
      await Order.aggregate([
        {
          $match: { sprovid },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$totalAmount",
            },
          },
        },
      ]);

    const totalSales =
      totalSalesResult[0]?.total || 0;

    // ==========================================
    // TODAY REPORT
    // ==========================================

    const todayOrders =
      await Order.countDocuments({
        sprovid,
        createdAt: {
          $gte: startOfToday,
        },
      });

    const todaySalesResult =
      await Order.aggregate([
        {
          $match: {
            sprovid,
            createdAt: {
              $gte: startOfToday,
            },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$totalAmount",
            },
          },
        },
      ]);

    const todaySales =
      todaySalesResult[0]?.total || 0;

    // ==========================================
    // SETTLEMENT REPORT
    // ==========================================

    const settlementReport =
      await Order.aggregate([
        {
          $match: {
            sprovid,
          },
        },

        {
          $group: {
            _id: "$settleStatus",

            totalOrders: {
              $sum: 1,
            },

            totalAmount: {
              $sum: "$totalAmount",
            },
          },
        },
      ]);

    // ==========================================
    // PAYMENT REPORT
    // ==========================================

    const paymentReport =
      await Order.aggregate([
        {
          $match: {
            sprovid,
          },
        },

        {
          $group: {
            _id: "$paymentStatus",

            totalOrders: {
              $sum: 1,
            },

            totalAmount: {
              $sum: "$totalAmount",
            },
          },
        },
      ]);

    // ==========================================
    // ORDER STATUS REPORT
    // ==========================================

    const orderStatusReport =
      await Order.aggregate([
        {
          $match: {
            sprovid,
          },
        },

        {
          $group: {
            _id: "$orderStatus",

            totalOrders: {
              $sum: 1,
            },
          },
        },
      ]);

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      dashboard: {
        totalOrders,
        totalSales,
        todayOrders,
        todaySales,
      },

      // weeklyReport,

      // monthlyReport,

      settlementReport,

      paymentReport,

      orderStatusReport,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// ==================================
// Singel day Setell 
// =====================================

export const getSingleDayAnalytics = async (req, res) => {
  try {
    const { sprovid, date } = req.params;

    // date format: YYYY-MM-DD
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    // ==========================================
    // MATCH BASE
    // ==========================================

    const matchStage = {
      sprovid,
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    };

    // // ==========================================
    // // TOTAL ORDERS + SALES
    // // ==========================================

    // const totalResult = await Order.aggregate([
    //   { $match: matchStage },
    //   {
    //     $group: {
    //       _id: null,
    //       totalOrders: { $sum: 1 },
    //       totalAmount: { $sum: "$totalAmount" },
    //     },
    //   },
    // ]);

    // const totalOrders = totalResult[0]?.totalOrders || 0;
    // const totalAmount = totalResult[0]?.totalAmount || 0;

    // // ==========================================
    // // SETTLEMENT STATUS REPORT
    // // ==========================================

    // const settlementReport = await Order.aggregate([
    //   { $match: matchStage },
    //   {
    //     $group: {
    //       _id: "$settleStatus",

    //       totalOrders: { $sum: 1 },
    //       totalAmount: { $sum: "$totalAmount" },
    //     },
    //   },
    // ]);

    // // ==========================================
    // // PAYMENT METHOD REPORT
    // // ==========================================

    // const paymentReport = await Order.aggregate([
    //   { $match: matchStage },
    //   {
    //     $group: {
    //       _id: "$paymentMethod",

    //       totalOrders: { $sum: 1 },
    //       totalAmount: { $sum: "$totalAmount" },
    //     },
    //   },
    // ]);



    const result = await Order.aggregate([
  { $match: matchStage },

  {
    $facet: {
      summary: [
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
      ],

       paymentStuatusReport: [
        {
          $group: {
            _id: "$paymentStatus",
            totalOrders: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
      ],

      settlementReport: [
        {
          $group: {
            _id: "$settleStatus",
            totalOrders: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
      ],

      paymentReport: [
        {
          $group: {
            _id: "$paymentMethod",
            totalOrders: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
      ],
    },
  },
]);

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      result

      // date,
      // summary: {
      //   totalOrders,
      //   totalAmount,
      // },

      // settlementReport,
      // paymentReport,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




export const settleProviderPaymentsByDate = async (req, res) => {
  try {
    const { sprovid, date } = req.params;

    // YYYY-MM-DD
    const startDate = new Date(date);

    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    // already settled check
    const alreadySettled = await Settlement.findOne({
      sprovid,
      date,
    });

    if (alreadySettled) {
      return res.status(400).json({
        success: false,
        message: "This date already settled",
      });
    }

    // find pending orders
    const orders = await Order.find({
      sprovid,
      settleStatus: "pending",

      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "No pending orders found",
      });
    }

    const totalAmount = orders.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );

    // update orders
    const result = await Order.updateMany(
      {
        sprovid,
        settleStatus: "pending",

        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
      },
      {
        $set: {
          settleStatus: "completed",
          settleDate: new Date(),
        },
      }
    );

    // create settlement history
    await Settlement.create({
      sprovid,
      date,

      totalOrders: result.modifiedCount,
      totalAmount,

      settledBy: req.user?._id,
    });

    return res.status(200).json({
      success: true,
      message: "Settlement completed",

      data: {
        date,
        totalOrders: result.modifiedCount,
        totalAmount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




export const getSettlementHistory = async (req, res) => {
  try {
    const { sprovid } = req.params;

    const settlements = await Settlement.find({
      sprovid,
    }).sort({ date: -1 });

    return res.status(200).json({
      success: true,
      settlements,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};