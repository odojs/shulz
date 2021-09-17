import util from 'util'

const ShulzMapBusy = function() {
  this.message = 'WARNING: Lock file found, is the map in use?\nDelete if recovering from a crash.'
}
util.inherits(ShulzMapBusy, Error)

const ShulzMapCorrupt = function() {
  this.message = 'WARNING: The map file appears corrupt.\nFix or remove to continue.'
}
util.inherits(ShulzMapBusy, Error)

export {
  ShulzMapBusy,
  ShulzMapCorrupt
}
