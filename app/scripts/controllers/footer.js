'use strict';

angular.module('knock2winApp')
  .controller('FooterCtrl',['$scope', '$rootScope', function ($scope, $rootScope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
    $scope.ismobile = detectmob();
    $scope.isMuted = false;
    $rootScope.$broadcast("toggle-mute", {data: $scope.isMuted});

    $scope.toggleMute = function()
    {
        $scope.isMuted = !$scope.isMuted;
        $rootScope.$broadcast("toggle-mute", {data: $scope.isMuted});

    }
  }]);
