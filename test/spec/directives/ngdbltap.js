'use strict';

describe('Directive: ngDblTap', function () {

  // load the directive's module
  beforeEach(module('wwwknock2wincoukApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<ng-dbl-tap></ng-dbl-tap>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the ngDblTap directive');
  }));
});
