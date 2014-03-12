'use strict';

angular.module('knock2winApp')
  .controller('HowtoplayCtrl',['$scope', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
    $scope.ismobile = detectmob();
  }]);
