const { addLinks, updateLinks } = require("./service");

exports.addLinkTinyMCE = async (req, res) => {
  const { status, code, message } = await addLinks({
    body: req.body,
    ...req.body,
  });
  res.status(code).json({ code, status, message });
};

// update Medias
exports.updateLinkTinyMCE = async (req, res) => {
  const { status, code, message, token } = await updateLinks({
    ...req.params,
    ...req.body,
  });
  if (token) {
    return res.status(code).json({ code, status, message, token });
  }
  res.status(code).json({ code, status, message });
};
