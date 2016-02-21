'use strict';

import _ from 'underscore';
import logger from '../../utils/logger';

const ERROR_LEVELS = {
  'EXCEPTION': 0,
  'WARNING': 1
};

let strictMode = true;
let overrides = {};

function logMessage(messageLevel, data) {
  // Reduce any error messages to the maximum allowed
  if (strictMode) {
    messageLevel = ERROR_LEVELS.EXCEPTION;
  }
  switch (messageLevel) {
    case ERROR_LEVELS.EXCEPTION:
      if (overrides.exception) {
        overrides.exception(data);
      } else {
        let error = _.map(data, (item) => {
          return JSON.stringify(item);
        });
        throw Error(error.join(' '));
      }
      break;
    case ERROR_LEVELS.WARNING:
      if (overrides.warning) {
        overrides.warning(data);
      } else {
        logger.warn.apply(logger, data);
      }
      break;
  }
}

module.exports.warn = function() {
  for (var l = arguments.length, data = Array(l), i = 0; i < l; i++) {
    data[i] = arguments[i];
  }
  logMessage(ERROR_LEVELS.WARNING, data);
};

module.exports.exception = function() {
  for (var l = arguments.length, data = Array(l), i = 0; i < l; i++) {
    data[i] = arguments[i];
  }
  logMessage(ERROR_LEVELS.EXCEPTION, data);
};

module.exports.setStrictMode = function(value) {
  strictMode = value;
};
module.exports.setOverrides = function(opts) {
  overrides = opts;
};
