
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhbGwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuLyogaW5pdGlhdGVWaWV3KCkgd3JhcHMgdGhlIHdob2xlIHBhZ2UgZnVuY3Rpb25hbGl0eS4gQWxsIGZ1bmN0aW9ucyBhbmQgdmFyaWFibGVzXG4vKiBhcmUgaW5pdGlhbGl6ZWQgYW5kIHNldCB1cCBhbmQgdGhlbiBrby5hcHBseUJpbmRpbmdzKG5ldyBNeVZpZXdNb2RlbCkgaXNcbi8qIGNhbGxlZCwgd2hpY2ggd2lsbCBpbml0aWFsaXplIHRoZSB2YXJpYWJsZXMuXG4qL1xuZnVuY3Rpb24gaW5pdGlhdGVWaWV3KCl7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIC8vIHBpbnM6IHdpbGwgaG9sZCBzb21lIHBlcnNvbmlsaXplZCBzdHlsZXMgZm9yIHRoZSBtYXJrZXJzXG4gICAgdmFyIHBpbnMgPSB7XG4gICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgIHBpbkltYWdlIDogbmV3IGdvb2dsZS5tYXBzLk1hcmtlckltYWdlKCdodHRwOi8vY2hhcnQuYXBpcy5nb29nbGUuY29tL2NoYXJ0P2Noc3Q9ZF9tYXBfcGluX2xldHRlciZjaGxkPSVFMiU4MCVBMnwnICtcbiAgICAgICAgICAgICdERDg4ODgnLFxuICAgICAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlNpemUoMjEsIDM0KSxcbiAgICAgICAgICAgIG5ldyBnb29nbGUubWFwcy5Qb2ludCgwLDApLFxuICAgICAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlBvaW50KDEwLCAzNCkpXG4gICAgICAgIH0sXG4gICAgICAgIGFjdGl2ZToge1xuICAgICAgICAgICAgcGluSW1hZ2UgOiBuZXcgZ29vZ2xlLm1hcHMuTWFya2VySW1hZ2UoJ2h0dHA6Ly9jaGFydC5hcGlzLmdvb2dsZS5jb20vY2hhcnQ/Y2hzdD1kX21hcF9waW5fbGV0dGVyJmNobGQ9JUUyJTgwJUEyfCcgK1xuICAgICAgICAgICAgJ0FBRERERCcsXG4gICAgICAgICAgICBuZXcgZ29vZ2xlLm1hcHMuU2l6ZSgyMSwgMzQpLFxuICAgICAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlBvaW50KDAsMCksXG4gICAgICAgICAgICBuZXcgZ29vZ2xlLm1hcHMuUG9pbnQoMTAsIDM0KSlcblxuICAgICAgICB9XG4gICAgfTtcbiAgICAvLyBuZWlnaGJvcmhvb2RNYXA6IHdpbGwgaG9sZCB0aGUgR29vZ2xlIE1hcHMgb2JqZWN0XG4gICAgdmFyIG5laWdoYm9yaG9vZE1hcCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHRoaXMubWFwRGl2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hcCcpO1xuICAgICAgICB0aGlzLmNlbnRlck1hcCA9IHtsYXQ6IDQzLjI2MzIyNCwgbG5nOiAtMi45MzUwMDN9O1xuICAgICAgICB0aGlzLnpvb20gPSAxNTtcbiAgICAgICAgdGhpcy5tYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwKHRoaXMubWFwRGl2LCB7XG4gICAgICAgICAgICB6b29tOiB0aGlzLnpvb20sXG4gICAgICAgICAgICBjZW50ZXI6IHRoaXMuY2VudGVyTWFwXG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgLy8gbG9jYXRpb246IHdpbGwgaG9sZCBhbGwgdGhlIGRhdGEgb2YgYSBzcGVjaWZpYyBsb2NhdGlvblxuICAgIHZhciBMb2NhdGlvbiA9IGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICB0aGlzLm5hbWUgPSBkYXRhLm5hbWU7XG4gICAgICAgIHRoaXMubGF0ID0gcGFyc2VGbG9hdChkYXRhLmxvY2F0aW9uLmNvb3JkaW5hdGUubGF0aXR1ZGUpO1xuICAgICAgICB0aGlzLmxuZyA9IHBhcnNlRmxvYXQoZGF0YS5sb2NhdGlvbi5jb29yZGluYXRlLmxvbmdpdHVkZSk7XG4gICAgICAgIHRoaXMuYWRkcmVzcyA9IGRhdGEubG9jYXRpb24uYWRkcmVzcy5qb2luKCcgJyk7XG4gICAgICAgIHRoaXMucGhvbmUgPSBkYXRhLmRpc3BsYXlfcGhvbmU7XG4gICAgICAgIHRoaXMuY2l0eSA9IGRhdGEubG9jYXRpb24uY2l0eTtcbiAgICAgICAgdGhpcy5wb3N0YWxfY29kZSA9IGRhdGEubG9jYXRpb24ucG9zdGFsX2NvZGU7XG4gICAgICAgIHRoaXMueWVscF9yYXRpbmcgPSBkYXRhLnJhdGluZztcbiAgICAgICAgdGhpcy5yZXZpZXdfY291bnQgPSBkYXRhLnJldmlld19jb3VudDtcbiAgICAgICAgdGhpcy5yYXRpbmdfaW1nX3VybCA9IGRhdGEucmF0aW5nX2ltZ191cmw7XG4gICAgICAgIHRoaXMuZGlzcGxheSA9IGtvLm9ic2VydmFibGUodHJ1ZSk7IC8vIHRoaXMgd2lsbCBiZSB1c2VmdWwgdG8gZmlsdGVyIHRoZSBtYXJrZXJcbiAgICAgICAgdGhpcy5tYXJrZXIgPSBudWxsOyBcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTsgLy8gdGhpcyB3aWxsIGJlIHVzZWZ1bCB0byBoaWdobGlnaHQgdGhlIGN1cnJlbnQgbWFya2VyXG4gICAgfTtcblxuICAgIHZhciBNeVZpZXdNb2RlbCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi5tZW51VmlzaWJsZSA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xuICAgICAgICBzZWxmLnllbHBfbG9jYXRpb25zOyAvLyB5ZWxwX2xvY2F0aW9uOiB3aWxsIGhvbGQgdGhlIGZyb20gdGhlIFllbHAgQXBpXG4gICAgICAgIHNlbGYubG9jYXRpb25zTGlzdCA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7IC8vIHdpbGwgaG9sZCBhIGxpc3Qgb2YgTG9jYXRpb24gb2JqZWN0cyAobGluZSAzNylcbiAgICAgICAgc2VsZi5teU1hcCA9IG5ldyBuZWlnaGJvcmhvb2RNYXAoKTtcbiAgICAgICAgc2VsZi5jdXJyZW50RmlsdGVyID0ga28ub2JzZXJ2YWJsZSgnJyk7XG4gICAgICAgIHNlbGYuaW5mb1dpbmRvdyA9IG5ldyBnb29nbGUubWFwcy5JbmZvV2luZG93KCk7XG4gICAgICAgIC8qKiBZRUxQIEFQSSAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAqIEdlbmVyYXRlcyBhIHJhbmRvbSBudW1iZXIgYW5kIHJldHVybnMgaXQgYXMgYSBzdHJpbmcgZm9yIE9BdXRoZW50aWNhdGlvblxuICAgICAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBub25jZV9nZW5lcmF0ZSgpIHtcbiAgICAgICAgICAgIHJldHVybiAoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMWUxMikudG9TdHJpbmcoKSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIFlFTFBfQkFTRV9VUkwgPSAnaHR0cHM6Ly9hcGkueWVscC5jb20vdjIvc2VhcmNoPyc7XG4gICAgICAgIHZhciB5ZWxwX3VybCA9IFlFTFBfQkFTRV9VUkw7XG4gICAgICAgIHZhciBwYXJhbWV0ZXJzID0ge1xuICAgICAgICAgICAgb2F1dGhfY29uc3VtZXJfa2V5OiAnUzgtOFRpYVBTY21Wd1N0dVIxR0FfUScsXG4gICAgICAgICAgICBvYXV0aF90b2tlbjogJ1VvQTdtMTg1MXlhT3NGenNiQmdRT2xpTURHU2VyX0dzJyxcbiAgICAgICAgICAgIG9hdXRoX25vbmNlOiBub25jZV9nZW5lcmF0ZSgpLFxuICAgICAgICAgICAgb2F1dGhfdGltZXN0YW1wOiBNYXRoLmZsb29yKERhdGUubm93KCkvMTAwMCksXG4gICAgICAgICAgICBvYXV0aF9zaWduYXR1cmVfbWV0aG9kOiAnSE1BQy1TSEExJyxcbiAgICAgICAgICAgIG9hdXRoX3ZlcnNpb24gOiAnMS4wJyxcbiAgICAgICAgICAgIGNhbGxiYWNrOiAnY2InLCAvLyBUaGlzIGlzIGNydWNpYWwgdG8gaW5jbHVkZSBmb3IganNvbnAgaW1wbGVtZW50YXRpb24gaW4gQUpBWCBvciBlbHNlIHRoZSBvYXV0aC1zaWduYXR1cmUgd2lsbCBiZSB3cm9uZy5cbiAgICAgICAgICAgIGxvY2F0aW9uOiAnQmlsYmFvK1NwYWluJyxcbiAgICAgICAgICAgIHRlcm06ICdyZXN0YXVyYW50JyxcbiAgICAgICAgICAgIGxpbWl0OiAyMCxcbiAgICAgICAgICAgIHNvcnQ6IDEsXG4gICAgICAgICAgICBjbGw6ICc0My4yNjMyMjQsQy0yLjkzNTAwMydcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGVuY29kZWRTaWduYXR1cmUgPSBvYXV0aFNpZ25hdHVyZS5nZW5lcmF0ZSgnR0VUJyx5ZWxwX3VybCwgcGFyYW1ldGVycywgJ1BVYWRjVERwXzljMURoUkQ3cGtmcEU3UkRNaycsICdvdFBHelpELUJ4b3dObTdZeWxWekdWQjFDaVEnKTtcbiAgICAgICAgcGFyYW1ldGVycy5vYXV0aF9zaWduYXR1cmUgPSBlbmNvZGVkU2lnbmF0dXJlO1xuICAgICAgICB2YXIgc2V0dGluZ3MgPSB7XG4gICAgICAgICAgICB1cmw6IHllbHBfdXJsLFxuICAgICAgICAgICAgZGF0YTogcGFyYW1ldGVycyxcbiAgICAgICAgICAgIGNhY2hlOiB0cnVlLCAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGNydWNpYWwgdG8gaW5jbHVkZSBhcyB3ZWxsIHRvIHByZXZlbnQgalF1ZXJ5IGZyb20gYWRkaW5nIG9uIGEgY2FjaGUtYnVzdGVyIHBhcmFtZXRlciBcIl89MjM0ODk0ODk3NDk4MzdcIiwgaW52YWxpZGF0aW5nIG91ciBvYXV0aC1zaWduYXR1cmVcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbnAnXG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZW5kcyBhamF4IHJlcXVlc3QgdG8gWWVscCBBcGlcbiAgICAgICAgICovXG4gICAgICAgICQuYWpheChzZXR0aW5ncykuZG9uZShmdW5jdGlvbihyZXN1bHRzKSB7XG4gICAgICAgICAgICBzZWxmLnllbHBfbG9jYXRpb25zID0gcmVzdWx0cy5idXNpbmVzc2VzO1xuICAgICAgICAgICAgc2VsZi5pbml0KCk7XG4gICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkKCdib2R5JykuaHRtbCgnJyk7XG4gICAgICAgICAgICAkKCdib2R5JykuYXBwZW5kKCc8aDE+VGhlcmUgd2FzIGFuIGVycm9yIGZldGNoaW5nIGRhdGEgZnJvbSBZZWxwIEFQSS4gVHJ5IGFnYWluIGxhdGVyLjwvaDE+Jyk7XG4gICAgICAgIH0pO1xuICAgICAgICAvKiogR09PR0xFIFBMQUNFUyBBUEkgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgKi9cbiAgICAgICAgc2VsZi5zZXJ2aWNlID0gbmV3IGdvb2dsZS5tYXBzLnBsYWNlcy5QbGFjZXNTZXJ2aWNlKHNlbGYubXlNYXAubWFwKTtcbiAgICAgICAgc2VsZi5yZXRyaWV2ZVBsYWNlc0RldGFpbHMgPSBmdW5jdGlvbihyZXN1bHRzLCBzdGF0dXMsIGxvY2F0aW9uKXtcbiAgICAgICAgICAgIHZhciByZXF1ZXN0ID0ge1xuICAgICAgICAgICAgICAgIHBsYWNlSWQ6IHJlc3VsdHNbMF0ucGxhY2VfaWRcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBzZWxmLnNlcnZpY2UuZ2V0RGV0YWlscyhyZXF1ZXN0LGZ1bmN0aW9uKHJlc3VsdCxzdGF0dXMpe1xuICAgICAgICAgICAgICAgIGxvY2F0aW9uLnBsYWNlX2lkID0gcmVzdWx0LnBsYWNlX2lkID8gcmVzdWx0LnBsYWNlX2lkIDogbnVsbDtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbi5waG90b3NfYXJyYXkgPSByZXN1bHQucGhvdG9zID8gcmVzdWx0LnBob3RvcyA6IG51bGw7XG4gICAgICAgICAgICAgICAgbG9jYXRpb24uZmlyc3RfcGljdHVyZV91cmwgPSByZXN1bHQucGhvdG9zID8gcmVzdWx0LnBob3Rvc1swXS5nZXRVcmwoeydtYXhIZWlnaHQnOiAzMDAsICdtYXhXaWR0aCc6IDMwMH0pOm51bGw7XG4gICAgICAgICAgICAgICAgbG9jYXRpb24ud2Vic2l0ZSA9IHJlc3VsdC53ZWJzaXRlID8gcmVzdWx0LndlYnNpdGUgOiAnJztcbiAgICAgICAgICAgICAgICBsb2NhdGlvbi5yYXRpbmcgPSByZXN1bHQucmF0aW5nID8gcmVzdWx0LnJhdGluZyA6ICdObyByYXRpbmcgYXZhaWxhYmxlJztcbiAgICAgICAgICAgICAgICBzZWxmLnByZXBhcmVJbmZvV2luZG93Q29udGVudChsb2NhdGlvbik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLnJldHJpZXZlSW5mb0dvb2dsZVBsYWNlcyA9IGZ1bmN0aW9uKGxvY2F0aW9uKXtcbiAgICAgICAgICAgIHNlbGYuc2VydmljZS5uZWFyYnlTZWFyY2goe1xuICAgICAgICAgICAgICAgIGxvY2F0aW9uOiBzZWxmLm15TWFwLmNlbnRlck1hcCxcbiAgICAgICAgICAgICAgICByYWRpdXM6IDIwMDAsXG4gICAgICAgICAgICAgICAga2V5d29yZDogbG9jYXRpb24ubmFtZVxuICAgICAgICAgICAgfSwgZnVuY3Rpb24ocmVzdWx0LCBzdGF0dXMpe1xuICAgICAgICAgICAgICAgIGlmIChzdGF0dXMgPT09IFwiT0tcIil7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYucmV0cmlldmVQbGFjZXNEZXRhaWxzKHJlc3VsdCwgc3RhdHVzLCBsb2NhdGlvbik7IC8vIGNhbGwgZnVuY3Rpb24gaW4gbGluZSAxMDZcbiAgICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgJCgnYm9keScpLmh0bWwoJycpO1xuICAgICAgICAgICAgICAgICAgICAkKCdib2R5JykuYXBwZW5kKCc8aDE+VGhlcmUgd2FzIGFuIGVycm9yIGxvYWRpbmcgR29vZ2xlIFBsYWNlcyBBUEkuIFBsZWFzZSB0cnkgYWdhaW4gbGF0ZXIuPC9oMT4nKTtcbiAgICAgICAgICAgICAgICAgICAgJCgnYm9keScpLmFwcGVuZCgnPGgzPkVSUk9SIE1FU1NBR0U6ICcrc3RhdHVzKyc8L2gzPicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqIFNFVCBVUCBJTkZPV0lORE9XICoqKioqKioqKioqKioqXG4gICAgICAgICAqL1xuICAgICAgICBzZWxmLmluaXRDb250ZW50ID0gZnVuY3Rpb24obG9jYXRpb24pe1xuICAgICAgICAgICAgc2VsZi5yZXRyaWV2ZUluZm9Hb29nbGVQbGFjZXMobG9jYXRpb24pOyAvLyBjYWxsIGZ1bmN0aW9uIGluIGxpbmUgMTIxXG4gICAgICAgIH07XG5cbiAgICAgICAgc2VsZi5wcmVwYXJlSW5mb1dpbmRvd0NvbnRlbnQgPSBmdW5jdGlvbihsb2NhdGlvbil7XG4gICAgICAgICAgICB2YXIgcGljdHVyZVN0cmluZyA9IGxvY2F0aW9uLmZpcnN0X3BpY3R1cmVfdXJsID8gXCI8aWZyYW1lIHdpZHRoPSczMDAnIGhlaWdodD0nYXV0bycgZnJhbWVib3JkZXI9JzAnIHNyYz0nXCIrbG9jYXRpb24uZmlyc3RfcGljdHVyZV91cmwrXCInPjwvaWZyYW1lPlwiOiAnJztcbiAgICAgICAgICAgIHZhciBjb250ZW50U3RyaW5nID0gXCI8ZGl2IGNsYXNzPSdpbmZvV2luJz5cIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ltYWdlQ29udGVudCc+XCIrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGljdHVyZVN0cmluZyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjwvZGl2PlwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSd0ZXh0Q29udGVudCc+XCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPGg1IGNsYXNzPSdpbmZvVGl0bGUnPlwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbi5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjwvaDU+XCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPHVsIGNsYXNzPSdpbmZvRGF0YSc+XCIrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPGxpPiBUZWwuIFwiK2xvY2F0aW9uLnBob25lK1wiPC9saT5cIitcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8bGk+XCIrbG9jYXRpb24uYWRkcmVzcytcIjwvbGk+XCIrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPGxpPlwiK2xvY2F0aW9uLnBvc3RhbF9jb2RlK1wiIFwiK2xvY2F0aW9uLmNpdHkrXCI8L2xpPlwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxsaT5cIitcIjxhIGhyZWY9J1wiK2xvY2F0aW9uLndlYnNpdGUrXCInIHRhcmdldD0nX2JsYW5rJz5cIitsb2NhdGlvbi53ZWJzaXRlK1wiPC9hPjwvbGk+XCIrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8L3VsPlwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8L2Rpdj5cIitcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0ncmF0aW5nc0NvbnRlbnQnPlwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPGltZyBzcmM9J1wiK2xvY2F0aW9uLnJhdGluZ19pbWdfdXJsICtcIicgYWx0PSd5ZWxwIHN0YXIgcmF0aW5nJz5cIitcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxzcGFuIGNsYXNzPSdyZXZpZXdDb3VudCc+IFwiK2xvY2F0aW9uLnJldmlld19jb3VudCtcIiBZZWxwIHJldmlld3M8L3NwYW4+XCIrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjwvZGl2PlwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjwvZGl2PlwiO1xuICAgICAgICAgICAgc2VsZi5pbmZvV2luZG93LnNldENvbnRlbnQoY29udGVudFN0cmluZyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqIFNFVCBVUCBNQVJLRVJTIEFORCBUSEVJUiBGVU5DVElPTkFMSVRZICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgKi9cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBvcHVsYXRlIGxvY2F0aW9uc0xpc3QgYW5kIGRyYXcgbWFya2VycyBvbiBtYXBcbiAgICAgICAgICovXG4gICAgICAgIHNlbGYuaW5pdCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBzZWxmLnllbHBfbG9jYXRpb25zLmZvckVhY2goZnVuY3Rpb24obG9jYXRpb25JdGVtKXtcbiAgICAgICAgICAgICAgICBzZWxmLmxvY2F0aW9uc0xpc3QucHVzaChuZXcgTG9jYXRpb24obG9jYXRpb25JdGVtKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHNlbGYuZHJhd01hcmtlcnMoKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEJ1aWxkIGFuIGV2ZW50IGhhbmRsZXIgdGhhdCB3aWxsIGZpbHRlciBsb2NhdGlvbnNcbiAgICAgICAgICovXG4gICAgICAgIHNlbGYuY3VycmVudEZpbHRlci5zdWJzY3JpYmUoZnVuY3Rpb24obmV3VmFsdWUpe1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGk8c2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciBsb2NhdGlvbk5hbWUgPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXS5uYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgdmFyIHRhcmdldFN0cmluZyA9IG5ld1ZhbHVlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgaWYgKGxvY2F0aW9uTmFtZS5pbmRleE9mKHRhcmdldFN0cmluZykgPT09IC0xKXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5sb2NhdGlvbnNMaXN0KClbaV0uZGlzcGxheShmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubG9jYXRpb25zTGlzdCgpW2ldLm1hcmtlci5zZXRWaXNpYmxlKGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5sb2NhdGlvbnNMaXN0KClbaV0uZGlzcGxheSh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5sb2NhdGlvbnNMaXN0KClbaV0ubWFya2VyLnNldFZpc2libGUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIERyYXcgQUxMIG1hcmtlcnMgb24gbWFwXG4gICAgICAgICAqL1xuICAgICAgICBzZWxmLmRyYXdNYXJrZXJzID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGk8IHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudEl0ZW0uZGlzcGxheSgpID09PSB0cnVlKXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5hZGRNYXJrZXJXaXRoQW5pbWF0aW9uKGN1cnJlbnRJdGVtLCBpKjEwMCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmKGN1cnJlbnRJdGVtLm1hcmtlciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIuc2V0VmlzaWJsZShmYWxzZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogV2lsbCBkcmF3IG1hcmtlciB3aXRoIGFuaW1hdGlvbiBhbmQgYWRkIGFuIGV2ZW50IGxpc3RlbmVyXG4gICAgICAgICAqIHRvIGFjdGl2YXRlIHRoZSBjaG9zZW4gbWFya2VyXG4gICAgICAgICAqL1xuICAgICAgICBzZWxmLmFkZE1hcmtlcldpdGhBbmltYXRpb24gPSBmdW5jdGlvbihjdXJyZW50SXRlbSwgdGltZW91dCl7XG4gICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjoge2xhdDogY3VycmVudEl0ZW0ubGF0LCBsbmc6IGN1cnJlbnRJdGVtLmxuZ30sXG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogZ29vZ2xlLm1hcHMuQW5pbWF0aW9uLkRST1AsXG4gICAgICAgICAgICAgICAgICAgIGljb246IHBpbnMuZGVmYXVsdC5waW5JbWFnZSxcbiAgICAgICAgICAgICAgICAgICAgbWFwOiBzZWxmLm15TWFwLm1hcFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlci5hZGRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmFjdGl2YXRlTWFya2VyLmNhbGwoY3VycmVudEl0ZW0pOyAvLyBXZSB1c2UgLmNhbGwoKSB0byBzcGVjaWZ5IHRoZSB0aGlzIHZhbHVlIG9mIHRoZSBhY3RpdmF0ZU1hcmtlciBmdW5jdGlvblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSwgdGltZW91dCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFjdGl2YXRlIG1hcmtlcjogY2hhbmdlIGNvbG9yLCBib3VuY2UsIG9wZW4gaW5mbyB3aW5kb3dcbiAgICAgICAgICovXG4gICAgICAgIHNlbGYuYWN0aXZhdGVNYXJrZXIgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIG1hcmtlciA9IHRoaXMubWFya2VyO1xuICAgICAgICAgICAgaWYgKHdpbmRvdy5pbm5lcldpZHRoIDwgODAwKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5tZW51VmlzaWJsZShmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBUTyBSRVZJRVdFUjogSU5GTyBXSU5ET1dTIEdPIE9VVCBPRiBUSEUgU0NSRUVOIElOIFNNQUxMIERFVklDRVNcbiAgICAgICAgICAgIC8vIEhPVyBDQU4gSSBGSVggVEhJUy5cbiAgICAgICAgICAgIHNlbGYubXlNYXAubWFwLnBhblRvKG1hcmtlci5nZXRQb3NpdGlvbigpKTtcbiAgICAgICAgICAgIHNlbGYuaW5mb1dpbmRvdy5zZXRDb250ZW50KCc8aSBjbGFzcz1cImZhIGZhLXNwaW5uZXIgZmEtcHVsc2UgZmEtM3ggZmEtZndcIj48L2k+PHNwYW4gY2xhc3M9XCJzci1vbmx5XCI+TG9hZGluZy4uLjwvc3Bhbj4nKTtcbiAgICAgICAgICAgIHNlbGYuaW5mb1dpbmRvdy5vcGVuKHNlbGYubXlNYXAsIG1hcmtlcik7XG4gICAgICAgICAgICB2YXIgbG9jYXRpb24gPSB0aGlzO1xuICAgICAgICAgICAgc2VsZi5pbmFjdGl2ZUFsbCgpO1xuICAgICAgICAgICAgbG9jYXRpb24uYWN0aXZlKHRydWUpO1xuICAgICAgICAgICAgc2VsZi5hY3RpdmVDb2xvcihtYXJrZXIpO1xuICAgICAgICAgICAgc2VsZi5Cb3VuY2UobWFya2VyKTtcbiAgICAgICAgICAgIHNlbGYuaW5pdENvbnRlbnQobG9jYXRpb24pO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogRGVhY3RpdmF0ZSBhbGwgbWFya2VyczogY2hhbmdlIGNvbG9yLCBib3VuY2UsIG9wZW4gaW5mbyB3aW5kb3dcbiAgICAgICAgICovXG4gICAgICAgIHNlbGYuaW5hY3RpdmVBbGwgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgZm9yKHZhciBpID0gMDsgaTwgc2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50SXRlbSA9IHNlbGYubG9jYXRpb25zTGlzdCgpW2ldO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLmFjdGl2ZShmYWxzZSk7XG4gICAgICAgICAgICAgICAgc2VsZi5kZWZhdWx0Q29sb3IoY3VycmVudEl0ZW0ubWFya2VyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEJvdW5jZSBtYXJrZXJcbiAgICAgICAgICovXG4gICAgICAgIHNlbGYuQm91bmNlID0gZnVuY3Rpb24oY3VycmVudE1hcmtlcil7XG4gICAgICAgICAgICBpZiAoY3VycmVudE1hcmtlci5nZXRBbmltYXRpb24oKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRNYXJrZXIuc2V0QW5pbWF0aW9uKG51bGwpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50TWFya2VyLnNldEFuaW1hdGlvbihnb29nbGUubWFwcy5BbmltYXRpb24uQk9VTkNFKTtcbiAgICAgICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50TWFya2VyLnNldEFuaW1hdGlvbihudWxsKTtcbiAgICAgICAgICAgICAgICB9LDcwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXQgXCJhY3RpdmVcIiBpY29uIG9uIGN1cnJlbnQgbWFya2VyXG4gICAgICAgICAqL1xuICAgICAgICBzZWxmLmFjdGl2ZUNvbG9yID0gZnVuY3Rpb24oY3VycmVudE1hcmtlcil7XG4gICAgICAgICAgICBjdXJyZW50TWFya2VyLnNldEljb24ocGlucy5hY3RpdmUucGluSW1hZ2UpO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogU2V0IFwiZGVmYXVsdFwiIGljb24gb24gY3VycmVudCBtYXJrZXJcbiAgICAgICAgICovXG4gICAgICAgIHNlbGYuZGVmYXVsdENvbG9yID0gZnVuY3Rpb24oY3VycmVudE1hcmtlcil7XG4gICAgICAgICAgICBjdXJyZW50TWFya2VyLnNldEljb24ocGlucy5kZWZhdWx0LnBpbkltYWdlKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNldCBcImRlZmF1bHRcIiBpY29uIG9uIEFMTCBtYXJrZXJzXG4gICAgICAgICAqL1xuICAgICAgICBzZWxmLmRlZmF1bHRDb2xvckFsbCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpPCBzZWxmLmxvY2F0aW9uc0xpc3QoKS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRJdGVtID0gc2VsZi5sb2NhdGlvbnNMaXN0KClbaV07XG4gICAgICAgICAgICAgICAgc2VsZi5kZWZhdWx0Q29sb3IoY3VycmVudEl0ZW0ubWFya2VyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLnRvZ2dsZU1lbnUgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgc2VsZi5tZW51VmlzaWJsZSgpID8gc2VsZi5tZW51VmlzaWJsZShmYWxzZSkgOiBzZWxmLm1lbnVWaXNpYmxlKHRydWUpOyBcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAga28uYXBwbHlCaW5kaW5ncyhuZXcgTXlWaWV3TW9kZWwoKSk7XG59XG5cbi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuLyogZ29vZ2xlU3VjY2VzcygpIGlzIHRoZSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IHdpbGwgcnVuIHdoZW4gR29vZ2xlIE1hcHMgQXBpXG4vKiBsb2Fkcy5cbi8qIGdvb2dsZVN1Y2Nlc3MoKTogY2FsbHMgdGhlIGluaXRpYXRlVmlldygpIGZ1bmN0aW9uIC5cbiovXG5mdW5jdGlvbiBnb29nbGVTdWNjZXNzKCl7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIGluaXRpYXRlVmlldygpO1xufVxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4vKiBnb29nbGVFcnJvcigpIHdpbGwgcnVuIGlmIEdvb2dsZSBNYXBzIEFwaSBkb2VzIG5vdCBsb2FkIHByb3Blcmx5LiBJdCBqdXN0XG4vKiBkaXNwbGF5cyBhbiBlcnJvciBtZXNzYWdlLlxuKi9cbmZ1bmN0aW9uIGdvb2dsZUVycm9yKCl7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgICQoJ2JvZHknKS5odG1sKCcnKTtcbiAgICAkKCdib2R5JykuYXBwZW5kKFwiPGgxPlRoZXJlIHdhcyBhbiBlcnJvciBsb2FkaW5nIEdvb2dsZSBNYXBzLiBQbGVhc2UgdHJ5IGFnYWluIGxhdGVyLjwvaDE+XCIpO1xufSJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
