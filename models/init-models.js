var DataTypes = require("sequelize").DataTypes;
var _transaction_platform = require("./transaction_platform");

function initModels(sequelize) {
  var transaction_platform = _transaction_platform(sequelize, DataTypes);


  return {
    transaction_platform,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
