const { default: mongoose } = require("mongoose");
const { Transactions, User } = require("../models");

exports.addTransactionServices = async ({ body }) => {
  const response = {
    code: 201,
    status: "success",
    message: "Transaction added successfully",
  };

  try {
    const newTransaction = new Transactions(body);
    await newTransaction.save();
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.getTransactionsServices = async ({ q }) => {
  const response = {
    code: 200,
    status: "success",
    message: "User data found successfully",
    data: [],
  };

  try {
    const transactions = await Transactions.find({ email: q })
      .populate("userId")
      .select("-__v -isDelete")
      .sort({ _id: -1 });

    if (transactions == 0) {
      response.code = 404;
      response.status = "failed";
      response.message = "No User data found";
      return response;
    }
    response.data = transactions;
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again a";
    return response;
  }
};

exports.getTransactionsListServices = async ({
  q = "",
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
}) => {
  const response = {
    code: 200,
    status: "success",
    message: "Transactions fetched successfully",
    data: [],
    pagination: {},
  };

  try {
    const skip = (Number(page) - 1) * Number(limit);
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    // Build filter
    const filter = {};
    if (q) {
      filter.$or = [
        { email: { $regex: q, $options: "i" } },
        { trxId: { $regex: q, $options: "i" } },
      ];
    }

    // Count total matched documents
    const total = await Transactions.countDocuments(filter);

    // Fetch paginated transactions
    const transactions = await Transactions.find(filter)
      .populate("userId")
      .select("-__v -isDelete")
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(Number(limit));

    if (transactions.length === 0) {
      response.code = 404;
      response.status = "failed";
      response.message = "No transactions found";
      return response;
    }

    response.data = transactions;
    response.pagination = {
      total,
      page: Number(page),
      limit: Number(limit),
    };

    return response;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    response.code = 500;
    response.status = "failed";
    response.message = "An error occurred while fetching transactions.";
    return response;
  }
};
exports.getTransactionsListServicesById = async ({
  q = "",
  id = "",
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
}) => {
  const response = {
    code: 200,
    status: "success",
    message: "Transactions fetched successfully",
    data: [],
    pagination: {},
  };

  try {
    const skip = (Number(page) - 1) * Number(limit);
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    // Build filter
    const filter = { userId: id };
    if (q) {
      filter.$or = [{ trxId: { $regex: q, $options: "i" } }];
    }

    // Count total matched documents
    const total = await Transactions.countDocuments(filter);

    // Fetch paginated transactions
    const transactions = await Transactions.find(filter)
      .populate("userId")
      .select("-__v -isDelete")
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(Number(limit));

    if (transactions.length === 0) {
      response.code = 404;
      response.status = "failed";
      response.message = "No transactions found";
      return response;
    }

    response.data = transactions;
    response.pagination = {
      total,
      page: Number(page),
      limit: Number(limit),
    };

    return response;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    response.code = 500;
    response.status = "failed";
    response.message = "An error occurred while fetching transactions.";
    return response;
  }
};

exports.getTransactionsUserServices = async ({ q }) => {
  const response = {
    code: 200,
    status: "success",
    message: "User data found successfully",
    data: [],
  };

  try {
    const transactions = await Transactions.find({
      userId: mongoose.Types.ObjectId(q),
    });

    if (transactions == 0) {
      response.code = 404;
      response.status = "failed";
      response.message = "No User data found";
      return response;
    }
    response.data = transactions;
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again a";
    return response;
  }
};

// update Transactions
exports.updateTransactionServices = async ({
  id,
  credit,
  status,
  creditGiven,
}) => {
  const response = {
    code: 200,
    status: "success",
    message: "Transaction  updated successfully",
    data: {},
  };

  try {
    const transactions = await Transactions.findOne({
      _id: id,
    }).exec();
    if (!transactions) {
      response.code = 422;
      response.status = "failed";
      response.message = "No Product data found";
      return response;
    }

    const transaction = await Transactions.findByIdAndUpdate(
      id,
      { status, creditGiven },
      { new: true }
    );

    const prevUser = await User.findById(transaction?.userId).select("credit");
    const data = { credit: prevUser?.credit + Number(credit) };
    const user = await User.findByIdAndUpdate(transaction?.userId, data, {
      new: true,
    });

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.deleteTransactionServices = async ({ id }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Delete Product successfully",
  };

  try {
    const Transactions = await Transactions.findOne({
      _id: id,
      isDelete: false,
    });
    if (!Transactions) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Product data found";
      return response;
    }

    await Transactions.remove();

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.getTransactionsService = async (req, res) => {
  const response = {
    code: 200,
    status: "success",
    message: "User data found successfully",
    data: {},
  };

  const id = req.params.id;

  try {
    if (!id) {
      response.code = 404;
      response.status = "failed";
      response.message = "No User data found";
    }

    response.data.transactions = await Transactions.find({ userId: id })
      .populate("userId")
      .select("-__v -isDelete")
      .sort({ _id: -1 });

    if (response.data.transactions.length == 0) {
      response.code = 404;
      response.status = "failed";
      response.message = "No User data found";
    }

    res.send(response);
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again a";
    return response;
  }
};
