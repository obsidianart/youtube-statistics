(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['YouTubeAudit'], factory);
    } else {
        // Browser globals
        root.YouTubeAudit = factory(root.b);
    }
}(this, function (b) {
  /**
  * YouTube VideoPlayer user audit.
  * Audit user behaviours on YouTube video player
  * Requires YouTube frame api
  * @parameter options Object {
  *     userId: String - UserId
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
      return false;
    }

    this.players = options.players;

    this.serverStorage = new ServerStorage({
      url : options.url || "http://www.myserver.com",
      userId : options.userId || "anonymous"
    });

    // This function will be called when the API is fully loaded
    window.onYouTubePlayerAPIReady = function() {
      var player;
      self.players = self.players || []; //JS players reference

      //Attaching a player to each iframe
      for (var i = 0; i < self.iframeIds.length; i++) {
        player = new YT.Player(self.iframeIds[i],{
          events: {
            "onStateChange": (function(args){
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
        this.serverStorage.save(data)
      },

      /**
      * getYoutubePlayers
      * Search the DOM for youtube iframes
      *
      * @return array of IDs of youtube iframe. if iframe have no id it will be generated and added.
      */
      getYoutubePlayers: function(){
        var elems = document.getElementsByTagName("iframe");
        var idsArr = [];
        if (!elems.length) return null; //No iframe found, FAILfURE
        for (var i=0; i<elems.length; i++) {
          if (/^https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com(\/|$)/i.test(elems[i].src)) {
            if (elems[i].id) {
              idsArr.push(elems[i].id);
            } else {
              //TODO: generate id if missing
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
    */
  var ServerStorage = function(options){
    this._url = options.url;
    this._userId = options.userId;
  };

  ServerStorage.prototype = {
    /**
    * Save an action user did on the video
    *
    * @obj obj we want to store
    */
    save:function(obj) {
      //Save the action on the server here on the server here
      console.group ("User " + obj.userAction);
      console.log ("User id : " + this._userId);
      console.log ("video id : " + obj.videoId);
      console.log ("timecode :" + obj.timecode);
      console.groupEnd();
    }
  };

  var init

  // Load YouTube Frame API
  (function() {
      var s = document.createElement("script");
      s.src = "http://www.youtube.com/player_api"; /* Load Player API*/
      var before = document.getElementsByTagName("script")[0];
      before.parentNode.insertBefore(s, before);
  })();

  var trackVideos = function(){
    var YouTubeAudit = new YouTubeVideoPlayerAudit({
        userId : "Penny0659"
    });
  }


  // Just return a value to define the module export.
  // This example returns an object, but the module
  // can return a function as the exported value.
  return trackVideos;
}));



