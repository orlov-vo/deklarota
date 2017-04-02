define(function (require) {
'use strict';
var spv = require('spv');
var transportName = require('./transportName');
var initDeclaredNestings = require('../../initDeclaredNestings');
var getSPByPathTemplate = initDeclaredNestings.getSPByPathTemplate;

var RunProbes = function () {
  this.list = [];
  this.index = {};
  this.grouped = {};
};

return function run(bwlev, pathp) {
  var md = pathp.md;
  if (!md._run_probes) {
    md._run_probes = new RunProbes();
  }

  var set = md._run_probes;
  var app = bwlev.app;
  var has_changes = false;

  for (var name in md._probs) {
    if (!md._probs.hasOwnProperty(name)) {continue;}
    var cur = md._probs[name];

    if (!canCreateProbe(bwlev, pathp, cur)) {continue;}

    var key = name;

    // contains
    // get
    // add
    // remove

    if (spv.set.contains(set, key)) {continue;}

    var con = app.initChi('__probe', null, null, null, {
      path: pathp.path,
      name: cur.name,
    });

    var initial = cur.options && cur.options.initial;
    if (initial) {
      var subpage = getSPByPathTemplate(md.app, md, initial);
      con.updateNesting('current_md', subpage);
    }

    spv.set.add(set, key, con);

    set.grouped[cur.name] = set.grouped[cur.name] || [];
    set.grouped[cur.name].push(con);

    has_changes = true;
  }

  if (!has_changes) {return;}

  for (var name in set.grouped) {
    if (!set.grouped.hasOwnProperty(name)) {continue;}

    md.updateNesting(transportName(name), set.grouped[name]);
  }

};


function canCreateProbe(bwlev, pathp, dcl) {
  if (typeof dcl.steps_to_surface_limit !== 'undefined') {
    if (pathp.path.length > dcl.steps_to_surface_limit) {
      return false
    }
  }

  return true;
}

});