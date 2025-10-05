const { default: mongoose } = require("mongoose");
const { Rainbow } = require("../models");

exports.addLinks = async ({ body }) => {
  const response = {
    code: 201,
    status: "success",
    message: "Product added successfully",
  };

  try {
    const newProduct = new Rainbow(body);
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

exports.getLinksRainbow = async (req, res) => {
  const response = {
    code: 200,
    status: "success",
    message: "Links Found successfully",
    links: {},
  };
  response.links = await Rainbow.findOne({
    _id: "668f7f80a9e744f659d792f5",
  });

  res.send({ response });
};

exports.updateLinks = async (updateFields) => {
  const response = {
    code: 200,
    status: "success",
    message: "Rainbow updated successfully",
    data: {},
  };

  try {
    const { id, ...data } = updateFields;
    const result = await Rainbow.findByIdAndUpdate(
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

