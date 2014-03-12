'use strict';

angular.module('knock2winApp')
  .controller('GameCtrl', ['$scope', '$state', function ($scope, $state) {

    $scope.bannerCounter = 0;
    $scope.banners = [{ logoURL: '/banners/logo-ee.png', clickTag: 'http://shop.ee.co.uk/lg-g2-group/pay-monthly/details/', fallback: '/banners/G2-120-450_ee.jpg' },
                     { logoURL: '/banners/logo-carphonewarehouse.png', clickTag: 'http://www.carphonewarehouse.com/mobiles/mobile-phones/LG_G2/MONTHLY?colourCode=WHITE', fallback: '/banners/G2-120-450_carphonewarehouse.jpg' },
                     { logoURL: '/banners/logo-o2.png', clickTag: 'https://www.o2.co.uk/shop/phones/lg/g2/', fallback: '/banners/G2-120-450_02.jpg' },
                     { logoURL: '/banners/logo-3.png', clickTag: 'http://www.three.co.uk/Discover/Devices/LG/G2', fallback: '/banners/G2-120-450_3.jpg'
 }];
    $scope.banner =  $scope.banners[ $scope.bannerCounter ];



    $scope.nextbanner = function()
    {
        $scope.bannerCounter = ($scope.bannerCounter + 1) % $scope.banners.length;
        $scope.banner =  $scope.banners[ $scope.bannerCounter ];
    }
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
        $scope.nextbanner()
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
        $scope.nextbanner();
    }

    $scope.ismobile = detectmob();
      console.log( $scope.ismobile );
  }]);
