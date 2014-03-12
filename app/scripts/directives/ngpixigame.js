'use strict';
// Game using Pixi rendering engine for fast animation (access to webgl) and Tween
// Pixi docs: http://www.goodboydigital.com/pixijs/docs/
// Tween (deepdown penner's): https://github.com/sole/tween.js

//Need to singleton
var stage = new PIXI.Stage(0xdddddd, true);
stage.setInteractive(true);
        // helper function to select renderer

var renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, null, true /* transparent */, false /* antialias */);
renderer.view.style.display = 'block';


angular.module('knock2winApp')
.directive('ngPixiGame', ['$log', '$window', '$state', function ( $log, $window, $state) {
  return {
    restrict: 'EA',
    link: function postLink(scope, element, attrs) {

    //$state.transitionTo('game');
    //lets listen to some state changes
      scope.$on('$stateChangeSuccess',
        function(event, toState, toParams, fromState, fromParams) {
          stateCompleteHandler(fromState.name, toState.name);
        });
      scope.$on('$stateChangeStart',
        function(event, toState, toParams, fromState, fromParams) {
          stateStartHandler(fromState.name, toState.name);
        });



      // Configuration
      var hasInitiated = false;
      // HB : representation of deck
      var cardArray =  ['♠A','♦A','♣A','♥A','♠2','♦2','♣3','♥3',
      '♠4','♦4','♣5','♥5','♦6','♠6','♣7','♥7',
      '♠8','♦8','♣9','♥9','♠10','♦10','♣J','♥J',
      '♠Q','♦Q','♠K','♥K'];

      var cardArrayVisible = [];
      var ace = [];

      // Card dimension
      var CARD_SCALE  = .5;
      var CARD_HEIGHT = 1070 * CARD_SCALE;
      var CARD_WIDTH = 600 * CARD_SCALE;

      // Easing method when shuffling cards
      var SHUFFLE_EASE = TWEEN.Easing.Quadratic.Out;

      // How many cards to show at any point
      // (looks odd for two cards: better is 1 for two cards only and then 3 for three)
      var VISIBLE_CARDS = 3; //+1 Sprites for the animation
      var cardsOnLevel = 0;

      // Global variable for changing the entire speed
      var SPEED_MULTIPLIER = 1;
      // Animation timing in miliseconds
      var SHUFFLE_SPEED = 600 * SPEED_MULTIPLIER;
      var PAUSE_BETWEEN_SHUFFLES = 600 * SPEED_MULTIPLIER;

      var VIEWING_TIME = 5000 * SPEED_MULTIPLIER;

      var ONE_SECOND = 1000; //* SPEED_MULTIPLIER
      var animation_timer = null;
      var start_game_timer = null;
      var count_down_timer = null;
      // Data holders for cards, depth and textures
      var cards = [];
      var cardTextures = [];
      var cardDepths = [];

      // Pixi collection objects for display objects used to hold decks and background container
      var container = new PIXI.DisplayObjectContainer();
      var deck = new PIXI.DisplayObjectContainer();

      // Simple polygon (webgl) to be filled and used
      var cover = new PIXI.Graphics();

      // Phone graphic to sit in foreground
      var phone = new PIXI.Graphics();

      // not sure
      var shuffleTweens = [];
      var shuffleInterval;
      var selection = [];
      // Count down from
      var COUNTER_START = 3;
      var counter = COUNTER_START;

      var sound_shuffle = null;
      var sound_success = null;
      var sound_failed = null;
      var sound_countdown = null;



      var cardsPerRow = 0;
      var cardsPerCol = 0;
      var totalCards = 0;

      var hard_refresh = true;

      // Start up
      $window.removeEventListener('resize', onResize);
      $window.addEventListener('resize', onResize, false);
      // Pixi stage (root of display tree), setting bgcolor (not sure what true is)

      // add render view to DOM (element)
      element.append(renderer.view);

      //Load sprite sheet assets
      var assetURISpritesheet = 'images/cardsprite.png';
      var assetURIPhone = 'images/lg-phone.png';

      var otherCssImagesToCache = ['images/social_icons.png','images/loadinfo-net.gif', 'images/logo-normal-grey-interaction.png','images/logo-normal-white.png', 'images/logo-normal.png', 'images/orientation-change.png'];
      var assetsToLoad = [assetURISpritesheet, assetURIPhone].concat( otherCssImagesToCache );
      


      var loader = new PIXI.AssetLoader(assetsToLoad);
      loader.addEventListener('onComplete', onAssetsLoaded);
      loader.addEventListener('onProgress', onAssetsProgress);
      //loader.onComplete = onAssetsLoaded;
      //no sound for mobile
      if (detectmob())
      {
          loader.load();
      
          
      } else
      {
          element.on("onAudioLoaded", function( e )
          {

            console.log("Got it! Audio is ready to play");
            //then load assets
            loader.load();
          });
          loadAudio();    
      }
      
      

      
      

      //Methods
      function stateStartHandler( fromStateName, toStateName )
      {
        // console.log( fromStateName +' --> '+ toStateName);
        switch (toStateName)
        {
          case 'game.init':
            if (hasInitiated)
            {
              init();
            }
            break;
          case 'game.start':
            clean();
            break;
          case 'game.play':
            break;
        }
        if (toStateName.indexOf('game')===-1 && fromStateName.indexOf('game')!==-1)
        {
          // console.log('********* exiting game view - requires clean up');
          // We don't want to have pixi renderes all over the place
          // destroy
          clean();
          for (var i = stage.children.length - 1; i >= 0; i--) {
            stage.removeChild(stage.children[i]);
          }
          // console.log( element );
        }
      }
      function stateCompleteHandler( fromStateName, toStateName )
      {
        //console.log( fromStateName +' --> '+ toStateName);
        // route
        // game.init -> game.start -> game.play -> game.ready -> game.countdown -> game.select -> game.failed or game.success -> game.play or game.gameover
        switch (toStateName)
        {
          case 'game.init':
            break;
          case 'game.start':

            if (fromStateName!=='game.init')
            {
                if (hard_refresh)
                {
                  $window.location = "/";

                }
            } 
            firstStart();
            break;
          case 'game.play':
            if (fromStateName==='game.start' || fromStateName==='game.play' || fromStateName==='game.success' || fromStateName==='game.failed')
            {
              clean();
              restart();

            } else {
              // User entered from none valid point - we can either restart the game completely (hard-refresh)
              if (hard_refresh)
              {
                $window.location = "/";

              } else 
              {
                clean();
                coverDown();
                restart();
              }
                        //$state.transitionTo('game.play');
            }
            break;
          case 'game.ready':
            if (fromStateName!=='game.countdown')
            {
                if (hard_refresh)
                {
                  $window.location = "/";

                }
            } 

            readyToSelect();
            break;
          case 'game.select':
          if (fromStateName!=='game.ready')
            {
                if (hard_refresh)
                {
                  $window.location = "/";

                }
            } 
            pick();
            //window.requestTimeout(pick, 10);
            break;
          case 'game.countdown':
             if (fromStateName!=='game.play')
              {
                  if (hard_refresh)
                  {
                    $window.location = "/";

                  }
              }  
              gameCountDown();
            break;
          case 'game.level':
            if (fromStateName!=='game.select')
            {
                if (hard_refresh)
                {
                  $window.location = "/";

                }
            } 
            changeLevel( scope.level );
            break;
          case 'game.over':
            if (fromStateName!=='game.select')
              {
                  if (hard_refresh)
                  {
                    $window.location = "/";

                  } 
              } 
            gameover();
            break;
          case 'game.failed':
            //  clean();
            if (fromStateName!=='game.select')
            {
                if (hard_refresh)
                {
                 $window.location = "/";

                } else 
                {
                 $state.transitionTo('game.init');

                }
            } 
            break;
          case 'game.success':
           //   clean();
            if (fromStateName!=='game.select')
            {
              if (hard_refresh)
                {
                  $window.location = "/";

                } else 
                {
                  $state.transitionTo('game.init');

                }
            }
            break;
        }
      }
        // Called when window resize event triggers in order to resize canvas
      function onResize()
      {
        renderer.resize(window.innerWidth, window.innerHeight);
        container.x = renderer.width/2;
        container.y = renderer.height/2;
        // sm 750px   md 970px   lg 1170px
        // console.log(window.innerWidth+'x'+ window.innerHeight);
        // console.log(renderer.width +'/'+ 1080+','+ renderer.height +'/'+ 1920);
        var scalefit = Math.min( renderer.width / 1080, renderer.height / 1920 ); //TODO: discuss with nick the real dimension
        scalefit = Math.min(1, scalefit); //scale cannot exeed 1
        if (renderer.width>1080)
        {
          scalefit = .5;
        } else if (renderer.width<=1080 && renderer.width>=360)
        {
          //lg sample
          scalefit = .45;
        } else {
          scalefit = .35;
        }
        if (renderer.height<519)
        {
          scalefit = .35;
        }
        if (renderer.height<360)
        {
          scalefit = .25;
        }
        if (renderer.height<330)
        {
          scalefit = .20;
        }


        container.scale = new PIXI.Point( scalefit, scalefit);
        cover.width = window.innerWidth;
        cover.height = window.innerHeight;
        cover.scale = new PIXI.Point(4000, 4000);
        animate();


           // update the stage
          //stage.update()
      }

      // After card assets have been loaded
      // Add container to stage and position in center
      // Add deck to container and position in center (based on expected cards)
      // Create an array of card textures and render these
      // Make sprite from textures and add to cards array
      // position and scale each card equally on left and right of 0
      // compute () and store card depth in array
      // set up animation and begin shuffle

      function onAssetsProgress(o)
      {
        // console.log(arguments);
        $('.loader .percentage').text( ((o.content.assetURLs.length - o.content.loadCount) / o.content.assetURLs.length)*100+'%' );
      }

      function onAssetsLoaded()
      {
        // console.log( hasInitiated );
        if (!hasInitiated )
        {
          // console.log('Assets loaded');
          hideLoaderGraphics();
          loader.removeEventListener('onComplete', onAssetsLoaded);
          var sprite = PIXI.Sprite.fromImage(assetURISpritesheet);

          container.position.x = renderer.width  / 2;
          container.position.y = renderer.height / 2;
          for (var i=0;i<stage.children.length;i++)
          {
            stage.removeChild( stage.children[i] );
          }
          stage.addChild(container);

          deck.position.x -= (VISIBLE_CARDS-1) * CARD_WIDTH / 2;

          container.addChild(deck);

          drawCover();
          drawPhone();
          cover.alpha = 0;

          cardsPerRow = Math.round(sprite.width / CARD_WIDTH);
          cardsPerCol = Math.round(sprite.height / CARD_HEIGHT);
          totalCards = 20; //cardsPerRow * cardsPerCol;
          // console.log(cardsPerRow)
          // console.log(cardsPerCol)
          // Cut the spritesheet into individual card textures by moving anchor and rendering a texture
          // TODO: Change spritesheet - might need to change dimension
          for (var i = 0; i < totalCards; i++)
          {
            var texture = new PIXI.RenderTexture(CARD_WIDTH, CARD_HEIGHT);

            sprite.anchor.x = 1 / cardsPerRow * (i % cardsPerRow);
            sprite.anchor.y = 1 / cardsPerCol * Math.floor(i / cardsPerRow);
            texture.render(sprite);
              // console.log( cardsPerRow +' x '+ cardsPerCol  )
              // console.log( sprite.anchor.x +' '+sprite.anchor.y)
            cardTextures.push( texture );
          }
          console.log('setup done');

          onResize();

          init();

          stateCompleteHandler( $state.current.name ,  $state.current.name );
          hasInitiated = true;
        }
      }

      function showLoaderGraphics() {
        $('.loader').show();

      }

      function hideLoaderGraphics() {
        $('.loader').hide();
      }


      function init()
      {
        clean();

        scope.level = 1;
        cover.alpha = 0;

        configure( scope.level );
        initShuffle();
        animate();

      }

      // Create the sprites that we'll animate and render the card textures into
      // VISIBLE_CARDS + 1 to include the appearance of a new card.
      // Selection is a concatination of:
      // (1) any ONE of the 4 aces = [0-3]
      // (2) any other VISIBLE_CARDS-1 cards

      function configure( level )
      {

        for ( var i=0;i< deck.children.length;i++)
        {
          deck.removeChild( deck.children[i] );
        }
        cardsOnLevel = VISIBLE_CARDS; //+ (level - 1); // increase with one per level
        SPEED_MULTIPLIER = scope.speeds[level-1];

        //console.log('Speed is: '+scope.speeds[level-1]);
        SHUFFLE_SPEED = 600 * SPEED_MULTIPLIER;
        PAUSE_BETWEEN_SHUFFLES = 600 * SPEED_MULTIPLIER;
        VIEWING_TIME = 5000 * SPEED_MULTIPLIER;

        ace = selectRandom( makeIndexArray(4, 0), 1);
        var other = selectRandom( makeIndexArray(totalCards-4, 4 ), cardsOnLevel );
        selection = ace.concat( other );
        cardArrayVisible = [];
        cards = [];
        cardDepths = [];

        for(var i = 0; i < selection.length ; i++)
        {
          var selectionIndex = selection[i]
          cardArrayVisible.push( cardArray[ selectionIndex ] );
          cards.push(new PIXI.Sprite(cardTextures[ selectionIndex ]));

          cards[i].anchor = new PIXI.Point( .5, .5);

          // The cards at index 0 is underneath the card at id 1
          cards[i].position.x = CARD_WIDTH * Math.max(0, i - 1) + CARD_WIDTH / 2;
          if (i != cardDepths[0])
          {
            cards[i].scale = new PIXI.Point(.8,.8);
          }

          // The lower the value, the further to the front the card, cards[cardDepths[i]].
          // Pattern follows VC / 2, VC / 2 + 1, VC / 2 - 1, VC / 2 + 2, etc...
          //HB: will recalculate this to distance from center
          var depth = Math.abs( ( (i+1) - Math.ceil( selection.length / 2 ) ) );
          cardDepths.push( depth );

          //var depth = Math.floor( ( (selection.length) / 2) - (1 - Math.pow(-1, i + 1) + 2 * Math.pow(-1, i + 1) * (i + 1)) /  (selection.length) );
          // console.log( depth );
          // cardDepths.push( depth );

         // setNextCardTexture(cards[0]);
        }
          // console.log( cardDepths );
        addCardsToDeck();

      }

      function PIXIContains( dislayobject, c )
      {
        for (var i=0;i<dislayobject.children.length;i++)
        {
          if (dislayobject.children[i] === c)
          {
            return true;
          }
        }
        return false;
      }

      // Clean active timers and remove card deck
      function clean()
      {
        // console.log('**** clean');
        window.clearRequestTimeout( count_down_timer );
        window.clearRequestTimeout( start_game_timer );
        window.clearRequestInterval( animation_timer );
        window.clearRequestInterval( shuffleInterval );
        clearDeck();

      }

      function firstStart()
      {
        // console.log('firstStart');
        coverUp();
        window.clearRequestInterval( animation_timer );
        window.clearRequestTimeout( start_game_timer );
        animation_timer = window.requestInterval(animate, 30);
        start_game_timer = setTimeout(firstStartGameReady, 3000);
      }

      function firstStartGameReady()
      {
        // console.log('firstStartGameReady');
        coverDown();
        var promise = $state.transitionTo('game.play');
        promise.then( function( s ){
              //$('#game-info').toggleClass('active');
              // startGame();
        }, function( status ){
        });

      }

      function startGame()
      {
        // console.log('startGame');
        //setTimeout(gameCountDown, VIEWING_TIME);
        reshuffle();
        
        shuffleInterval = window.requestInterval(reshuffle, SHUFFLE_SPEED + PAUSE_BETWEEN_SHUFFLES);
        window.clearRequestInterval( animation_timer );
        animation_timer = window.requestInterval(animate, 30);

      }
      
      function loadAudio() {

        var sounds = [ {id: 0, src: '/sounds/Deal Med/008595543-gamecardremove-s011sp180.mp3'}, 
                       {id: 1, src: '/sounds/Fail/Fail01.mp3'},
                       {id: 2, src: '/sounds/Win/023168143-positive-win-game-sound-5.mp3'},
                       {id: 3, src: '/sounds/Start/Start03.mp3'}];
        var soundsToLoad = sounds.length;
        loadSoundProgressively( sounds, soundsToLoad, 0 );

      }
      function loadSoundProgressively( sounds, soundsToLoad, index)
      {
          var snd = $(new Audio());
          snd.attr("type", "audio/mpeg");
          snd.on("error", function(e) 
          {
            $('.loader .percentage').text( "ERROR..." );
          });
          snd.on("loadeddata", function(e) 
          {

            for (var i=0;i<sounds.length;i++)
            {
                if (sounds[i].src === $(e.target).attr("src"))
                {
                   switch (i)
                   {
                      case 0:
                        sound_shuffle = e.target;
                      break;
                      case 1:
                        sound_failed = e.target;
                      break;
                      case 2:
                        sound_success = e.target;
                      break;
                      case 3:
                        sound_countdown = e.target;
                      break;
                   }
                }

            }
            soundsToLoad--;
            $('.loader .percentage').text( "SOUND..." + ((sounds.length - soundsToLoad) / sounds.length)*100+'%' );
            if (soundsToLoad==0)
            {
              element.trigger("onAudioLoaded")
            } else {
              loadSoundProgressively( sounds, soundsToLoad, index+1 );
            }
          });

          $('.loader .percentage').text( "SOUNDS..." );

          snd.attr("volume", "0");
          snd.attr("src", sounds[index].src);
          // snd[0].volume = 0;
          // snd[0].play();

      }
      function playAudio(type)
      {
        if (!scope.isMuted)
        {
          var snd = null;
          switch (type)
          {
              case "shuffle_medium":
                snd = sound_shuffle;
              break;
              case "failed":
                  snd = sound_failed;
              break;
              case "success":
                    snd = sound_success;
              break;
              case "countdown":
                    snd = sound_countdown;
              break;
              default:
          }
          if (snd!==null)
          {
             snd.play();
              $(snd).bind("ended", function()
              {
                  //console.log("sound finished");
              });
          }
        }
      }
      //Adds a card sprite to the deck container (pixi)
      function addCardsToDeck()
      {

        for (var i = cards.length - 1; i >= 0; i--) {
          try
          {
             // console.log('added to deck '+i);
            deck.addChild( cards[cardDepths[i]] );
          } catch (error)
          {
            // console.error(error);
          }
        }
      }
      function clearDeck()
      {
        for ( var i=0;i< deck.children.length;i++)
        {
          deck.removeChild( deck.children[i] );
        }
      }
      function drawPhone()
      {
        var w = 669, h = 1296, s = .48;
        var phoneSprite = PIXI.Sprite.fromImage(assetURIPhone);
        container.addChild( phoneSprite );
        phoneSprite.scale = new PIXI.Point(s,s);
        //phoneSprite.width *=s;
        //phoneSprite.height *=s;
        phoneSprite.position.x = (- w * s ) / 2;
        phoneSprite.position.y = ((- h * s ) / 2);


      }

      // Grab the first available texture and then push it to the back of the array
      function setNextCardTexture(card)
      {
        card.setTexture(cardTextures[0]);
        cardTextures.push(cardTextures.shift());
      }


      // shuffle animation
      // not quite clear how this work generically - but each tween scales, moves and fades a card to generate the shuffle animation
      function initShuffle()
      {
        for (var i=0;i<cards.length;i++)
        {
          if (i!==0 && i!==1 && i!==2)
          {
            cards[i].alpha = 0;

          } else {
            cards[i].alpha = 1;
          }
        }

        cards[0].position.x = ( CARD_WIDTH * Math.max(0, 0 - 1) + CARD_WIDTH / 2) - CARD_WIDTH / 2;
        cards[0].position.scale = new PIXI.Point(.8, .8);
        cards[0].alpha = 1;

        cards[1].position.x = ( CARD_WIDTH * Math.max(0, 1 - 1) + CARD_WIDTH / 2) + (CARD_WIDTH / 2);
        cards[1].position.scale = new PIXI.Point(1, 1);

        cards[2].position.x = ( CARD_WIDTH * Math.max(0, 2 - 1) + CARD_WIDTH / 2) + (CARD_WIDTH / 2);

        cards[3].position.x = ( CARD_WIDTH * Math.max(0, 3 - 1) + CARD_WIDTH / 2) - (CARD_WIDTH *1.5);
        cards[3].scale = new PIXI.Point(.6,.6);
        cards[3].alpha = .5;

            // deck.swapChildren(cards[3],cards[1]);

      }

      function getDepth(c)
      {
        for (var i=0;i<deck.children.length;i++)
        {
          if (c === deck.children[i])
          {
            return i;
          }
        }
        return -1;
      }

      function shuffle()
      {

        var currentSelectedIndex = cardArrayVisible[1];
        playAudio("shuffle_medium");
        // var currentVisibleArray = [];
        // for (var i=0;i<cardArrayVisible.length;i++)
        // {
        //     currentVisibleArray.push( {index: selection[i], symbol: cardArrayVisible[i]} );
        // }
        // currentVisibleArray = currentVisibleArray.splice(0, VISIBLE_CARDS+1);
        // console.log(currentVisibleArray)
        // console.log(currentSelectedIndex);

        for (var i=0;i<cards.length;i++)
        {
          if (i!==0 && i!==1 && i!==2)
          {
            cards[i].alpha = 0;
          } else {
            cards[i].alpha = 1;
          }
        }
        try {
          var d1 = getDepth(cards[3]);
          var d2 = getDepth(cards[1]);
          // console.log(d1 + ' '+ d2)
          if (d1>d2)
          {
            deck.swapChildren(cards[3],cards[1]);
          }

        } catch (error)
        {
          // console.log(error);
        }

        var first1 = new TWEEN.Tween( { x: cards[0].position.x, scale: .6, alpha:0 } )
        .to( { x: ( CARD_WIDTH * Math.max(0, 0 - 1) + CARD_WIDTH / 2) - CARD_WIDTH / 2 , scale:.8, alpha:1 }, SHUFFLE_SPEED  )
        .easing( SHUFFLE_EASE )
        .onUpdate( function () {
          cards[0].alpha = this.alpha;
          cards[0].position.x = this.x;
          cards[0].scale.x = this.scale;
          cards[0].scale.y = this.scale;


        })
        .start();

        var middle = new TWEEN.Tween( { x: cards[1].position.x, scaleUp: .8, scaleDown: 1 } )
        .to( { x: ( CARD_WIDTH * Math.max(0, 1 - 1) + CARD_WIDTH / 2) + (CARD_WIDTH / 2), scaleUp: 1, scaleDown: .8 }, SHUFFLE_SPEED )
        .easing( SHUFFLE_EASE )
        .onUpdate( function () {
          cards[1].scale.x = this.scaleUp;
          cards[1].scale.y = this.scaleUp;
          cards[2].scale.x = this.scaleDown;
          cards[2].scale.y = this.scaleDown;

          for(var i = 1; i < VISIBLE_CARDS; i++)
          {
            if (i!==0 && (VISIBLE_CARDS-1)!==i && i!==VISIBLE_CARDS)
            {
              cards[i].position.x = this.x + (( i - 1 ) * CARD_WIDTH );
            }
          }
        })
        .start();

        var last1 = new TWEEN.Tween( { x: cards[2].position.x } )
        .to( { x: ( CARD_WIDTH * Math.max(0, 2 - 1) + CARD_WIDTH / 2) + (CARD_WIDTH / 2), scaleDown: .8 }, SHUFFLE_SPEED )
        .easing( SHUFFLE_EASE )
        .onUpdate( function () {
          cards[2].position.x = this.x;
        })
        .onComplete(function() {
          //if (deck)
        })
        .start();
        var last2 = new TWEEN.Tween( { x: cards[3].position.x , scale: .8, alpha:1 } )
        .to( { x: ( CARD_WIDTH * Math.max(0, 3 - 1) + CARD_WIDTH / 2) - (CARD_WIDTH *1.5) , scale: .6, alpha:0}, SHUFFLE_SPEED   )
        .delay(0 )
        .easing( SHUFFLE_EASE )
        .onUpdate( function () {
          cards[3].alpha = this.alpha;
          cards[3].position.x = Math.round(this.x);
          cards[3].scale.x = this.scale;
          cards[3].scale.y = this.scale;

          cards[3].width = Math.round(cards[3].width);
          cards[3].height = Math.round(cards[3].height);
        })
        .onComplete(function(){
        })
        .start();
      }

      //Swap the sprites, making the previous card the next, and filling it with the next available texture
      function reshuffle()
      {
        cardArrayVisible.unshift(cardArrayVisible.pop());
        cards.unshift(cards.pop());

        //Push the card that has disappeared to the far right, underneath the card to the far left.
        cards[0].x = CARD_WIDTH / 2;

        addCardsToDeck();
        shuffle();
      }

      // Triggers countdown
      function gameCountDown()
      {
        playAudio("countdown");
        $state.transitionTo('game.countdown');
        countDown();
        $('#game-info').toggleClass('active');
      }

      // Counts down to Zero, covers the cards (shows a cover : coverup) and then waits for user to pick card
      function countDown()
      {

        if(counter > 0)
        {
          scope.message = counter;
          $state.transitionTo('game.countdown');
          counter--;
          window.clearRequestTimeout(count_down_timer);
          count_down_timer = window.requestTimeout(countDown, ONE_SECOND);
        }
        else
        {
          $state.transitionTo('game.ready');

        }
      }

      function readyToSelect()
      {
        scope.message = '';
        // console.log( $('#game-info div') );
        // $('#game-info div').on('click', function(){
        //     pick();
        // })

        counter = COUNTER_START;
        coverUp();
      }

      // add a black cover to stage
      function drawCover()
      {
        cover.clear();
        cover.beginFill(0x000000, 1);
        cover.drawRect(-renderer.width / 2, -renderer.height / 2, renderer.width, renderer.height);
        cover.endFill();
      }

      // remove cover from stage
      function coverUp()
      {
        container.addChild(cover);

        var coverTween = new TWEEN.Tween( { alpha: 0 } )
        .to( { alpha:1 }, 300)
        .easing( TWEEN.Easing.Quadratic.Out )
        .onUpdate( function () {
          cover.alpha = this.alpha;
        })
        .onComplete(function(){

        })
        .start();
      }

      // removes cover for decks (used for count down and level messages)
      function coverDown()
      {
        container.addChild(cover);

        var coverTween = new TWEEN.Tween( { alpha: 1 } )
        .to( { alpha: 0 }, 300)
        .easing( TWEEN.Easing.Quadratic.Out )
        .onUpdate( function () {
          cover.alpha = this.alpha;
        })
        .onComplete(function(){
          container.removeChild(cover);
        })
        .start();
      }

      // Triggered on user click (double tap)
      // hides cover and continues shuffling
      // TODO: Check if it was correct
      // If correct -> take user to next level (show message?)
      // Else -> show error message and restart the game
      // (1) Cover down
      // (2) Stop suffle
      // (3) Get selected
      function pick()
      {
        // shuffle has stopped
        coverDown();

        window.clearRequestInterval(shuffleInterval);

        if ( cardArrayVisible[1] === cardArray[ace[0]] ) //correct choice - ace is 1x1 array containing one of the four aces
        {
          nextlevel();
        } else {    // incorrect
          tryagain();
        }
        // console.log('Selected card:' + cardArrayVisible[1] );
      }

      function nextlevel() {
        // console.log('Great! move on to next level:)');
        //$('#game-info').addClass('nextlevel');
        playAudio("success");
        if (scope.level<scope.maxlevel)
        {
          var promise = $state.transitionTo('game.success');
          promise.then( function( s ){
            $('#game-info').toggleClass('active');
              //  $('#game-info').addClass('retry');
          }, function( status ){
          });
        } else {
          var promise = $state.transitionTo('game.over');
          promise.then( function( s ){
            $('#game-info').toggleClass('active');
              //  $('#game-info').addClass('retry');
          }, function( status ){
          });
        }
          //$state.transitionTo('game.changelevel');
      }

      function tryagain() {
        // console.log('Oh no! Try again');
        playAudio("failed");
        var promise = $state.transitionTo('game.failed');
        promise.then( function( s ){
          $('#game-info').toggleClass('active');
             //$('#game-info').addClass('retry');
        }, function( status ){
        });

        //$('#game-info').html('Oh no! Try again?');
        //$('#game-info').addClass('retry');
      }

      function restart() {
        // console.log('restart');
        changeLevel( scope.level );
      }

      function changeLevel( level ) {
        // requirements for changing level
        // (1) clean all active times
        clearDeck();
        clean();
        configure(level);
        startGame();
        //setTimeout(startGame, VIEWING_TIME);
      }

      function gameover() {
        // console.log('game is over!');
      }

      // Updates the stage
      function animate() {
        try
        {
          TWEEN.update();
          renderer.render(stage);
             //requestAnimFrame( animate );
        } catch (error)
        {
          //console.log(error);
        }
      }

      //help methods for selecting a random array
      function selectRandom( arr, no )
      {
        var rndArr = [];
        for (var i=0;i<no;i++)
        {
          var rndIndex = Math.random() * arr.length;
          var rndVal = arr.splice( rndIndex, 1)[0];
          rndArr.push( rndVal  ) ;
        }
        return rndArr;
      }
      // method for generating a simple index array
      function makeIndexArray( total, startindex )
      {
        var arr = [];
        for (var i=startindex; i<total; i++)
        {
          arr.push( i );
        }
        return arr;
      }

      
    }
  };
}]);
