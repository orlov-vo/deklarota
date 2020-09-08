
import spv from '../../spv'
import definedAttrs from '../Model/definedAttrs'
import AttrsCollector from '../StatesEmitter/AttrsCollector'
import { getRootRelMentions } from '../dcl/nest_compx/mentionsCandidates'
import RootLev from '../bwlev/RootLev'
import BrowseLevel from '../bwlev/BrowseLevel'
import globalSkeleton from './globalSkeleton'

function makePath(parent_path, current_name) {
  var used_name = [current_name || 'unknown']
  if (!parent_path) {
    return used_name
  }

  return parent_path.concat(used_name)
}

function mark(Constr, RootConstr, parent_path) {
  RootConstr.hierarchy_counter = RootConstr.hierarchy_counter || 0

  var self = Constr.prototype

  if (Constr == RootConstr) {
    self.__global_skeleton = new globalSkeleton.GlobalSkeleton()
  }

  self.hierarchy_num = RootConstr.hierarchy_counter++

  self._all_chi = {}

  var all = {}

  spv.cloneObj(all, self._chi)
  spv.cloneObj(all, self._chi_sub_pager)
  spv.cloneObj(all, self._chi_sub_pages)
  spv.cloneObj(all, self._chi_sub_pages_side)
  spv.cloneObj(all, self._chi_nest)
  spv.cloneObj(all, self._chi_nest_rqc)

  for (var prop in all) {
    var cur = all[prop]
    if (!cur) {
      self._all_chi[prop] = null
      continue
    }

    var hierarchy_path = makePath(parent_path, cur.prototype.hierarchy_name)

    var item = spv.inh(all[prop], {
      skip_code_path: true
    }, {
      pconstr_id: self.constr_id,
      _parent_constr: Constr,
      _root_constr: RootConstr,
      hierarchy_path: hierarchy_path,
      hierarchy_path_string: hierarchy_path.join('  ')
    })

    self._all_chi[prop] = mark(item, RootConstr, hierarchy_path)
  }

  if (Constr == RootConstr) {
    if (self.zero_map_level) {
      self.start_page = self
    } else {
      var start_page = self._all_chi['chi-start__page']
      self.start_page = (start_page && start_page.prototype) || self
    }

    var __BWLev = spv.inh(RootLev, {}, self.BWLev || {})
    __BWLev.hierarchy_counter = RootConstr.hierarchy_counter++

    self.__BWLev = mark(__BWLev, RootConstr)

    self.CBWL = mark(BrowseLevel, RootConstr)
  }

  self._attrs_collector = new AttrsCollector(definedAttrs(self))

  self.__global_skeleton = RootConstr.prototype.__global_skeleton
  globalSkeleton.addModel(self.__global_skeleton, self)


  if (Constr == RootConstr) {
    console.log(getAllRootMentions(self))
    globalSkeleton.complete(self.__global_skeleton)
  }
  return Constr
}

function getAllRootMentions(model) {
  var full_list = []
  full_list.push(...getRootRelMentions(model))
  for (var chi in model._all_chi) {
    if (!model._all_chi.hasOwnProperty(chi) || model._all_chi[chi] == null) {
      continue
    }
    full_list.push(...getAllRootMentions(model._all_chi[chi].prototype))
  }

  if (!full_list.length) {
    return full_list
  }

  var result = new Map()
  for (var i = 0; i < full_list.length; i++) {
    var cur = full_list[i]
    var key = cur.meta_relation
    if (result.has(key)) {
      continue
    }

    result.set(key, cur)
  }

  return [...result.values()]
}

export default mark
