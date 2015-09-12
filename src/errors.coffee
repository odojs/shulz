util = require 'util'

ShulzMapBusy = ->
  @message = 'WARNING: Lock file found, is the map in use?\nDelete if recovering from a crash.'
util.inherits ShulzMapBusy, Error

ShulzMapCorrupt = ->
  @message = 'WARNING: The map file appears corrupt.\nFix or remove to continue.'
util.inherits ShulzMapBusy, Error

module.exports =
  ShulzMapBusy: ShulzMapBusy
  ShulzMapCorrupt: ShulzMapCorrupt