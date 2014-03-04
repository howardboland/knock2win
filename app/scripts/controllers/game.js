'use strict';

angular.module('knock2winApp')
  .controller('GameCtrl', function ($scope, $state) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
    $scope.message = "";
    $scope.level = 1;
    $scope.maxlevel = 4;
    $scope.select = function() 
    {
        var promise = $state.transitionTo("game.select");
    }
    $scope.next = function()
    {
        
        if ($scope.level<$scope.maxlevel)
        {
            $scope.level++;
            var promise = $state.transitionTo("game.play");
            
        } else {
            //notify - game is complete
            var promise = $state.transitionTo("game.over");
        }

    }
    $scope.restart = function()
    {
        var promise = $state.transitionTo("game.play");
    }
  });
