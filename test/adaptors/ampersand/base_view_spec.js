'use strict';

var AmpersandAdaptor = require('../../../adaptors/ampersand');
var BaseView = AmpersandAdaptor.View;
var Ampersand = AmpersandAdaptor.Ampersand;
var tungsten = require('../../../src/tungsten');
var _ = require('underscore');
var logger = require('../../../src/utils/logger');

describe('base_view.js public api', function() {
  describe('extend', function() {
    it('should be a function', function() {
      expect(BaseView.extend).to.be.a('function');
    });
    it('should accept one argument', function() {
      expect(BaseView.extend).to.have.length(1);
    });
    it('should be different than Ampersand\'s', function() {
      expect(BaseView.extend).not.to.equal(Ampersand.View.extend);
    });
    it('should validate the childView array', function() {
      var validate = require('../../../adaptors/shared/validate');
      spyOn(validate, 'childViews');
      var data = {
        childViews: {}
      };
      BaseView.extend(data);
      jasmineExpect(validate.childViews).toHaveBeenCalledWith(data.childViews);
    });
    /* develblock:start */
    it('should prevent initialize from being overwritten', function() {
      spyOn(logger, 'warn');
      spyOn(BaseView.prototype, 'initialize');
      spyOn(BaseView.prototype, 'render');
      spyOn(BaseView.prototype, 'delegateEvents');
      spyOn(BaseView.prototype, 'undelegateEvents');
      var initFn = jasmine.createSpy('initFn');
      var renderFn = jasmine.createSpy('renderFn');
      var delegateFn = jasmine.createSpy('delegateFn');
      var undelegateFn = jasmine.createSpy('undelegateFn');
      var testFn = function() {};
      var TestModel = BaseView.extend({
        initialize: initFn,
        render: renderFn,
        delegateEvents: delegateFn,
        undelegateEvents: undelegateFn,
        test: testFn
      });
      expect(TestModel.prototype.initialize).not.to.equal(initFn);
      expect(TestModel.prototype.test).to.equal(testFn);
      jasmineExpect(logger.warn).toHaveBeenCalled();
      expect(logger.warn.calls.count()).to.equal(4);
      expect(logger.warn.calls.argsFor(0)[0]).to.contain('View.initialize may not be overridden');
      expect(logger.warn.calls.argsFor(1)[0]).to.contain('View.render may not be overridden');
      expect(logger.warn.calls.argsFor(2)[0]).to.contain('View.delegateEvents may not be overridden');
      expect(logger.warn.calls.argsFor(3)[0]).to.contain('View.undelegateEvents may not be overridden');

      var args = {};
      TestModel.prototype.initialize(args);
      jasmineExpect(BaseView.prototype.initialize).toHaveBeenCalledWith(args);
      jasmineExpect(initFn).toHaveBeenCalledWith(args);

      TestModel.prototype.render(args);
      jasmineExpect(BaseView.prototype.render).toHaveBeenCalledWith(args);
      jasmineExpect(renderFn).toHaveBeenCalledWith(args);

      TestModel.prototype.delegateEvents(args);
      jasmineExpect(BaseView.prototype.delegateEvents).toHaveBeenCalledWith(args);
      jasmineExpect(delegateFn).toHaveBeenCalledWith(args);

      TestModel.prototype.undelegateEvents(args);
      jasmineExpect(BaseView.prototype.undelegateEvents).toHaveBeenCalledWith(args);
      jasmineExpect(undelegateFn).toHaveBeenCalledWith(args);
    });
    it('should error with debugName if available', function() {
      spyOn(logger, 'warn');
      var initFn = function() {};
      BaseView.extend({
        initialize: initFn,
        debugName: 'FOOBAR'
      });
      jasmineExpect(logger.warn).toHaveBeenCalled();
      expect(logger.warn.calls.argsFor(0)[0]).to.contain(' for view "FOOBAR"');
    });
    /* develblock:end */
  });

  describe('tungstenView', function() {
    it('should be set', function() {
      expect(BaseView.tungstenView).to.be.true;
    });
  });

  describe('constructor', function() {
    it('should short circuit if el is not set', function() {
      var view = new BaseView({
        el: null
      });
      expect(view.options).to.be.undefined;
    });
  });
});

