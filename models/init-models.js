var DataTypes = require("sequelize").DataTypes;
var _swap_tx = require("./swap_tx");

function initModels(sequelize) {
  var swap_tx = _swap_tx(sequelize, DataTypes);


  return {
    swap_tx,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
