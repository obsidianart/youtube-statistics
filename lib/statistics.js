(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else {
        // Browser globals
        root.trackYouTubeVideos = factory();
    }
}(this, function () {
  var youTubeAudit; //keep a reference to avoid the garbage collector

  /**
  * YouTube VideoPlayer user audit.
  * Audit user behaviours on YouTube video player
  * Requires YouTube frame api
  * @parameter options Object {
  *     url: String optional - Server url where to store data
  *     ids : array optional ids of youtube iframe, if not given the DOM will be searched instead 
  *   }
  */
  var YouTubeVideoPlayerAudit = function(options) {
    var self = this;

    options = options || {};

    this.iframeIds = options.ids || this.getYoutubePlayers();
    if (!this.iframeIds || this.iframeIds === []) {
      console.warn ("No YouTube player detected, please check the documentation at https://github.com/obsidianart/youtube-statistics")
      return;
    }

    this.storage = options.storage; //Dependency injection

    //TODO: if YT already exist and is loaded the API where loaded by someone else and the window.onYouTubePlayerAPIReady will never be called
    //if (YT && YT.loaded) {}
    
    // This function will be called when the API is fully loaded
    window.onYouTubePlayerAPIReady = function() {
      var player,
          i;
      self.players = []; //JS players reference

      //Attaching a player to each iframe
      for (i = 0; i < self.iframeIds.length; i++) {
        player = new YT.Player(self.iframeIds[i],{
          events: {
            "onStateChange": (function(){
              return function() {
                self.userActed.apply( self, Array.prototype.slice.call( arguments ) );
              }
            })()
          }
        });
        self.players.push(player); //keeping a reference for each player we create
      }
    }
  };

  YouTubeVideoPlayerAudit.prototype = {
    /**
    * userActed
    * Callback for youtube player api
    *
    * @parameter event youtube player event 
    */
    userActed : function (event) {
      var data = {};

      //full list of actions https://developers.google.com/youtube/iframe_api_reference
      if (event.data === YT.PlayerState.PLAYING) {
        data.userAction = "play"
      } else if (event.data === YT.PlayerState.PAUSED) {
        data.userAction = "paused"
      } else {
        //We don't want to save this action
        return false;
      }

      //Retrieving player time    
      data.timecode = event.target.getCurrentTime();
      
      //Retrieving videoId
      data.videoId = event.target.getVideoData().video_id;
      
      //Saving the action
      this.storage.save(data)
    },

    /**
    * getYoutubePlayers
    * Search the DOM for youtube iframes
    *
    * @return array of IDs of youtube iframe. if iframe have no id it will be generated and added.
    */
    getYoutubePlayers: function(){
      var elems = document.getElementsByTagName("iframe"),
          idsArr = [],
          id;
      if (!elems.length) return null; //No iframe found
      for (var i=0; i<elems.length; i++) {
        if (/^https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com(\/|$)/i.test(elems[i].src)) {
          if (elems[i].id) {
            idsArr.push(elems[i].id);
          } else {
            //Generating a random id
            id = "YT-" + parseInt( Math.random()*100000);
            elems[i].id = id;
            idsArr.push(id);
          }
        }
      }
      return idsArr;
    }
  };

  /**
    * ServerStorage
    * Save user actions on the server
    *
    * @parameter url Server Url
    * @parameter userId String - UserId
    */
  var Storage = function(options){
    this.url = options.url;
    this.userId = options.userId;
  };

  Storage.prototype = {
    /**
    * Save an action user did on the video
    *
    * @obj obj we want to store
    */
    save:function(obj) {
      //Save the action on the server here on the server here
      console.group ("User " + obj.userAction);
      console.log ("User id : " + this.userId);
      console.log ("video id : " + obj.videoId);
      console.log ("timecode :" + obj.timecode);
      console.groupEnd();
    }
  };

  // Load YouTube Frame API
  function loadYouTubeFrameAPI() {
      var s = document.createElement("script");
      s.src = "http://www.youtube.com/player_api"; /* Load Player API*/
      var before = document.getElementsByTagName("script")[0];
      before.parentNode.insertBefore(s, before);
  };

  /*
  *   Factory function, create the YouTubeAudit and Storage needed, add the youTube Frame API
  */
  return function(userId, options){
    options = options || {};
    loadYouTubeFrameAPI();
    youTubeAudit = new YouTubeVideoPlayerAudit({
        storage : new Storage({
          url : options.url || "http://www.myserver.com",
          userId : userId || "anonymous",
        })
    });
  }
}));



