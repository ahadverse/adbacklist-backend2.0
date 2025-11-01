const { default: mongoose } = require("mongoose");
const { Links } = require("../models");

exports.addLinks = async ({ body }) => {
  const response = {
    code: 201,
    status: "success",
    message: "Product added successfully",
  };

  try {
    const newProduct = new Links(body);
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

exports.getLinks = async (req, res) => {
  const response = {
    code: 200,
    status: "success",
    message: "Links Found successfully",
    links: {},
  };

  response.links = await Links.findOne({
    _id: "668f789c5789d64f0e3a42ec",
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

  const { id, ...data } = updateFields;

  try {
    const result = await Links.findByIdAndUpdate(
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
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.getLinkService = async (req, res) => {
  const link = await Links.findOne({});
  const linkSingle = link.header;
  return linkSingle;
};
