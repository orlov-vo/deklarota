
var spv = require('spv')
var memorize = spv.memorize

export default memorize(function sameName(str) {
  // just store same string
  return str
})
