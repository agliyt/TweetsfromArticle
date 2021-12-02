(function() {
  var API_URL = 'https://api.twitter.com/';
  var consumer_key = 'KPWstbXm9smH4EtFpKBA6f84e';
  var consumer_secret = 'Vcei72MzpwlC1Sn90GQMM6KYZ2ZB04u2fktMdU4cqusGCUnMiA';
  var Twitter = {
    oauth_token: null,
    oauth_token_secret: '',
    authenticate: function() {
      Twitter.oauth_token_secret = '';
      Twitter.oauth_token = null;

      this.api('oauth/request_token', 'POST', $.proxy(function(response) {
        var des = this.deparam(response);
        Twitter.oauth_token_secret = des.oauth_token_secret;
        Twitter.oauth_token = des.oauth_token;
        var url = 'https://api.twitter.com/oauth/authenticate?oauth_token=' + Twitter.oauth_token;
        window.open(url);
      }, this));
    },
    search: function(q) {
      this.apiGet('tweets/search/recent', 'GET', q, $.proxy(function(response) {
        document.body.style.background = 'rgba(131,131,131,0.4)';
        $.each(response.data, function( _, post){
          var tweetDiv = document.createElement("div");
          tweetDiv.classList.add("tweet");

          // add profile pic, name, username
          var profilePic = document.createElement("img");
          profilePic.classList.add("profile-img");
          var nameP = document.createElement("p");
          nameP.classList.add("name");
          var usernameP = document.createElement("p");
          usernameP.classList.add("username");
          $.each(response.includes.users, function(_, user){
            if (user.id === post.author_id) {
              profilePic.setAttribute('src', user.profile_image_url);
              nameP.innerHTML = user.name;
              usernameP.innerHTML = '@' + user.username;
            }
          });
          tweetDiv.appendChild(profilePic);
          tweetDiv.appendChild(nameP);
          tweetDiv.appendChild(usernameP);

          // add tweet body text
          var descriptionP = document.createElement("p");
          descriptionP.classList.add("description");
          descriptionP.innerHTML = post.text;
          tweetDiv.appendChild(descriptionP);

          // add picture if it exists
          if (post.attachments !== undefined) {
            var picDiv = document.createElement("div");
            picDiv.classList.add("pic-container");
            var pic = document.createElement("img");
            pic.classList.add("tweet-pic");
            $.each(response.includes.media, function(_, med){
              if (med.type === 'photo' && med.media_key === post.attachments.media_keys[0]) {
                pic.setAttribute('src', med.url);
              }
            });
            picDiv.appendChild(pic);
            tweetDiv.appendChild(picDiv);
          }

          document.body.appendChild(tweetDiv);
        });
      }, this));
    },
    logout: function() {
      chrome.storage.local.remove(['oauth_token', 'oauth_token_secret']);
      Twitter.oauth_token = false;
      Twitter.oauth_token_secret = false;
      chrome.browserAction.setBadgeText({text: ''});
    },
    isLoggedIn: function(cb) {
      chrome.storage.local.get(['oauth_token', 'oauth_token_secret'], cb);
    },
    setOAuthTokens: function(tokens, cb) {
      Twitter.oauth_token = tokens.oauth_token;
      Twitter.oauth_token_secret = tokens.oauth_token_secret;
      chrome.storage.local.set({ 'oauth_token': tokens.oauth_token, 'oauth_token_secret': tokens.oauth_token_secret }, cb);
    },
    api: function(path /* params obj, callback fn */) {
      var args = Array.prototype.slice.call(arguments, 1),
          fn = false,
          params = {},
          method = 'GET';

      /* Parse arguments to their appropriate position */
      for(var i in args) {
        switch(typeof args[i]) {
          case 'function':
            fn = args[i];
          break;
          case 'object':
            params = args[i];
          break;
          case 'string':
            method = args[i].toUpperCase();
          break;
        }
      }

      /* Add an oauth token if it is an api request */
      Twitter.oauth_token && (params.oauth_token = Twitter.oauth_token);

      /* Add a 1.1 and .json if its not an authentication request */
      (!path.match(/oauth/)) && (path = '2/' + path);

      var accessor = {consumerSecret: consumer_secret, tokenSecret: Twitter.oauth_token_secret},
        message = {
          action: API_URL + path,
          method: method,
          parameters: [['oauth_consumer_key', consumer_key], ['oauth_signature_method', 'HMAC-SHA1']]
        };

      $.each(params, function(k, v) {
        OAuth.setParameter(message, k, v);
      });

      OAuth.completeRequest(message, accessor);

      var p = [];
      $.each(OAuth.getParameterMap(message.parameters), function(k, v) {
        p.push(k + '=' + OAuth.percentEncode(v));
      });

      $[method.toLowerCase()](API_URL + path, p.join('&'), fn).error(function(res) {
        if(res && res.responseText && res.responseText.match(/89/)) {
          Twitter.authenticate();
        }
      });
    },
    apiGet: function(path /* params obj, callback fn */) {
      var args = Array.prototype.slice.call(arguments, 1),
          fn = false,
          params = {},
          method = 'GET';

      /* Parse arguments to their appropriate position */
      for(var i in args) {
        switch(typeof args[i]) {
          case 'function':
            fn = args[i];
          break;
          case 'object':
            params = args[i];
          break;
          case 'string':
            method = args[i].toUpperCase();
          break;
        }
      }

      /* Add an oauth token if it is an api request */
      Twitter.oauth_token && (params.oauth_token = Twitter.oauth_token);

      /* Add a 1.1 and .json if its not an authentication request */
      (!path.match(/oauth/)) && (path = '2/' + path);

      var accessor = {consumerSecret: consumer_secret, tokenSecret: Twitter.oauth_token_secret},
        message = {
          action: API_URL + path,
          method: method,
          parameters: [['oauth_consumer_key', consumer_key], ['oauth_signature_method', 'HMAC-SHA1']]
        };

      OAuth.completeRequest(message, accessor);

      $.ajax({ url: API_URL + path, headers: { 'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAAPydWQEAAAAADv%2BqBjk65sJPE%2B%2FGc251A6oorWc%3DhDwvdqErVsAb7o21w6n3xrY2D2kYnyN0eY87ItYVytEbd1CQFr' }, type: method, success: fn, data: params });

    },
    deparam: function(params) {
      var obj = {};
      $.each(params.split('&'), function() {
        var item = this.split('=');
        obj[item[0]] = item[1];
      });
      return obj;
    }
  };

  window.Twitter = Twitter;
})();;