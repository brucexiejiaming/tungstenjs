/**
 * Hook for Virtual-Dom library to set focus for newly created elements
 *
 * @author    Matt DeGennaro <mdegennaro@wayfair.com>
 * @copyright 2015 Wayfair, LLC - All rights reserved
 */

/**
 * Hook for Virtual-Dom library to set focus for newly created elements
 *
 * @author    Matt DeGennaro <mdegennaro@wayfair.com>
 * @copyright 2015 Wayfair, LLC - All rights reserved
 */

'use strict';

import featureDetect from '../../utils/feature_detect';

var isiOS = featureDetect.isiOS();

function FocusHook() {
  if (!(this instanceof FocusHook)) {
    return new FocusHook();
  }
}

FocusHook.prototype.hook = function(node, prop, prev) {
  // Only run this hook if this wasn't on the previous tree
  // and not on iOS because it really breaks things
  if (!isiOS && !prev) {
    setTimeout(function() {
      if (document.activeElement !== node) {
        node.focus();
      }
    }, 0);
  }
};

FocusHook.prototype.type = 'FocusHook';

module.exports = FocusHook;