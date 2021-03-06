'use strict';

var _ = require('underscore');
var compiler = require('../../src/template/compiler');
function compileTemplates(rawTemplates) {
  if (typeof rawTemplates === 'string') {
    return compiler(rawTemplates).template;
  }

  var compiledTemplates = {};
  _.each(rawTemplates, function(templateStr, name) {
    var output = compiler(templateStr);
    var template = output.template;
    template.setPartials(compiledTemplates);
    compiledTemplates[name] = template;
  });

  return compiledTemplates;
}

module.exports = {
  compileTemplates: compileTemplates
};
