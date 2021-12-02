Twitter.isLoggedIn(function(items) {
  if (!items.oauth_token || !items.oauth_token_secret) {
    document.getElementById('authenticate').addEventListener('click', function() {
      Twitter.authenticate();
    })
  } else {
    document.body.innerHTML = '';
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

      var activeTab = tabs[0];
      var tabUrl = activeTab.url;

      var Http = new XMLHttpRequest();
      var endpoint = "https://extractorapi.com/api/v1/extractor";
      var params = "apikey=c062c7fc9b4d8da0aee9490337b6c4398a52e6bf&url=" + tabUrl;

      Http.open("GET", endpoint+"?"+params);
      Http.onreadystatechange = function () {
        if (Http.readyState === 4) {
          console.log(Http.responseText);
          var responseJSON = JSON.parse(Http.responseText);
          var cleanResponse = responseJSON["text"];
          console.log(cleanResponse);

          var url = "https://api.monkeylearn.com/v3/extractors/ex_YCya9nrn/extract/";

          var xhr = new XMLHttpRequest();
          xhr.open("POST", url);

          xhr.setRequestHeader("Authorization", "Token 2094b443b8b6953ea23564675907cb1ebaa94f2e");
          xhr.setRequestHeader("Content-Type", "application/json");

          xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
              console.log(xhr.responseText);
              var keywords = [];
              var response = JSON.parse(xhr.responseText);
              $.each(response[0]["extractions"], function( _, value){
                keywords.push(value["parsed_value"].replace(" ", ""));
              });

              var keywordDiv = document.createElement("div");
              keywordDiv.classList.add("keyword-container");
              $.each(keywords.slice(0, 4), function( _, word){
                var curWord = document.createElement("p");
                curWord.classList.add("keyword");
                curWord.innerHTML = '#' + word;
                keywordDiv.appendChild(curWord);
              });
              document.body.appendChild(keywordDiv);

              Twitter.search({ "query": "(" + keywords.slice(0, 4).join(" OR ") + ") lang:en", "expansions": "author_id,attachments.media_keys" , "user.fields": "profile_image_url,name,username", "media.fields": "preview_image_url,url,alt_text" });
            }};

          var data = '{"data": ["' + cleanResponse.replace(/['"]+/g, '') + '"]}';

          xhr.send(data);
        }
      };

      Http.send();

    });
  }
});
