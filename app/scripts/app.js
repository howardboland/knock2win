'use strict';

angular.module('knock2winApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'ui.router'
])
  .config(['$uiViewScrollProvider', '$stateProvider', function ($uiViewScrollProvider, $stateProvider) {
    //$locationProvider.html5Mode( false );//.hashPrefix('!');

    $uiViewScrollProvider.useAnchorScroll();

    $stateProvider.state('howtoplay', {
      url: '/howtoplay',
      views: {
        'main': { 
            templateUrl: 'views/howtoplay.html'
          }
      }
    })
    .state('about', {
      url: '/about',
      views: {
        'main': { 
            templateUrl: 'views/about.html'
          }
      }
    })
    .state('prizes', {
      url: '/prizes',
      views: {
        'main': { 
            templateUrl: 'views/prizes.html'
          }
      }
    })
    .state('redemption', {
      url: '/redemption',
      views: {
        'main': { 
            templateUrl: 'views/redemption.html'
          }
      }
    })
    .state('confirmation', {
      url: '/confirmation',
      views: {
        'main': { 
            templateUrl: 'views/confirmation.html'
          }
      }
    })
    .state('tsandcs', {
      url: '/tsandcs',
      views: {
        'main': { 
            templateUrl: 'views/tsandcs.html'
          }

      }
    })
      .state('game', {
      url: '/game',              
      views: {
        'main' : {
          templateUrl: 'views/game.html',
          controller: 'GameCtrl'
        }
      }
    })
      .state('game.init', {
      url: '/init',   
      views: {
        'message' : {
          templateUrl: 'views/message-init.html'
        }
      }
    })
      .state('game.start', {
      url: '/start',   
      views: {
        'message' : {
          templateUrl: 'views/message-level-one.html'
        }
      }
    })
      .state('game.success', {
      url: '/success',   
      views: {
        'message' : {
          templateUrl: 'views/message-success.html'
        }
      }
    })
      .state('game.level', {
      url: '/level?level',   
      views: {
        'message' : {
          templateUrl: 'views/message-level.html',
        }
      }
    })
      .state('game.failed', {
      url: '/failed',   
      views: {
        'message' : {
          templateUrl: 'views/message-fail.html'
        }
      }
    })
      .state('game.ready', {
      url: '/ready',   
      views: {
        'message' : {
          templateUrl: 'views/message-ready.html'
        }
      }
    })
      .state('game.select', {
      url: '/select',   
      views: {
        'message' : {
          template: ''
        }
      }
    })
      .state('game.countdown', {
      url: '/countdown',   
      views: {
        'message' : {
          templateUrl: 'views/message-level.html'
        }
      }
    })
       .state('game.over', {
      url: '/gameover',   
      views: {
        'message' : {
          templateUrl: 'views/message-gameover.html'
        }
      }
    })
     .state('game.play', {
      url: '/play',   
      views: {
        'message' : {
          templateUrl: 'views/message-play.html'
        }
      }
    })
     .state('home', {
      url: ''
    });
  }])

.factory('dbService', ['$http', function($http) {
  return {
    postWinner: function(data) {
      return $http.post('http://www.lgknock2win.com/winners', JSON.stringify(data));
    },
  };
}])

.controller('redemptionFormCtrl', ['$scope', '$location' , 'dbService', function($scope, $location, dbService) {
    //Default Values;
    $scope.player = {location: 'uk'};

    $scope.submit = function() {
      dbService.postWinner($scope.player)
      .success(function() {
          $scope.end();
        })
      .error(function() { });
    };

    $scope.end = function(){
          $location.path('/confirmation'); // path not hash
        };
  }])

.run( function($state, $rootScope, $log, $window) {

    $rootScope.$on('$stateChangeSuccess',
      function(event, toState, toParams, fromState, fromParams) {
        $log.info(event, toState, toParams, fromState, fromParams);
           if (toState.url=="")
           {
            $state.transitionTo("game.init")
           }
            
          // transitionTo() promise will be rejected with 
          // a 'transition prevented' error
      });
    
    $rootScope.$on('$stateChangeStart',
      function(event, toState, toParams, fromState, fromParams) {
        $log.info(event, toState, toParams, fromState, fromParams);
  //        event.preventDefault(); 
      });
  });
