var DataTypes = require("sequelize").DataTypes;
var _contract = require("./contract");

function initModels(sequelize) {
  var contract = _contract(sequelize, DataTypes);


  return {
    contract,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
