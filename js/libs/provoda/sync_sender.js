define(function(require) {
"use strict";

var spv = require('spv');
var toTransferableStatesList = require('./Model/toTransferableStatesList')

var SyncSender = function() {
  this.sockets = {};
  this.streams_list = [];
  this.sockets_m_index ={};
};

var toTransferableNestings = function(value) {
    if (!value) {
      return value
    }

    var parsed_value

    if (value && value.each_items) {
      // creating value to pass
      var copy = spv.cloneObj({}, value)
      delete copy.each_items;
      return copy
    }

    if (value._provoda_id){
      parsed_value = value._provoda_id;
    } else if (Array.isArray(value)){

      parsed_value = new Array(value.length);
      for (var jj = 0; jj < value.length; jj++) {
        parsed_value[jj] = value[jj]._provoda_id;
      }
    } else {
      console.warn('unparsed', value);
    }
    if (typeof parsed_value == 'undefined') {
      parsed_value = null;
    }

    return parsed_value
}

SyncSender.prototype = {
  removeSyncStream: function(stream) {
    if (!this.sockets[stream.id]) {
      return;
    }
    this.sockets_m_index[stream.id] = null;
    this.sockets[stream.id] = null;
    this.streams_list = spv.findAndRemoveItem(this.streams_list, stream);
  },
  addSyncStream: function(start_md, stream) {
    this.sockets_m_index[stream.id] = {};
    this.sockets[stream.id] = stream;
    this.streams_list.push(stream);

    var struc = start_md.toSimpleStructure(this.sockets_m_index[stream.id]);
    stream.buildTree(struc);

  },
  pushNesting: function(md, nesname, value){
    //var struc;
    var parsed_value = toTransferableNestings(value)

    for (var i = 0; i < this.streams_list.length; i++) {
      var cur = this.streams_list[i];
      var index = this.sockets_m_index[cur.id];
      if (!index[md._provoda_id]){
        continue;
      }

      var struc = md.toSimpleStructure(index);
      cur.changeCollection(md._provoda_id, struc, nesname, parsed_value);

    }
  },
  pushStates: function(md, states_raw) {
  //	var struc;
    var states = toTransferableStatesList(states_raw)

    for (var i = 0; i < this.streams_list.length; i++) {
      var cur = this.streams_list[i];
      if (this.sockets_m_index[cur.id][md._provoda_id]) {

        cur.updateStates(md._provoda_id, states);
      }
    }
  }
};
return SyncSender;
});
