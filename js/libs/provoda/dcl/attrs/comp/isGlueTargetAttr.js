import glueTargets from './glueTargets'
import isNestingAddr from './isNestingAddr'
import isGlueRoot from '../../glue_rels/runtime/isGlueRoot'
import isGlueParent from '../../glue_rels/runtime/isGlueParent'

const isAscending = function(addr) {
  return isGlueRoot(addr) || isGlueParent(addr)
}

var hasGlueSourceAttr = function(addr) {
  if ((addr.zip_name != null && addr.zip_name != 'all') && isNestingAddr(addr)) {
    if (addr.result_type === 'nesting') {
      return glueTargets.zip_of_rel
    }

    if (addr.result_type === 'state') {
      return glueTargets.zip_of_attr
    }
  }

  if (addr.result_type == 'state' && addr.state.base != addr.state.path) {
    if (isNestingAddr(addr)) {
      return glueTargets.long_attr_of_rel
    }

    return glueTargets.long_attr_of_attr
  }

  if (isNestingAddr(addr) && isAscending(addr)) {
    return glueTargets.rel_of_ascendor
  }

}

export default hasGlueSourceAttr
