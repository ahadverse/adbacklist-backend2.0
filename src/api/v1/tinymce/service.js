const { default: mongoose } = require("mongoose");
const { TinyMce } = require("../models");

exports.addLinks = async ({ body }) => {
  const response = {
    code: 201,
    status: "success",
    message: "Product added successfully",
  };

  try {
    const newProduct = new TinyMce(body);
    await newProduct.save();
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.getLinksTinyMCE = async (req, res) => {
  const response = {
    code: 200,
    status: "success",
    message: "Links Found successfully",
    token: {},
  };
  response.token = await TinyMce.findOne({
    _id: "690663bf41516e1b956c2137",
  });

  res.send({ response });
};

exports.updateLinks = async (updateFields) => {
  const response = {
    code: 200,
    status: "success",
    message: "Links updated successfully",
    data: {},
  };

  try {
    const { id, ...data } = updateFields;
    const result = await TinyMce.findByIdAndUpdate(
      {
        _id: id,
      },
      data,
      {
        new: true,
      }
    );

    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};