describe('base_view.js constructed api', function() {
  describe('tungstenViewInstance', function() {
    it('should be set', function() {
      expect(BaseView.prototype.tungstenViewInstance).to.be.true;
    });
  });
  describe('initializeRenderListener', function() {
    it('should be a function', function() {
      expect(BaseView.prototype.initializeRenderListener).to.be.a('function');
      expect(BaseView.prototype.initializeRenderListener).to.have.length(1);
    });
    it('should bind to render for top level views', function(done) {
      spyOn(_, 'bind').and.callFake(function(fn) {
        return fn;
      });
      var ctx = {
        render: jasmine.createSpy('render'),
        listenTo: jasmine.createSpy('listenTo')
      };
      var dataItem = {
        tungstenModel: true
      };
      BaseView.prototype.initializeRenderListener.call(ctx, dataItem);
      jasmineExpect(_.bind).toHaveBeenCalledWith(ctx.render, ctx);
      jasmineExpect(ctx.listenTo).toHaveBeenCalled();
      var args = ctx.listenTo.calls.mostRecent().args;
      expect(args[0]).to.equal(dataItem);

      // Invoke listened to function
      args[2]();
      setTimeout(function() {
        jasmineExpect(ctx.render).toHaveBeenCalled();
        done();
      }, 100);
    });
    it('should bind to bubble for non-top level views with detached models', function(done) {
      var ctx = {
        parentView: {
          model: {
            trigger: jasmine.createSpy('parentModelTrigger')
          }
        },
        render: function() {},
        listenTo: jasmine.createSpy('listenTo')
      };
      var dataItem = {
        tungstenModel: true
      };
      BaseView.prototype.initializeRenderListener.call(ctx, dataItem);
      jasmineExpect(ctx.listenTo).toHaveBeenCalled();
      var args = ctx.listenTo.calls.mostRecent().args;
      expect(args[0]).to.equal(dataItem);

      // Invoke listened to function
      args[2]();
      setTimeout(function() {
        jasmineExpect(ctx.parentView.model.trigger).toHaveBeenCalledWith('render');
        done();
      }, 100);
    });
    it('should not bind if the model has a parent', function() {
      var ctx = {
        parentView: {},
        listenTo: jasmine.createSpy('listenTo')
      };
      var dataItem = {
        parentProp: 'model',
        tungstenModel: true
      };
      BaseView.prototype.initializeRenderListener.call(ctx, dataItem);
      jasmineExpect(ctx.listenTo).not.toHaveBeenCalled();
    });
    it('should not bind if the model is in a collection', function() {
      var ctx = {
        parentView: {},
        listenTo: jasmine.createSpy('listenTo')
      };
      var dataItem = {
        collection: [],
        tungstenModel: true
      };
      BaseView.prototype.initializeRenderListener.call(ctx, dataItem);
      jasmineExpect(ctx.listenTo).not.toHaveBeenCalled();
    });
  });
  describe('postInitialize', function() {
    it('should be a function', function() {
      expect(BaseView.prototype.postInitialize).to.be.a('function');
      expect(BaseView.prototype.postInitialize).to.have.length(0);
    });
  });
  describe('validateVdom', function() {
    it('should be a function', function() {
      expect(BaseView.prototype.validateVdom).to.be.a('function');
      expect(BaseView.prototype.validateVdom).to.have.length(0);
    });
  });
  describe('serialize', function() {
    it('should be a function', function() {
      expect(BaseView.prototype.serialize).to.be.a('function');
      expect(BaseView.prototype.serialize).to.have.length(0);
    });
  });
  describe('delegateEvents', function() {
    it('should be a function', function() {
      expect(BaseView.prototype.delegateEvents).to.be.a('function');
      expect(BaseView.prototype.delegateEvents).to.have.length(1);
    });
  });
  describe('undelegateEvents', function() {
    it('should be a function', function() {
      expect(BaseView.prototype.undelegateEvents).to.be.a('function');
      expect(BaseView.prototype.undelegateEvents).to.have.length(0);
    });
  });
  describe('render', function() {
    it('should be a function', function() {
      expect(BaseView.prototype.render).to.be.a('function');
      expect(BaseView.prototype.render).to.have.length(0);
    });
    it('should do nothing without a template', function() {
      var view = {};
      expect(BaseView.prototype.render.call(view)).to.equal(undefined);
    });
    it('should invoke rendering', function() {
      var newVdom = {};
      var serialized = {};
      var vtree = {
        recycle: jasmine.createSpy('recycle')
      };
      var view = {
        compiledTemplate: {
          toVdom: jasmine.createSpy('toVdom').and.returnValue(newVdom)
        },
        vtree: vtree,
        serialize: jasmine.createSpy('serialize').and.returnValue(serialized),
        trigger: jasmine.createSpy('trigger'),
        postRender: jasmine.createSpy('postRender')
      };
      expect(BaseView.prototype.render.call(view)).to.equal(view);
      jasmineExpect(view.serialize).toHaveBeenCalled();
      jasmineExpect(view.compiledTemplate.toVdom).toHaveBeenCalledWith(serialized);
      jasmineExpect(vtree.recycle).toHaveBeenCalled();
      jasmineExpect(view.trigger).toHaveBeenCalledWith('rendered');
      jasmineExpect(view.postRender).toHaveBeenCalled();
      spyOn(tungsten, 'updateTree');
    });
    it('should use passed context over serialize if passed', function() {
      var newVdom = {};
      var serialized = {};
      var context = {};
      var vtree = {
        recycle: jasmine.createSpy('recycle')
      };
      var view = {
        compiledTemplate: {
          toVdom: jasmine.createSpy('toVdom').and.returnValue(newVdom)
        },
        vtree: vtree,
        context: context,
        serialize: jasmine.createSpy('serialize').and.returnValue(serialized),
        trigger: jasmine.createSpy('trigger'),
        postRender: jasmine.createSpy('postRender')
      };
      expect(BaseView.prototype.render.call(view)).to.equal(view);
      jasmineExpect(view.serialize).not.toHaveBeenCalled();
      jasmineExpect(view.compiledTemplate.toVdom).toHaveBeenCalledWith(context);
      jasmineExpect(vtree.recycle).toHaveBeenCalled();
      jasmineExpect(view.trigger).toHaveBeenCalledWith('rendered');
      jasmineExpect(view.postRender).toHaveBeenCalled();
      // Context should be cleared for next render
      expect(view.context).to.be.null;
      spyOn(tungsten, 'updateTree');
    });
    it('should create an initial vtree if one is not passed', function() {
      var newVdom = {};
      var serialized = {};
      var vtree = {
        recycle: jasmine.createSpy('recycle')
      };
      var view = {
        compiledTemplate: {
          toVdom: jasmine.createSpy('toVdom').and.callFake(function(data, firstRender) {
            if (firstRender) {
              return vtree;
            } else {
              return newVdom;
            }
          })
        },
        serialize: jasmine.createSpy('serialize').and.returnValue(serialized),
        trigger: jasmine.createSpy('trigger'),
        postRender: jasmine.createSpy('postRender')
      };
      expect(BaseView.prototype.render.call(view)).to.equal(view);
      jasmineExpect(view.serialize).toHaveBeenCalled();
      jasmineExpect(view.compiledTemplate.toVdom).toHaveBeenCalledWith(serialized, true);
      jasmineExpect(view.compiledTemplate.toVdom).toHaveBeenCalledWith(serialized);
      jasmineExpect(vtree.recycle).toHaveBeenCalled();
      jasmineExpect(view.trigger).toHaveBeenCalledWith('rendered');
      jasmineExpect(view.postRender).toHaveBeenCalled();
      spyOn(tungsten, 'updateTree');
    });
  });
  describe('postRender', function() {
    it('should be a function', function() {
      expect(BaseView.prototype.postRender).to.be.a('function');
      expect(BaseView.prototype.postRender).to.have.length(0);
    });
  });
  describe('update', function() {
    it('should be a function', function() {
      expect(BaseView.prototype.update).to.be.a('function');
      expect(BaseView.prototype.update).to.have.length(1);
    });
    it('should always call render', function() {
      var view = {
        render: jasmine.createSpy('render'),
        model: {}
      };
      BaseView.prototype.update.call(view, view.model);
      jasmineExpect(view.render).toHaveBeenCalled();
    });
    it('should change listeners if model is different', function() {
      var oldModel = {};
      var newModel = {};
      var view = {
        initializeRenderListener: jasmine.createSpy('initializeRenderListener'),
        stopListening: jasmine.createSpy('stopListening'),
        render: jasmine.createSpy('render'),
        model: oldModel
      };
      BaseView.prototype.update.call(view, newModel);
      jasmineExpect(view.stopListening).toHaveBeenCalledWith(oldModel);
      jasmineExpect(view.initializeRenderListener).toHaveBeenCalledWith(newModel);
      jasmineExpect(view.render).toHaveBeenCalled();
      expect(view.model).to.equal(newModel);
      expect(view.model).not.to.equal(oldModel);
    });
  });
  describe('getChildViews', function() {
    it('should be a function', function() {
      expect(BaseView.prototype.getChildViews).to.be.a('function');
      expect(BaseView.prototype.getChildViews).to.have.length(0);
    });
  });
  describe('attachChildViews', function() {
    it('should be a function', function() {
      expect(BaseView.prototype.attachChildViews).to.be.a('function');
      expect(BaseView.prototype.attachChildViews).to.have.length(0);
    });
  });
  describe('destroy', function() {
    it('should be a function', function() {
      expect(BaseView.prototype.destroy).to.be.a('function');
      expect(BaseView.prototype.destroy).to.have.length(0);
    });
    it('should break down the view', function() {
      var childView = {
        destroy: jasmine.createSpy('childDestroy')
      };
      var view = {
        debouncer: {},
        stopListening: jasmine.createSpy('stopListening'),
        undelegateEvents: jasmine.createSpy('undelegateEvents'),
        getChildViews: jasmine.createSpy('getChildViews').and.returnValue([childView])
      };
      spyOn(global, 'clearTimeout');
      BaseView.prototype.destroy.call(view);
      jasmineExpect(global.clearTimeout).toHaveBeenCalledWith(view.debouncer);
      jasmineExpect(view.stopListening).toHaveBeenCalled();
      jasmineExpect(view.undelegateEvents).toHaveBeenCalled();
      jasmineExpect(view.getChildViews).toHaveBeenCalled();
      jasmineExpect(childView.destroy).toHaveBeenCalled();
    });
  });

  /* develblock:start */

  // Debug methods:
  describe('initDebug', function() {
    it('should be a function', function() {
      expect(BaseView.prototype.initDebug).to.be.a('function');
      expect(BaseView.prototype.initDebug).to.have.length(0);
    });
  });
  describe('getFunctions', function() {
    it('should be a function', function() {
      expect(BaseView.prototype.getFunctions).to.be.a('function');
      expect(BaseView.prototype.getFunctions).to.have.length(2);
    });
  });
  describe('getState', function() {
    it('should be a function', function() {
      expect(BaseView.prototype.getState).to.be.a('function');
      expect(BaseView.prototype.getState).to.have.length(0);
    });
  });
  describe('setState', function() {
    it('should be a function', function() {
      expect(BaseView.prototype.setState).to.be.a('function');
      expect(BaseView.prototype.setState).to.have.length(1);
    });
  });
  describe('getEvents', function() {
    it('should be a function', function() {
      expect(BaseView.prototype.getEvents).to.be.a('function');
      expect(BaseView.prototype.getEvents).to.have.length(0);
    });
  });
  describe('getVdomTemplate', function() {
    it('should be a function', function() {
      expect(BaseView.prototype.getVdomTemplate).to.be.a('function');
      expect(BaseView.prototype.getVdomTemplate).to.have.length(0);
    });
  });
  describe('getTemplateDiff', function() {
    it('should be a function', function() {
      expect(BaseView.prototype.getTemplateDiff).to.be.a('function');
      expect(BaseView.prototype.getTemplateDiff).to.have.length(0);
    });
  });
  describe('getChildren', function() {
    it('should be a function', function() {
      expect(BaseView.prototype.getChildren).to.be.a('function');
      expect(BaseView.prototype.getChildren).to.have.length(0);
    });
  });
  describe('getDebugName', function() {
    it('should be a function', function() {
      expect(BaseView.prototype.getDebugName).to.be.a('function');
      expect(BaseView.prototype.getDebugName).to.have.length(0);
    });
  });
  /* develblock:end */
});

