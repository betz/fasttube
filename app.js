angular.module('app', ['youtube'])

function YoutubeCtrl($scope, $window, $http, $location, youtubePlayerApi) {

  $scope.searchResults = [];
  $scope.playlist = [];
  $scope.current = false;

  console.log($location);

  $scope.play = function (hash) {
    var playlist = $scope.playlist;

    for (var i = 0; i < playlist.length; i++) {
      if(playlist[i].hash == hash) {
        $scope.setActive(playlist[i].hash);
        youtubePlayerApi.videoId = playlist[i].id;
        youtubePlayerApi.loadPlayer();
        return;
      }
    }
  }

  $scope.next = function () {
    var next = $scope.getNext();
    if(!next) {
      return;
    }
    $scope.setActive(next.hash);
    youtubePlayerApi.loadVideoById(next.id);
  }

  $scope.getNext = function () {
    var playlist = $scope.playlist;

    if(!$scope.current) {
      return playlist[0];
    }

    for (var i = 0; i < playlist.length; i++) {
      if(playlist[i].hash == $scope.current) {
        if(!playlist[i+1]) {
          return false;
        }
        return playlist[i+1];
      }
    }
  }

  $scope.nextAvailable = function () {
    var next = $scope.getNext();
    if(!next) {
      return false;
    }
    return true;
  }

  $window.onPlayerStateChange = function (event) {
    if (event.data == YT.PlayerState.PLAYING) {

    }        
    if (event.data == YT.PlayerState.ENDED) {
      $scope.next();
    }
  }

  $scope.search = function(query) {
    $scope.searchResults = [];

    $http({
      method: 'GET', 
      url: 'https://gdata.youtube.com/feeds/api/videos',
      params: {
        'q': query, 
        'alt': "json", 
        'max-results': 20, 
        'v': 2, 
        'orderby': "relevance", 
        'format': 5
      }
    })
    .success(function(data, status, headers, config) {

      if(data.feed.entry.length > 0) {
        for (var r = 0; r < data.feed.entry.length; r++) {
          var result = {
            'id': data.feed.entry[r].media$group.yt$videoid.$t,
            'title': data.feed.entry[r].title.$t,
            'thumbnail': data.feed.entry[r].media$group.media$thumbnail[1].url,
            'active': false
          }
          $scope.searchResults.push(result);
        }
      }

    }).
    error(function(data, status, headers, config) {
      console.log(data);
      console.log(status);
    });
  };

  $scope.searchRelated = function(id) {
    $scope.related = [];

    $http({
      method: 'GET', 
      url: 'https://gdata.youtube.com/feeds/api/videos/' + id + '/related?v=2',
      params: {
        'alt': "json", 
        'max-results': 3, 
        'v': 2, 
        'orderby': "relevance", 
        'format': 5
      }
    })
    .success(function(data, status, headers, config) {

      if(data.feed.entry.length > 0) {
        for (var r = 0; r < data.feed.entry.length; r++) {
          var result = {
            'id': data.feed.entry[r].media$group.yt$videoid.$t,
            'title': data.feed.entry[r].title.$t,
            'thumbnail': data.feed.entry[r].media$group.media$thumbnail[1].url,
            'active': false
          }
          $scope.related.push(result);
        }
      }

    }).
    error(function(data, status, headers, config) {
      console.log(data);
      console.log(status);
    });
  };

  $scope.addToPlaylist = function (result) {
    movie = result.clone();
    movie.hash = token();
    $scope.playlist.push(movie);
    if($scope.playlist.length == 1) {
      $scope.play(movie.hash);
    }
  }

  $scope.setActive = function (hash) {
    var playlist = $scope.playlist;
    $scope.current = hash;


    for (var i = 0; i < playlist.length; i++) {
      playlist[i].active = false;
      if(playlist[i].hash == hash) {
        playlist[i].active = true;
        $scope.currentTitle = playlist[i].title;
        $scope.searchRelated(playlist[i].id);
      }
    }
    $scope.$apply();
  }

  $scope.isActive = function (item) {
    if(item.active) {
      return true;
    }
    return false;
  }

  $scope.deleteFromPlaylist = function (hash) {
    for (var i = 0; i < $scope.playlist.length; i++) {
      if($scope.playlist[i].hash == hash) {
        $scope.playlist.splice(i, 1);
      }
    }
  }

  $scope.clearPlaylist = function () {
    $scope.playlist = [];
  }

}


/* helper functions */

Object.prototype.clone = function() {
  var newObj = (this instanceof Array) ? [] : {};
  for (i in this) {
    if (i == 'clone') continue;
    if (this[i] && typeof this[i] == "object") {
      newObj[i] = this[i].clone();
    } else newObj[i] = this[i]
  } return newObj;
};

var rand = function() {
    return Math.random().toString(36).substr(2); // remove `0.`
};

var token = function() {
    return rand() + rand(); // to make it longer
};
