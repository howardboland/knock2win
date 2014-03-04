'use strict';

describe('Directive: ngPixiGame', function () {

  // load the directive's module
  beforeEach(module('knock2winApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<ng-pixi-game></ng-pixi-game>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the ngPixiGame directive');
  }));
});
