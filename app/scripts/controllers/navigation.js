'use strict';

angular.module('knock2winApp')
  .controller('NavigationCtrl', ['$scope', '$state', function ($scope, $state) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
    $scope.activestate = '';
    $scope.$on('$stateChangeStart',
        function(event, toState, toParams, fromState, fromParams) {
          $scope.activestate= ( toState.name )
    });

  }]);
