usage = """
Usage: shulz command [key] [value] file

View:
  cat                     Print entire map contents
  get key                 Print the value for key

Manipulate:
  set key value           Set key to value
  clear key               Remove key from the hashmap
  purge                   Remove all entries from the hashmap
  compact                 Remove expired hashmap contents

Options:
  -h                      Display this usage information
  -v                      Display the version number

"""

process.on 'uncaughtException', (err) ->
  console.error 'Caught exception: '
  console.error err.stack
  process.exit 1

# General purpose printing an error and usage
usage_error = (message) =>
  console.error()
  console.error "  #{message}"
  console.error()
  console.error usage
  process.exit 1

args = process.argv[2..]

return console.error usage if args.length is 0

shulz = require '../'
{ ShulzMapBusy } = require '../src/errors'

commands =
  cat: (path) ->
    object = shulz.read path
    for key, value of object
      console.log "#{key} => #{value}"

  purge: (path) ->
    map = shulz.create path
    map.close()

  compact: (path) ->
    map = shulz.open path
    map.compact()
    map.close()

  get: (key, path) ->
    # messages = shulz.read path
    # index = Math.max index, 1
    # index = Math.min index, messages.length + 1
    # messages.splice index - 1, 0, message
    # map = shulz.create path
    # for message in messages
    #   map.enmap message
    # map.close()
    # console.log "#{index}) #{message}"

  set: (key, value, path) ->
    

  clear: (key, path) ->
    

cmds =
  cat: ->
    return commands.cat args[0] if args.length is 1
    usage_error 'shulz cat requires one argument - the map path'

  get: ->
    return commands.cat args[0], args[1] if args.length is 2
    usage_error 'shulz get requires two arguments - the key to retrieve and the map path'

  set: ->
    return commands.cat args[0], args[1], args[2] if args.length is 3
    usage_error 'shulz set requires three arguments - the key to set, the value to set it to and the map path'

  purge: ->
    return commands.purge args[0] if args.length is 1
    usage_error 'shulz purge requires one argument - the map path'

  compact: ->
    return commands.compact args[0] if args.length is 1
    usage_error 'shulz compact requires one argument - the map path'

  '-h': ->
    console.log usage

  '-v': ->
    pjson = require '../package.json'
    console.log pjson.version

command = args[0]
args.shift()
try
  return cmds[command]() if cmds[command]?
catch err
  if err instanceof ShulzMapBusy
    console.error err.message
    console.error()
  else
    console.error 'Caught exception: '
    console.error err.stack
  process.exit 1
usage_error "#{command} is not a known shulz command"