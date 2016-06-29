function initiateView(){
    var yelp_locations;
    var pins = {
        default: {
            pinImage : new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" +
            'DD8888',
            new google.maps.Size(21, 34),
            new google.maps.Point(0,0),
            new google.maps.Point(10, 34))
        },
        active: {
            pinImage : new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" +
            'AADDDD',
            new google.maps.Size(21, 34),
            new google.maps.Point(0,0),
            new google.maps.Point(10, 34))

        }
    };

    var neighborhoodMap = function(){
        this.mapDiv = document.getElementById('map');
        this.centerMap = {lat: 43.263224, lng: -2.935003};
        this.zoom = 15;
        this.map = new google.maps.Map(this.mapDiv, {
            zoom: this.zoom,
            center: this.centerMap
        });
    };


    var Location = function(data){
        this.name = data.name;
        this.lat = parseFloat(data.location.coordinate.latitude);
        this.lng = parseFloat(data.location.coordinate.longitude);
        this.address = data.location.address.join(" ");
        this.phone = data.display_phone;
        this.city = data.location.city;
        this.postal_code = data.location.postal_code;
        this.yelp_rating = data.rating;
        this.review_count = data.review_count;
        this.rating_img_url = data.rating_img_url;
        this.display = ko.observable(true);
        this.marker = null;
        this.active = ko.observable(false);
    };

    var myViewModel = function(){
        var self = this;
        self.locationsList = ko.observableArray([]);
        self.myMap = new neighborhoodMap();
        self.currentFilter = ko.observable('');

        var infoWindow = new google.maps.InfoWindow();

        // TO DO: INTEGRATE WITH YELP API
        /**
         * Generates a random number and returns it as a string for OAuthentication
         * @return {string}
         */
        function nonce_generate() {
            return (Math.floor(Math.random() * 1e12).toString());
        }

        var YELP_BASE_URL = 'https://api.yelp.com/v2/search?';


        var yelp_url = YELP_BASE_URL;

        var parameters = {
            oauth_consumer_key: 'S8-8TiaPScmVwStuR1GA_Q',
            oauth_token: 'UoA7m1851yaOsFzsbBgQOliMDGSer_Gs',
            oauth_nonce: nonce_generate(),
            oauth_timestamp: Math.floor(Date.now()/1000),
            oauth_signature_method: 'HMAC-SHA1',
            oauth_version : '1.0',
            callback: 'cb', // This is crucial to include for jsonp implementation in AJAX or else the oauth-signature will be wrong.
            location: 'Bilbao+Spain',
            term: 'restaurant',
            limit: 20,
            sort: 2,
            cll: '43.263224,C-2.935003'
        };

        var encodedSignature = oauthSignature.generate('GET',yelp_url, parameters, 'PUadcTDp_9c1DhRD7pkfpE7RDMk', 'otPGzZD-BxowNm7YylVzGVB1CiQ');
        parameters.oauth_signature = encodedSignature;

        var settings = {
            url: yelp_url,
            data: parameters,
            cache: true,                // This is crucial to include as well to prevent jQuery from adding on a cache-buster parameter "_=23489489749837", invalidating our oauth-signature
            dataType: 'jsonp',
            success: function(results) {
              yelp_locations = results.businesses;
              self.init();
            },
            fail: function() {
              console.log('failed!!');
            }
        };

        // Send AJAX query via jQuery library.
        $.ajax(settings);

        // *******************************
        // ---------- TO DO: IMPLEMENT GOOGLE MAPS PLACES
        self.printConsole = function(place, status){
            // console.log(place);
        }

        self.service = new google.maps.places.PlacesService(self.myMap.map);
        
        self.retrievePlacesDetails = function(results,status, location){
            var request = {
                placeId: results[0].place_id
            };
            self.service.getDetails(request,function(result,status){
                location.place_id = result.place_id;
                location.photos_array = result.photos;
                location.first_picture_url = result.photos[0].getUrl({'maxHeight': 300, 'maxWidth': 300});
                location.website = result.website;
                location.rating = result.rating;
                console.log(result);
                self.prepareInfoWindowContent(location);
            });
        };

        self.retrieveInfoGooglePlaces = function(location){
            self.service.nearbySearch({
                location: self.myMap.centerMap,
                radius: 2000,
                keyword: location.name
            }, function(result, status){
                self.retrievePlacesDetails(result, status, location);
            });

        };

        // ---------- TO DO: IMPLEMENT GOOGLE MAPS PLACES

        var subscription = self.currentFilter.subscribe(function(newValue){
            for (var i = 0; i<self.locationsList().length; i++){
                var locationName = self.locationsList()[i].name.toLowerCase();
                targetString = newValue.toLowerCase();
                if (locationName.indexOf(targetString) === -1){
                    self.locationsList()[i].display(false);
                }else{
                    self.locationsList()[i].display(true);                
                }
            }
            self.redrawMarkers();
        });

        self.init = function(){
            yelp_locations.forEach(function(locationItem){
                self.locationsList.push(new Location(locationItem));
            });
            self.drawMarkers();
        };

        self.drawMarkers = function(){
            for(var i = 0; i< self.locationsList().length; i++){
                var currentItem = self.locationsList()[i];
                if (currentItem.display() === true){
                    self.addMarkerWithAnimation(currentItem, i*100);
                } else if(currentItem.marker !== null) {
                    currentItem.marker.setMap(null);
                }
            }
        };

        self.redrawMarkers = function(){
            for(var i = 0; i< self.locationsList().length; i++){
                var currentItem = self.locationsList()[i];
                if (currentItem.display() === true){
                    currentItem.marker.setMap(self.myMap.map);
                } else if(currentItem.marker !== null) {
                    currentItem.marker.setMap(null);
                }
            }
        };

        self.clearMarkers = function(){
            for(var i = 0; i< self.locationsList().length; i++){
                var currentItem = self.locationsList()[i];
                currentItem.marker.setMap(null);
            }
        };

        self.addMarkerWithAnimation = function(currentItem, timeout){
            window.setTimeout(function(){
                currentItem.marker = new google.maps.Marker({
                    position: {lat: currentItem.lat, lng: currentItem.lng},
                    animation: google.maps.Animation.DROP,
                    icon: pins.default.pinImage,
                    map: self.myMap.map
                });
                currentItem.marker.addListener('click', function(){
                    self.activateMarker.call(currentItem);
                });
            }, timeout);
        };

        self.initContent = function(location){
            self.retrieveInfoGooglePlaces(location);
        };

        self.prepareInfoWindowContent = function(location){
            var pictureString = "<iframe width='300' height='auto' frameborder='0' src='"+location.first_picture_url+"'></iframe>";
            var contentString = "<div class='infoWin'>" +
                                    "<div class='imageContent'>"+
                                        pictureString +
                                    "</div>"+
                                    "<div class='textContent'>" +
                                        "<h5 class='infoTitle'>"+
                                            location.name +
                                        "</h5>" +
                                        "<ul class='infoData'>"+
                                            "<li> Tel. "+location.phone+"</li>"+
                                            "<li>"+location.address+"</li>"+
                                            "<li>"+location.postal_code+" "+location.city+"</li>"+
                                            "<li>"+"<a href='"+location.website+"' target='_blank'>"+location.website+"</a></li>"+
                                        "</ul>"+
                                    "</div>"+
                                    "<div class='ratingsContent'>"+
                                        "<img src='"+location.rating_img_url +"' alt='yelp star rating'>"+
                                        "<span class='reviewCount'> "+location.review_count+" Yelp reviews</span>"+                                    "</div>"+

                                "</div>";
            infoWindow.setContent(contentString);
        };


        self.activateMarker = function(){
            var marker = this.marker;
            var location = this;
            self.inactiveAll();
            location.active(true);
            self.activeColor(marker);
            self.Bounce(marker);
            self.initContent(location);
            // infoWindow.setContent(location.name);
            infoWindow.open(self.myMap, marker);
        };


        self.findClickedMarker = function(){
            console.log(this);
        }

        self.Bounce = function(currentMarker){
            // var self = this;
            if (currentMarker.getAnimation() !== null) {
                currentMarker.setAnimation(null);
            } else {
                currentMarker.setAnimation(google.maps.Animation.BOUNCE);
                window.setTimeout(function(){
                    currentMarker.setAnimation(null);
                },700);
            }
        };

        self.activeColor = function(currentMarker){
            currentMarker.setIcon(pins.active.pinImage);
        };

        self.defaultColor = function(currentMarker){
            currentMarker.setIcon(pins.default.pinImage);
        };

        self.inactiveAll = function(){
            for(var i = 0; i< self.locationsList().length; i++){
                var currentItem = self.locationsList()[i];
                currentItem.active(false);
                self.defaultColor(currentItem.marker);
            }
        };

        self.defaultColorAll = function(){
            for(var i = 0; i< self.locationsList().length; i++){
                var currentItem = self.locationsList()[i];
                self.defaultColor(currentItem.marker);
            }
        };
    };


    ko.applyBindings(new myViewModel);
};

function googleSuccess(){
    initiateView();
};

function googleError(){
    $('body').html('');
    $('body').append("<h1>There was an error loading Google Maps. Please try again in 10 hours.</h1>");
};


        