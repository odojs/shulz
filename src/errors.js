// Generated by CoffeeScript 1.9.2
var ShulzMapBusy, ShulzMapCorrupt, util;

util = require('util');

ShulzMapBusy = function() {
  return this.message = 'WARNING: Lock file found, is the map in use?\nDelete if recovering from a crash.';
};

util.inherits(ShulzMapBusy, Error);

ShulzMapCorrupt = function() {
  return this.message = 'WARNING: The map file appears corrupt.\nFix or remove to continue.';
};

util.inherits(ShulzMapBusy, Error);

module.exports = {
  ShulzMapBusy: ShulzMapBusy,
  ShulzMapCorrupt: ShulzMapCorrupt
};