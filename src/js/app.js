
//**********************************
/* initiateView() wraps the whole page functionality. All functions and variables
/* are initialized and set up and then ko.applyBindings(new MyViewModel) is
/* called, which will initialize the variables.
*/
function initiateView(){
    'use strict';
    // pins: will hold some personilized styles for the markers
    var pins = {
        default: {
            pinImage : new google.maps.MarkerImage('http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|' +
            'DD8888',
            new google.maps.Size(21, 34),
            new google.maps.Point(0,0),
            new google.maps.Point(10, 34))
        },
        active: {
            pinImage : new google.maps.MarkerImage('http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|' +
            'AADDDD',
            new google.maps.Size(21, 34),
            new google.maps.Point(0,0),
            new google.maps.Point(10, 34))

        }
    };
    // neighborhoodMap: will hold the Google Maps object
    var neighborhoodMap = function(){
        this.mapDiv = document.getElementById('map');
        this.centerMap = {lat: 43.263224, lng: -2.935003};
        this.zoom = 15;
        this.map = new google.maps.Map(this.mapDiv, {
            zoom: this.zoom,
            center: this.centerMap
        });
    };
    // location: will hold all the data of a specific location
    var Location = function(data){
        this.name = data.name;
        this.lat = parseFloat(data.location.coordinate.latitude);
        this.lng = parseFloat(data.location.coordinate.longitude);
        this.address = data.location.address.join(' ');
        this.phone = data.display_phone;
        this.city = data.location.city;
        this.postal_code = data.location.postal_code;
        this.yelp_rating = data.rating;
        this.review_count = data.review_count;
        this.rating_img_url = data.rating_img_url;
        this.display = ko.observable(true); // this will be useful to filter the marker
        this.marker = null; 
        this.active = ko.observable(false); // this will be useful to highlight the current marker
    };

    var MyViewModel = function(){
        var self = this;
        self.menuVisible = ko.observable(false);
        self.yelp_locations; // yelp_location: will hold the from the Yelp Api
        self.locationsList = ko.observableArray([]); // will hold a list of Location objects (line 37)
        self.myMap = new neighborhoodMap();
        self.currentFilter = ko.observable('');
        self.infoWindow = new google.maps.InfoWindow();
        /** YELP API *************************************************
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
            sort: 1,
            cll: '43.263224,C-2.935003'
        };
        var encodedSignature = oauthSignature.generate('GET',yelp_url, parameters, 'PUadcTDp_9c1DhRD7pkfpE7RDMk', 'otPGzZD-BxowNm7YylVzGVB1CiQ');
        parameters.oauth_signature = encodedSignature;
        var settings = {
            url: yelp_url,
            data: parameters,
            cache: true,                // This is crucial to include as well to prevent jQuery from adding on a cache-buster parameter "_=23489489749837", invalidating our oauth-signature
            dataType: 'jsonp'
        };
        /**
         * Sends ajax request to Yelp Api
         */
        $.ajax(settings).done(function(results) {
            self.yelp_locations = results.businesses;
            self.init();
        }).fail(function() {
            $('body').html('');
            $('body').append('<h1>There was an error fetching data from Yelp API. Try again later.</h1>');
        });
        /** GOOGLE PLACES API *************************************************
         */
        self.service = new google.maps.places.PlacesService(self.myMap.map);
        self.retrievePlacesDetails = function(results, status, location){
            var request = {
                placeId: results[0].place_id
            };
            self.service.getDetails(request,function(result,status){
                location.place_id = result.place_id ? result.place_id : null;
                location.photos_array = result.photos ? result.photos : null;
                location.first_picture_url = result.photos ? result.photos[0].getUrl({'maxHeight': 300, 'maxWidth': 300}):null;
                location.website = result.website ? result.website : '';
                location.rating = result.rating ? result.rating : 'No rating available';
                self.prepareInfoWindowContent(location);
            });
        };

        self.retrieveInfoGooglePlaces = function(location){
            self.service.nearbySearch({
                location: self.myMap.centerMap,
                radius: 2000,
                keyword: location.name
            }, function(result, status){
                if (status === "OK"){
                    self.retrievePlacesDetails(result, status, location); // call function in line 106
                }else{
                    $('body').html('');
                    $('body').append('<h1>There was an error loading Google Places API. Please try again later.</h1>');
                    $('body').append('<h3>ERROR MESSAGE: '+status+'</h3>');
                }
            });

        };

        /** SET UP INFOWINDOW **************
         */
        self.initContent = function(location){
            self.retrieveInfoGooglePlaces(location); // call function in line 121
        };

        self.prepareInfoWindowContent = function(location){
            var pictureString = location.first_picture_url ? "<iframe width='300' height='auto' frameborder='0' src='"+location.first_picture_url+"'></iframe>": '';
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
                                        "<span class='reviewCount'> "+location.review_count+" Yelp reviews</span>"+
                                    "</div>"+
                                "</div>";
            self.infoWindow.setContent(contentString);
        };

        /** SET UP MARKERS AND THEIR FUNCTIONALITY *********************************
         */
        /**
         * Populate locationsList and draw markers on map
         */
        self.init = function(){
            self.yelp_locations.forEach(function(locationItem){
                self.locationsList.push(new Location(locationItem));
            });
            self.drawMarkers();
        };
        /**
         * Build an event handler that will filter locations
         */
        self.currentFilter.subscribe(function(newValue){
            for (var i = 0; i<self.locationsList().length; i++){
                var locationName = self.locationsList()[i].name.toLowerCase();
                var targetString = newValue.toLowerCase();
                if (locationName.indexOf(targetString) === -1){
                    self.locationsList()[i].display(false);
                    self.locationsList()[i].marker.setVisible(false);
                }else{
                    self.locationsList()[i].display(true);
                    self.locationsList()[i].marker.setVisible(true);
                }
            }
        });
        /**
         * Draw ALL markers on map
         */
        self.drawMarkers = function(){
            for(var i = 0; i< self.locationsList().length; i++){
                var currentItem = self.locationsList()[i];
                if (currentItem.display() === true){
                    self.addMarkerWithAnimation(currentItem, i*100);
                } else if(currentItem.marker !== null) {
                    currentItem.marker.setVisible(false);
                }
            }
        };
        /**
         * Will draw marker with animation and add an event listener
         * to activate the chosen marker
         */
        self.addMarkerWithAnimation = function(currentItem, timeout){
            window.setTimeout(function(){
                currentItem.marker = new google.maps.Marker({
                    position: {lat: currentItem.lat, lng: currentItem.lng},
                    animation: google.maps.Animation.DROP,
                    icon: pins.default.pinImage,
                    map: self.myMap.map
                });
                currentItem.marker.addListener('click', function(){
                    self.activateMarker.call(currentItem); // We use .call() to specify the this value of the activateMarker function
                });
            }, timeout);
        };

        /**
         * Activate marker: change color, bounce, open info window
         */
        self.activateMarker = function(){
            var marker = this.marker;
            if (window.innerWidth < 800) {
                self.menuVisible(false);
            }
            // TO REVIEWER: INFO WINDOWS GO OUT OF THE SCREEN IN SMALL DEVICES
            // HOW CAN I FIX THIS.
            self.myMap.map.panTo(marker.getPosition());
            self.infoWindow.setContent('<i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i><span class="sr-only">Loading...</span>');
            self.infoWindow.open(self.myMap, marker);
            var location = this;
            self.inactiveAll();
            location.active(true);
            self.activeColor(marker);
            self.Bounce(marker);
            self.initContent(location);
        };
        /**
         * Deactivate all markers: change color, bounce, open info window
         */
        self.inactiveAll = function(){
            for(var i = 0; i< self.locationsList().length; i++){
                var currentItem = self.locationsList()[i];
                currentItem.active(false);
                self.defaultColor(currentItem.marker);
            }
        };
        /**
         * Bounce marker
         */
        self.Bounce = function(currentMarker){
            if (currentMarker.getAnimation() !== null) {
                currentMarker.setAnimation(null);
            } else {
                currentMarker.setAnimation(google.maps.Animation.BOUNCE);
                window.setTimeout(function(){
                    currentMarker.setAnimation(null);
                },700);
            }
        };
        /**
         * Set "active" icon on current marker
         */
        self.activeColor = function(currentMarker){
            currentMarker.setIcon(pins.active.pinImage);
        };
        /**
         * Set "default" icon on current marker
         */
        self.defaultColor = function(currentMarker){
            currentMarker.setIcon(pins.default.pinImage);
        };
        /**
         * Set "default" icon on ALL markers
         */
        self.defaultColorAll = function(){
            for(var i = 0; i< self.locationsList().length; i++){
                var currentItem = self.locationsList()[i];
                self.defaultColor(currentItem.marker);
            }
        };

        self.toggleMenu = function(){
            self.menuVisible() ? self.menuVisible(false) : self.menuVisible(true); 
        };
    };

    ko.applyBindings(new MyViewModel());
}

//**********************************
/* googleSuccess() is the callback function that will run when Google Maps Api
/* loads.
/* googleSuccess(): calls the initiateView() function .
*/
function googleSuccess(){
    'use strict';
    initiateView();
}
//**********************************
/* googleError() will run if Google Maps Api does not load properly. It just
/* displays an error message.
*/
function googleError(){
    'use strict';
    $('body').html('');
    $('body').append("<h1>There was an error loading Google Maps. Please try again later.</h1>");
}