/**
 * Some unit tests modified from ampersand-view and backbone
 *
 *    @license MIT
 *    Copyright � 2014 &yet, LLC and AmpersandJS contributors
 *
 *    @author Jeremy Ashkenas, @license MIT
 *    Copyright (c) 2010-2015 Jeremy Ashkenas, DocumentCloud
 *    https://github.com/AmpersandJS/ampersand-view/blob/master/test/main.js
 *
 *    Permission is hereby granted, free of charge, to any person obtaining a
 *    copy of this software and associated documentation files (the
 *    "Software"), to deal in the Software without restriction, including
 *    without limitation the rights to use, copy, modify, merge, publish,
 *    distribute, sublicense, and/or sell copies of the Software, and to
 *    permit persons to whom the Software is furnished to do so, subject to
 *    the following conditions:
 *    The above copyright notice and this permission notice shall be included
 *    in all copies or substantial portions of the Software.*
 *    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 *    OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 *    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 *    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 *    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 *    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 *    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

describe('base_view.js ampersand functionality', function() {
  var view;
  beforeEach(function() {
    view = new BaseView({
      el: document.createElement('div'),
      className: 'test-view',
      other: 'non-special-option'
    });
  });
  afterEach(function() {
    view = undefined;
  });
  it('should render when called with dynamic initialize', function() {
    var template = {
      toVdom: function() {},
      attachView: function() {}
    };
    var spy = jasmine.createSpy('spy');
    var RenderStubBaseView = BaseView.extend({
      render: spy
    });
    view = new RenderStubBaseView({
      el: document.createElement('div'),
      template: template,
      vtree: {},
      dynamicInitialize: true
    });
    jasmineExpect(spy).toHaveBeenCalled();
  });
  it('should not render when deferRender is set', function(done) {
    var template = {
      toVdom: function() {},
      attachView: function() {}
    };
    var spy = jasmine.createSpy('spy');
    var RenderStubBaseView = BaseView.extend({
      render: spy
    });
    view = new RenderStubBaseView({
      el: document.createElement('div'),
      template: template,
      deferRender: true
    });
    setTimeout(function() {
      jasmineExpect(spy).not.toHaveBeenCalled();
      done();
    }, 1);
  });
  it('should set context', function() {
    var context = {};
    view = new BaseView({
      el: document.createElement('div'),
      context: context
    });
    expect(view.context).to.equal(context);
  });
  it('should set vtree', function() {
    var vtree = {};
    view = new BaseView({
      el: document.createElement('div'),
      vtree: vtree
    });
    expect(view.vtree).to.equal(vtree);
  });
  it('should set parentView', function() {
    var parentView = {};
    view = new BaseView({
      el: document.createElement('div'),
      parentView: parentView
    });
    expect(view.parentView).to.equal(parentView);
  });
  it('should delegateEvents', function() {
    spyOn(tungsten, 'bindEvent');
    var view = new BaseView({el: document.createElement('div')});
    view.handleClick = function() {};
    var events = {'click': 'handleClick'};

    view.delegateEvents(events);
    // delegateEvents fn uses a 1ms setTimeout
    jasmineExpect(tungsten.bindEvent).toHaveBeenCalledWith(view.el, 'click', '', jasmine.any(Function), undefined);
  });
  it('should undelegateEvents', function() {
    spyOn(tungsten, 'unbindEvent');
    var view = new BaseView({el: document.createElement('div')});
    view.handleClick = function() {};
    var events = {'click': 'handleClick'};
    view.delegateEvents(events);
    view.undelegateEvents();
    // delegateEvents fn uses a 1ms setTimeout
    jasmineExpect(tungsten.unbindEvent).toHaveBeenCalled();
  });
});