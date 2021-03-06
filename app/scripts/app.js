'use strict';

angular.module('knock2winApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'ui.router',
  'hmTouchEvents'

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
          templateUrl: 'views/message-start-game.html'
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
      /* --> What's this?
      .state('game.level', {
      url: '/level?level',
      views: {
        'message' : {
          templateUrl: 'views/message-counter.html',
        }
      }
    }) */
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
          templateUrl: 'views/message-counter.html'
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

.factory('dbService', ['$http', '$q', function($http, $q) {
  return {
    postWinner: function(data) {

      var deferred = $q.defer();
      
      $http.post('http://www.knock2win.co.uk/winners', JSON.stringify(data))
      .success(function( data, status, headers, config ) {
         deferred.resolve( data );
      })
      .error(function( data, status, headers, config ) { 
        deferred.reject(status);
      });
      return deferred.promise;
    }
  };
}])

.controller('redemptionFormCtrl', ['$scope', '$location' , 'dbService', function($scope, $location, dbService) {
    //Default Values;
    $scope.player = {location: 'uk'};
    $scope.loading = false;

    
    $scope.submit = function() {
      $scope.loading = true;

      // Using promise methodology
      var promise = dbService.postWinner($scope.player)
        promise.then( function( data ) {
        console.log( "Success" );
        $scope.loading = false;
        $scope.end();
      }, function(status) {
        console.log("Status is: "+ status );
        $scope.loading = false;
      });


    };

    $scope.end = function(){
          $location.path('/confirmation'); // path not hash
        };
  }])

.run(['$state', '$rootScope', '$log', '$window', function($state, $rootScope, $log, $window) {
  $rootScope.$on('$stateChangeSuccess',
    function(event, toState, toParams, fromState, fromParams) {

      //we need to tell the html templates whether or not we're in a game state (and therefore, a non-scrollable page)
      $rootScope.game = $state.includes('game');

      // $log.info(event, toState, toParams, fromState, fromParams);
      if (toState.url === '')
      {
        $state.transitionTo('game.init');
      }

        //access control to redemption is only allowed after completing game otherwise redirect to home
      if ((toState.name === 'redemption' && fromState.name!=='game.over') || (toState.name === 'confirmation' && fromState.name!=='redemption'))
      {
        //go to default state
        $state.transitionTo('game.init');

      }
    });

  $rootScope.$on('$stateChangeStart',
    function(event, toState, toParams, fromState, fromParams) {


       // $log.info(event, toState, toParams, fromState, fromParams);
  //        event.preventDefault();
  });
}]);
