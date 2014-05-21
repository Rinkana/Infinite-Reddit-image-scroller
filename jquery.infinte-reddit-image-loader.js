(function($){
	$.fn.infiniteRedditImageLoader = function(options) {
		var mainObject = $(this);
		var loading = false; //If we are already loading data we do not need to call it over and over so we wont do a ton of requests
		var albumCounter = 0;				
		options = $.extend({
			subreddits: ["pics","wallpapers"],
			lastPostLoaded: undefined,
			allowedImageExtensions: [".jpg",".jpeg",".png",".gif"],
			skipAlbums: true, //In case we want to speed up the load time
			loadNewFrom: 100 //The amount of pixels from the bottom when we load new items
		},options);
		//Define vars first before starting the chain.
		var fetchFromReddit = function(){
			
			if(loading == false){
				loading = true;
				//Reddit is so friendly that we can use an "+" to fetch multiple subreddits
				var redditFetchUrl = "//www.reddit.com/r/"+options.subreddits.join("+")+".json?jsonp=?";
				
				//Extra parameters for the call to Reddit
				//Such as the last post loaded (aka loading more pages)
				var redditFetchParameters = {};
				if(options.lastPostLoaded){
					redditFetchParameters["after"] = 't3_' + options.lastPostLoaded;
				}
				//Fetch the JSON from reddit.
				$.getJSON(redditFetchUrl, redditFetchParameters, function(data){
					//Get all the posts in one object. The rest is useless data (for this)
					var posts = data.data.children;
					
					//Loop trough all the posts
					$.each(posts, function (i, post) {
						mainImageHandler(post.data.url);
					});
					//Set the last post option so we can reuse this.
					if(posts && posts.length > 0){
				    	options.lastPostLoaded = posts[posts.length - 1].data.id;
				    }else{
				    	options.lastPostLoaded = undefined;
				    }
				    loading = false;
				});
			}
		};
		
		var mainImageHandler = function(imageUrl){
			
			if(imageUrl.indexOf("imgur.com/")!= -1 ){
				//Imgur url found
				loadFromImgur(imageUrl);
			}
		};
		
		var loadFromImgur = function(imgurUrl){
			if(imgurUrl.indexOf("i.imgur.com/") != -1){
				//Imgur image found that can be used ( :D )
				showImages(imgurUrl);
			}else if(imgurUrl.indexOf("/a/") != -1 ){
				if(options.skipAlbums == false){
					//Imgur album found. Meaning extra loading ( Q_Q ).
					//Note this will also add the images 
					var splittedUrl = imgurUrl.split("/"); //Split by slashes so we can get the id
					var imgurAlbumID = splittedUrl[splittedUrl.length-1];//Get the last part of the splitted url. This shoud be the album id
					var imgurAlbumFetchUrl = "http://api.imgur.com/2/album/"+imgurAlbumID+".json"; //Build the URL
					
					$.getJSON(imgurAlbumFetchUrl, function(data) {
						//Load the album through the imgur api.
						var albumImages = [];
						$.each(data.album.images,function(i,albumImage){
							albumImages.push(albumImage.links.original);
						});
						showImages(albumImages);
					});
				}
			}else if(imgurUrl.indexOf("/gallery/") != -1 ){
				//Todo: implement the gallery feature
				if(options.skipAlbums == false){
					
				}
				
			}else if(imgurUrl.indexOf("imgur.com/") != -1){
				var splittedUrl = imgurUrl.split("/"); //Split by slashes so we can get the id
				var imgurImageID = splittedUrl[splittedUrl.length-1];//Get the last part of the splitted url. This shoud be the image id
				var imgurImageFetchUrl = "http://api.imgur.com/2/image/"+imgurImageID+".json"; //Build the URL
				
				$.getJSON(imgurImageFetchUrl, function(data) {
					//Load the imgur json data. And show the image
					showImages(data.image.links.original);
				});
				
			}else{
				return false;
			}
		};
		
		var showImages = function(data, albumID){
			if(typeof data == "string"){
				//The data we get is a single string so we use it to load in image
				var appendImage = false;
				
				$.each(options.allowedImageExtensions,function(ii, extension){
					if(data.indexOf(extension)){
						//Check if we do not already have this image othwer
						if(!$("img[src='"+data+"']").length > 0){
							appendImage = true;
							//We are already allowed in, so no reason to continue this loop.
						}
						false;
					};
				});
				if(appendImage){
					var $image = $("<img/>").attr("src", data).appendTo(mainObject).wrap( "<div class='infinite-image'></div>" );
					if(albumID){
						$image.parent().addClass(albumID);
					}
					
				}
			}else if(typeof data == "object"){
				//We got an object (or array) we can loop trough
				albumCounter++;
				$.each(data,function(i,image){
					showImages(image, "album"+albumCounter);
				});
				$(".album"+albumCounter).wrapAll("<div class='album' />")
			}
		};
		//The "infinite" part
		$(window).scroll(function() {
			if($(window).scrollTop() + $(window).height() > $(document).height() - options.loadNewFrom) {
				if (options.lastPostLoaded) {
					fetchFromReddit();
				}
			}
		});
		fetchFromReddit();
	};
})(jQuery);