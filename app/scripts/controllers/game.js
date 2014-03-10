'use strict';

angular.module('knock2winApp')
  .controller('GameCtrl', ['$scope', '$state', function ($scope, $state) {

    $scope.message = "";
    $scope.level = 1;
    $scope.maxlevel = 4;
    $scope.speeds = [1, .9, .85, .8, .75, .7, .6, .5, .4, .3];
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
  }]);
