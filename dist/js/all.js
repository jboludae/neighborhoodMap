
//**********************************
/* initiateView() wraps the whole page functionality. All functions and variables
/* are initialized and set up and then ko.applyBindings(new myViewModel) is
/* called, which will initialize the variables.
*/
function initiateView(){
    // pins: will hold some personilized styles for the markers
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
        this.address = data.location.address.join(" ");
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

    var myViewModel = function(){
        var self = this;
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
            dataType: 'jsonp',
            success: function(results) {
              self.yelp_locations = results.businesses;
              self.init();
            },
            error: function() {
                $('body').html('');
                $('body').append("<h1>There was an error fetching data from Yelp API. Try again later.</h1>");
            }
        };
        /**
         * Sends ajax request to Yelp Api
         */
        $.ajax(settings);
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
                self.retrievePlacesDetails(result, status, location); // call function in line 106
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
        var subscription = self.currentFilter.subscribe(function(newValue){
            for (var i = 0; i<self.locationsList().length; i++){
                var locationName = self.locationsList()[i].name.toLowerCase();
                targetString = newValue.toLowerCase();
                (locationName.indexOf(targetString) === -1) ? 
                    self.locationsList()[i].display(false) :
                    self.locationsList()[i].display(true);
            }
            self.redrawMarkers();
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
                    currentItem.marker.setMap(null);
                }
            }
        };
        /**
         * Draw markers with display property is set to true
         */
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
        /**
         * Remove all markers from map
         */
        self.clearMarkers = function(){
            for(var i = 0; i< self.locationsList().length; i++){
                var currentItem = self.locationsList()[i];
                currentItem.marker.setMap(null);
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
            var location = this;
            self.inactiveAll();
            location.active(true);
            self.activeColor(marker);
            self.Bounce(marker);
            self.initContent(location);
            self.infoWindow.open(self.myMap, marker);
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
            var container_element = $(".navigation_list");
            container_element.hasClass("slide") ? container_element.removeClass("slide") : container_element.addClass("slide");
        };
    };

    ko.applyBindings(new myViewModel);
};

//**********************************
/* googleSuccess() is the callback function that will run when Google Maps Api
/* loads.
/* googleSuccess(): calls the initiateView() function .
*/
function googleSuccess(){
    initiateView();
};
//**********************************
/* googleError() will run if Google Maps Api does not load properly. It just
/* displays an error message.
*/
function googleError(){
    $('body').html('');
    $('body').append("<h1>There was an error loading Google Maps. Please try again later.</h1>");
};


        
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYWxsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4vLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbi8qIGluaXRpYXRlVmlldygpIHdyYXBzIHRoZSB3aG9sZSBwYWdlIGZ1bmN0aW9uYWxpdHkuIEFsbCBmdW5jdGlvbnMgYW5kIHZhcmlhYmxlc1xuLyogYXJlIGluaXRpYWxpemVkIGFuZCBzZXQgdXAgYW5kIHRoZW4ga28uYXBwbHlCaW5kaW5ncyhuZXcgbXlWaWV3TW9kZWwpIGlzXG4vKiBjYWxsZWQsIHdoaWNoIHdpbGwgaW5pdGlhbGl6ZSB0aGUgdmFyaWFibGVzLlxuKi9cbmZ1bmN0aW9uIGluaXRpYXRlVmlldygpe1xuICAgIC8vIHBpbnM6IHdpbGwgaG9sZCBzb21lIHBlcnNvbmlsaXplZCBzdHlsZXMgZm9yIHRoZSBtYXJrZXJzXG4gICAgdmFyIHBpbnMgPSB7XG4gICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgIHBpbkltYWdlIDogbmV3IGdvb2dsZS5tYXBzLk1hcmtlckltYWdlKFwiaHR0cDovL2NoYXJ0LmFwaXMuZ29vZ2xlLmNvbS9jaGFydD9jaHN0PWRfbWFwX3Bpbl9sZXR0ZXImY2hsZD0lRTIlODAlQTJ8XCIgK1xuICAgICAgICAgICAgJ0REODg4OCcsXG4gICAgICAgICAgICBuZXcgZ29vZ2xlLm1hcHMuU2l6ZSgyMSwgMzQpLFxuICAgICAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlBvaW50KDAsMCksXG4gICAgICAgICAgICBuZXcgZ29vZ2xlLm1hcHMuUG9pbnQoMTAsIDM0KSlcbiAgICAgICAgfSxcbiAgICAgICAgYWN0aXZlOiB7XG4gICAgICAgICAgICBwaW5JbWFnZSA6IG5ldyBnb29nbGUubWFwcy5NYXJrZXJJbWFnZShcImh0dHA6Ly9jaGFydC5hcGlzLmdvb2dsZS5jb20vY2hhcnQ/Y2hzdD1kX21hcF9waW5fbGV0dGVyJmNobGQ9JUUyJTgwJUEyfFwiICtcbiAgICAgICAgICAgICdBQUREREQnLFxuICAgICAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlNpemUoMjEsIDM0KSxcbiAgICAgICAgICAgIG5ldyBnb29nbGUubWFwcy5Qb2ludCgwLDApLFxuICAgICAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlBvaW50KDEwLCAzNCkpXG5cbiAgICAgICAgfVxuICAgIH07XG4gICAgLy8gbmVpZ2hib3Job29kTWFwOiB3aWxsIGhvbGQgdGhlIEdvb2dsZSBNYXBzIG9iamVjdFxuICAgIHZhciBuZWlnaGJvcmhvb2RNYXAgPSBmdW5jdGlvbigpe1xuICAgICAgICB0aGlzLm1hcERpdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXAnKTtcbiAgICAgICAgdGhpcy5jZW50ZXJNYXAgPSB7bGF0OiA0My4yNjMyMjQsIGxuZzogLTIuOTM1MDAzfTtcbiAgICAgICAgdGhpcy56b29tID0gMTU7XG4gICAgICAgIHRoaXMubWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcCh0aGlzLm1hcERpdiwge1xuICAgICAgICAgICAgem9vbTogdGhpcy56b29tLFxuICAgICAgICAgICAgY2VudGVyOiB0aGlzLmNlbnRlck1hcFxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIC8vIGxvY2F0aW9uOiB3aWxsIGhvbGQgYWxsIHRoZSBkYXRhIG9mIGEgc3BlY2lmaWMgbG9jYXRpb25cbiAgICB2YXIgTG9jYXRpb24gPSBmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgdGhpcy5uYW1lID0gZGF0YS5uYW1lO1xuICAgICAgICB0aGlzLmxhdCA9IHBhcnNlRmxvYXQoZGF0YS5sb2NhdGlvbi5jb29yZGluYXRlLmxhdGl0dWRlKTtcbiAgICAgICAgdGhpcy5sbmcgPSBwYXJzZUZsb2F0KGRhdGEubG9jYXRpb24uY29vcmRpbmF0ZS5sb25naXR1ZGUpO1xuICAgICAgICB0aGlzLmFkZHJlc3MgPSBkYXRhLmxvY2F0aW9uLmFkZHJlc3Muam9pbihcIiBcIik7XG4gICAgICAgIHRoaXMucGhvbmUgPSBkYXRhLmRpc3BsYXlfcGhvbmU7XG4gICAgICAgIHRoaXMuY2l0eSA9IGRhdGEubG9jYXRpb24uY2l0eTtcbiAgICAgICAgdGhpcy5wb3N0YWxfY29kZSA9IGRhdGEubG9jYXRpb24ucG9zdGFsX2NvZGU7XG4gICAgICAgIHRoaXMueWVscF9yYXRpbmcgPSBkYXRhLnJhdGluZztcbiAgICAgICAgdGhpcy5yZXZpZXdfY291bnQgPSBkYXRhLnJldmlld19jb3VudDtcbiAgICAgICAgdGhpcy5yYXRpbmdfaW1nX3VybCA9IGRhdGEucmF0aW5nX2ltZ191cmw7XG4gICAgICAgIHRoaXMuZGlzcGxheSA9IGtvLm9ic2VydmFibGUodHJ1ZSk7IC8vIHRoaXMgd2lsbCBiZSB1c2VmdWwgdG8gZmlsdGVyIHRoZSBtYXJrZXJcbiAgICAgICAgdGhpcy5tYXJrZXIgPSBudWxsOyBcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTsgLy8gdGhpcyB3aWxsIGJlIHVzZWZ1bCB0byBoaWdobGlnaHQgdGhlIGN1cnJlbnQgbWFya2VyXG4gICAgfTtcblxuICAgIHZhciBteVZpZXdNb2RlbCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi55ZWxwX2xvY2F0aW9uczsgLy8geWVscF9sb2NhdGlvbjogd2lsbCBob2xkIHRoZSBmcm9tIHRoZSBZZWxwIEFwaVxuICAgICAgICBzZWxmLmxvY2F0aW9uc0xpc3QgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pOyAvLyB3aWxsIGhvbGQgYSBsaXN0IG9mIExvY2F0aW9uIG9iamVjdHMgKGxpbmUgMzcpXG4gICAgICAgIHNlbGYubXlNYXAgPSBuZXcgbmVpZ2hib3Job29kTWFwKCk7XG4gICAgICAgIHNlbGYuY3VycmVudEZpbHRlciA9IGtvLm9ic2VydmFibGUoJycpO1xuICAgICAgICBzZWxmLmluZm9XaW5kb3cgPSBuZXcgZ29vZ2xlLm1hcHMuSW5mb1dpbmRvdygpO1xuICAgICAgICAvKiogWUVMUCBBUEkgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgKiBHZW5lcmF0ZXMgYSByYW5kb20gbnVtYmVyIGFuZCByZXR1cm5zIGl0IGFzIGEgc3RyaW5nIGZvciBPQXV0aGVudGljYXRpb25cbiAgICAgICAgICogQHJldHVybiB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gbm9uY2VfZ2VuZXJhdGUoKSB7XG4gICAgICAgICAgICByZXR1cm4gKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDFlMTIpLnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBZRUxQX0JBU0VfVVJMID0gJ2h0dHBzOi8vYXBpLnllbHAuY29tL3YyL3NlYXJjaD8nO1xuICAgICAgICB2YXIgeWVscF91cmwgPSBZRUxQX0JBU0VfVVJMO1xuICAgICAgICB2YXIgcGFyYW1ldGVycyA9IHtcbiAgICAgICAgICAgIG9hdXRoX2NvbnN1bWVyX2tleTogJ1M4LThUaWFQU2NtVndTdHVSMUdBX1EnLFxuICAgICAgICAgICAgb2F1dGhfdG9rZW46ICdVb0E3bTE4NTF5YU9zRnpzYkJnUU9saU1ER1Nlcl9HcycsXG4gICAgICAgICAgICBvYXV0aF9ub25jZTogbm9uY2VfZ2VuZXJhdGUoKSxcbiAgICAgICAgICAgIG9hdXRoX3RpbWVzdGFtcDogTWF0aC5mbG9vcihEYXRlLm5vdygpLzEwMDApLFxuICAgICAgICAgICAgb2F1dGhfc2lnbmF0dXJlX21ldGhvZDogJ0hNQUMtU0hBMScsXG4gICAgICAgICAgICBvYXV0aF92ZXJzaW9uIDogJzEuMCcsXG4gICAgICAgICAgICBjYWxsYmFjazogJ2NiJywgLy8gVGhpcyBpcyBjcnVjaWFsIHRvIGluY2x1ZGUgZm9yIGpzb25wIGltcGxlbWVudGF0aW9uIGluIEFKQVggb3IgZWxzZSB0aGUgb2F1dGgtc2lnbmF0dXJlIHdpbGwgYmUgd3JvbmcuXG4gICAgICAgICAgICBsb2NhdGlvbjogJ0JpbGJhbytTcGFpbicsXG4gICAgICAgICAgICB0ZXJtOiAncmVzdGF1cmFudCcsXG4gICAgICAgICAgICBsaW1pdDogMjAsXG4gICAgICAgICAgICBzb3J0OiAxLFxuICAgICAgICAgICAgY2xsOiAnNDMuMjYzMjI0LEMtMi45MzUwMDMnXG4gICAgICAgIH07XG4gICAgICAgIHZhciBlbmNvZGVkU2lnbmF0dXJlID0gb2F1dGhTaWduYXR1cmUuZ2VuZXJhdGUoJ0dFVCcseWVscF91cmwsIHBhcmFtZXRlcnMsICdQVWFkY1REcF85YzFEaFJEN3BrZnBFN1JETWsnLCAnb3RQR3paRC1CeG93Tm03WXlsVnpHVkIxQ2lRJyk7XG4gICAgICAgIHBhcmFtZXRlcnMub2F1dGhfc2lnbmF0dXJlID0gZW5jb2RlZFNpZ25hdHVyZTtcbiAgICAgICAgdmFyIHNldHRpbmdzID0ge1xuICAgICAgICAgICAgdXJsOiB5ZWxwX3VybCxcbiAgICAgICAgICAgIGRhdGE6IHBhcmFtZXRlcnMsXG4gICAgICAgICAgICBjYWNoZTogdHJ1ZSwgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBjcnVjaWFsIHRvIGluY2x1ZGUgYXMgd2VsbCB0byBwcmV2ZW50IGpRdWVyeSBmcm9tIGFkZGluZyBvbiBhIGNhY2hlLWJ1c3RlciBwYXJhbWV0ZXIgXCJfPTIzNDg5NDg5NzQ5ODM3XCIsIGludmFsaWRhdGluZyBvdXIgb2F1dGgtc2lnbmF0dXJlXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb25wJyxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3VsdHMpIHtcbiAgICAgICAgICAgICAgc2VsZi55ZWxwX2xvY2F0aW9ucyA9IHJlc3VsdHMuYnVzaW5lc3NlcztcbiAgICAgICAgICAgICAgc2VsZi5pbml0KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICQoJ2JvZHknKS5odG1sKCcnKTtcbiAgICAgICAgICAgICAgICAkKCdib2R5JykuYXBwZW5kKFwiPGgxPlRoZXJlIHdhcyBhbiBlcnJvciBmZXRjaGluZyBkYXRhIGZyb20gWWVscCBBUEkuIFRyeSBhZ2FpbiBsYXRlci48L2gxPlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNlbmRzIGFqYXggcmVxdWVzdCB0byBZZWxwIEFwaVxuICAgICAgICAgKi9cbiAgICAgICAgJC5hamF4KHNldHRpbmdzKTtcbiAgICAgICAgLyoqIEdPT0dMRSBQTEFDRVMgQVBJICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICovXG4gICAgICAgIHNlbGYuc2VydmljZSA9IG5ldyBnb29nbGUubWFwcy5wbGFjZXMuUGxhY2VzU2VydmljZShzZWxmLm15TWFwLm1hcCk7XG4gICAgICAgIHNlbGYucmV0cmlldmVQbGFjZXNEZXRhaWxzID0gZnVuY3Rpb24ocmVzdWx0cywgc3RhdHVzLCBsb2NhdGlvbil7XG4gICAgICAgICAgICB2YXIgcmVxdWVzdCA9IHtcbiAgICAgICAgICAgICAgICBwbGFjZUlkOiByZXN1bHRzWzBdLnBsYWNlX2lkXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgc2VsZi5zZXJ2aWNlLmdldERldGFpbHMocmVxdWVzdCxmdW5jdGlvbihyZXN1bHQsc3RhdHVzKXtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbi5wbGFjZV9pZCA9IHJlc3VsdC5wbGFjZV9pZCA/IHJlc3VsdC5wbGFjZV9pZCA6IG51bGw7XG4gICAgICAgICAgICAgICAgbG9jYXRpb24ucGhvdG9zX2FycmF5ID0gcmVzdWx0LnBob3RvcyA/IHJlc3VsdC5waG90b3MgOiBudWxsO1xuICAgICAgICAgICAgICAgIGxvY2F0aW9uLmZpcnN0X3BpY3R1cmVfdXJsID0gcmVzdWx0LnBob3RvcyA/IHJlc3VsdC5waG90b3NbMF0uZ2V0VXJsKHsnbWF4SGVpZ2h0JzogMzAwLCAnbWF4V2lkdGgnOiAzMDB9KTpudWxsO1xuICAgICAgICAgICAgICAgIGxvY2F0aW9uLndlYnNpdGUgPSByZXN1bHQud2Vic2l0ZSA/IHJlc3VsdC53ZWJzaXRlIDogJyc7XG4gICAgICAgICAgICAgICAgbG9jYXRpb24ucmF0aW5nID0gcmVzdWx0LnJhdGluZyA/IHJlc3VsdC5yYXRpbmcgOiAnTm8gcmF0aW5nIGF2YWlsYWJsZSc7XG4gICAgICAgICAgICAgICAgc2VsZi5wcmVwYXJlSW5mb1dpbmRvd0NvbnRlbnQobG9jYXRpb24pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgc2VsZi5yZXRyaWV2ZUluZm9Hb29nbGVQbGFjZXMgPSBmdW5jdGlvbihsb2NhdGlvbil7XG4gICAgICAgICAgICBzZWxmLnNlcnZpY2UubmVhcmJ5U2VhcmNoKHtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbjogc2VsZi5teU1hcC5jZW50ZXJNYXAsXG4gICAgICAgICAgICAgICAgcmFkaXVzOiAyMDAwLFxuICAgICAgICAgICAgICAgIGtleXdvcmQ6IGxvY2F0aW9uLm5hbWVcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKHJlc3VsdCwgc3RhdHVzKXtcbiAgICAgICAgICAgICAgICBzZWxmLnJldHJpZXZlUGxhY2VzRGV0YWlscyhyZXN1bHQsIHN0YXR1cywgbG9jYXRpb24pOyAvLyBjYWxsIGZ1bmN0aW9uIGluIGxpbmUgMTA2XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIC8qKiBTRVQgVVAgSU5GT1dJTkRPVyAqKioqKioqKioqKioqKlxuICAgICAgICAgKi9cbiAgICAgICAgc2VsZi5pbml0Q29udGVudCA9IGZ1bmN0aW9uKGxvY2F0aW9uKXtcbiAgICAgICAgICAgIHNlbGYucmV0cmlldmVJbmZvR29vZ2xlUGxhY2VzKGxvY2F0aW9uKTsgLy8gY2FsbCBmdW5jdGlvbiBpbiBsaW5lIDEyMVxuICAgICAgICB9O1xuXG4gICAgICAgIHNlbGYucHJlcGFyZUluZm9XaW5kb3dDb250ZW50ID0gZnVuY3Rpb24obG9jYXRpb24pe1xuICAgICAgICAgICAgdmFyIHBpY3R1cmVTdHJpbmcgPSBsb2NhdGlvbi5maXJzdF9waWN0dXJlX3VybCA/IFwiPGlmcmFtZSB3aWR0aD0nMzAwJyBoZWlnaHQ9J2F1dG8nIGZyYW1lYm9yZGVyPScwJyBzcmM9J1wiK2xvY2F0aW9uLmZpcnN0X3BpY3R1cmVfdXJsK1wiJz48L2lmcmFtZT5cIjogJyc7XG4gICAgICAgICAgICB2YXIgY29udGVudFN0cmluZyA9IFwiPGRpdiBjbGFzcz0naW5mb1dpbic+XCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdpbWFnZUNvbnRlbnQnPlwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBpY3R1cmVTdHJpbmcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8L2Rpdj5cIitcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0ndGV4dENvbnRlbnQnPlwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxoNSBjbGFzcz0naW5mb1RpdGxlJz5cIitcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYXRpb24ubmFtZSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8L2g1PlwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjx1bCBjbGFzcz0naW5mb0RhdGEnPlwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxsaT4gVGVsLiBcIitsb2NhdGlvbi5waG9uZStcIjwvbGk+XCIrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPGxpPlwiK2xvY2F0aW9uLmFkZHJlc3MrXCI8L2xpPlwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxsaT5cIitsb2NhdGlvbi5wb3N0YWxfY29kZStcIiBcIitsb2NhdGlvbi5jaXR5K1wiPC9saT5cIitcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8bGk+XCIrXCI8YSBocmVmPSdcIitsb2NhdGlvbi53ZWJzaXRlK1wiJyB0YXJnZXQ9J19ibGFuayc+XCIrbG9jYXRpb24ud2Vic2l0ZStcIjwvYT48L2xpPlwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPC91bD5cIitcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPC9kaXY+XCIrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J3JhdGluZ3NDb250ZW50Jz5cIitcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxpbWcgc3JjPSdcIitsb2NhdGlvbi5yYXRpbmdfaW1nX3VybCArXCInIGFsdD0neWVscCBzdGFyIHJhdGluZyc+XCIrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8c3BhbiBjbGFzcz0ncmV2aWV3Q291bnQnPiBcIitsb2NhdGlvbi5yZXZpZXdfY291bnQrXCIgWWVscCByZXZpZXdzPC9zcGFuPlwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8L2Rpdj5cIitcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8L2Rpdj5cIjtcbiAgICAgICAgICAgIHNlbGYuaW5mb1dpbmRvdy5zZXRDb250ZW50KGNvbnRlbnRTdHJpbmcpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKiBTRVQgVVAgTUFSS0VSUyBBTkQgVEhFSVIgRlVOQ1RJT05BTElUWSAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICovXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQb3B1bGF0ZSBsb2NhdGlvbnNMaXN0IGFuZCBkcmF3IG1hcmtlcnMgb24gbWFwXG4gICAgICAgICAqL1xuICAgICAgICBzZWxmLmluaXQgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgc2VsZi55ZWxwX2xvY2F0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKGxvY2F0aW9uSXRlbSl7XG4gICAgICAgICAgICAgICAgc2VsZi5sb2NhdGlvbnNMaXN0LnB1c2gobmV3IExvY2F0aW9uKGxvY2F0aW9uSXRlbSkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzZWxmLmRyYXdNYXJrZXJzKCk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBCdWlsZCBhbiBldmVudCBoYW5kbGVyIHRoYXQgd2lsbCBmaWx0ZXIgbG9jYXRpb25zXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgc3Vic2NyaXB0aW9uID0gc2VsZi5jdXJyZW50RmlsdGVyLnN1YnNjcmliZShmdW5jdGlvbihuZXdWYWx1ZSl7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaTxzZWxmLmxvY2F0aW9uc0xpc3QoKS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uTmFtZSA9IHNlbGYubG9jYXRpb25zTGlzdCgpW2ldLm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICB0YXJnZXRTdHJpbmcgPSBuZXdWYWx1ZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIChsb2NhdGlvbk5hbWUuaW5kZXhPZih0YXJnZXRTdHJpbmcpID09PSAtMSkgPyBcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5sb2NhdGlvbnNMaXN0KClbaV0uZGlzcGxheShmYWxzZSkgOlxuICAgICAgICAgICAgICAgICAgICBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXS5kaXNwbGF5KHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZi5yZWRyYXdNYXJrZXJzKCk7XG4gICAgICAgIH0pO1xuICAgICAgICAvKipcbiAgICAgICAgICogRHJhdyBBTEwgbWFya2VycyBvbiBtYXBcbiAgICAgICAgICovXG4gICAgICAgIHNlbGYuZHJhd01hcmtlcnMgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgZm9yKHZhciBpID0gMDsgaTwgc2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50SXRlbSA9IHNlbGYubG9jYXRpb25zTGlzdCgpW2ldO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50SXRlbS5kaXNwbGF5KCkgPT09IHRydWUpe1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmFkZE1hcmtlcldpdGhBbmltYXRpb24oY3VycmVudEl0ZW0sIGkqMTAwKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYoY3VycmVudEl0ZW0ubWFya2VyICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlci5zZXRNYXAobnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogRHJhdyBtYXJrZXJzIHdpdGggZGlzcGxheSBwcm9wZXJ0eSBpcyBzZXQgdG8gdHJ1ZVxuICAgICAgICAgKi9cbiAgICAgICAgc2VsZi5yZWRyYXdNYXJrZXJzID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGk8IHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudEl0ZW0uZGlzcGxheSgpID09PSB0cnVlKXtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEl0ZW0ubWFya2VyLnNldE1hcChzZWxmLm15TWFwLm1hcCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmKGN1cnJlbnRJdGVtLm1hcmtlciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIuc2V0TWFwKG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZSBhbGwgbWFya2VycyBmcm9tIG1hcFxuICAgICAgICAgKi9cbiAgICAgICAgc2VsZi5jbGVhck1hcmtlcnMgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgZm9yKHZhciBpID0gMDsgaTwgc2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50SXRlbSA9IHNlbGYubG9jYXRpb25zTGlzdCgpW2ldO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlci5zZXRNYXAobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaWxsIGRyYXcgbWFya2VyIHdpdGggYW5pbWF0aW9uIGFuZCBhZGQgYW4gZXZlbnQgbGlzdGVuZXJcbiAgICAgICAgICogdG8gYWN0aXZhdGUgdGhlIGNob3NlbiBtYXJrZXJcbiAgICAgICAgICovXG4gICAgICAgIHNlbGYuYWRkTWFya2VyV2l0aEFuaW1hdGlvbiA9IGZ1bmN0aW9uKGN1cnJlbnRJdGVtLCB0aW1lb3V0KXtcbiAgICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgY3VycmVudEl0ZW0ubWFya2VyID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcih7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7bGF0OiBjdXJyZW50SXRlbS5sYXQsIGxuZzogY3VycmVudEl0ZW0ubG5nfSxcbiAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uOiBnb29nbGUubWFwcy5BbmltYXRpb24uRFJPUCxcbiAgICAgICAgICAgICAgICAgICAgaWNvbjogcGlucy5kZWZhdWx0LnBpbkltYWdlLFxuICAgICAgICAgICAgICAgICAgICBtYXA6IHNlbGYubXlNYXAubWFwXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY3VycmVudEl0ZW0ubWFya2VyLmFkZExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuYWN0aXZhdGVNYXJrZXIuY2FsbChjdXJyZW50SXRlbSk7IC8vIFdlIHVzZSAuY2FsbCgpIHRvIHNwZWNpZnkgdGhlIHRoaXMgdmFsdWUgb2YgdGhlIGFjdGl2YXRlTWFya2VyIGZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQWN0aXZhdGUgbWFya2VyOiBjaGFuZ2UgY29sb3IsIGJvdW5jZSwgb3BlbiBpbmZvIHdpbmRvd1xuICAgICAgICAgKi9cbiAgICAgICAgc2VsZi5hY3RpdmF0ZU1hcmtlciA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgbWFya2VyID0gdGhpcy5tYXJrZXI7XG4gICAgICAgICAgICB2YXIgbG9jYXRpb24gPSB0aGlzO1xuICAgICAgICAgICAgc2VsZi5pbmFjdGl2ZUFsbCgpO1xuICAgICAgICAgICAgbG9jYXRpb24uYWN0aXZlKHRydWUpO1xuICAgICAgICAgICAgc2VsZi5hY3RpdmVDb2xvcihtYXJrZXIpO1xuICAgICAgICAgICAgc2VsZi5Cb3VuY2UobWFya2VyKTtcbiAgICAgICAgICAgIHNlbGYuaW5pdENvbnRlbnQobG9jYXRpb24pO1xuICAgICAgICAgICAgc2VsZi5pbmZvV2luZG93Lm9wZW4oc2VsZi5teU1hcCwgbWFya2VyKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIERlYWN0aXZhdGUgYWxsIG1hcmtlcnM6IGNoYW5nZSBjb2xvciwgYm91bmNlLCBvcGVuIGluZm8gd2luZG93XG4gICAgICAgICAqL1xuICAgICAgICBzZWxmLmluYWN0aXZlQWxsID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGk8IHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5hY3RpdmUoZmFsc2UpO1xuICAgICAgICAgICAgICAgIHNlbGYuZGVmYXVsdENvbG9yKGN1cnJlbnRJdGVtLm1hcmtlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBCb3VuY2UgbWFya2VyXG4gICAgICAgICAqL1xuICAgICAgICBzZWxmLkJvdW5jZSA9IGZ1bmN0aW9uKGN1cnJlbnRNYXJrZXIpe1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRNYXJrZXIuZ2V0QW5pbWF0aW9uKCkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50TWFya2VyLnNldEFuaW1hdGlvbihudWxsKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY3VycmVudE1hcmtlci5zZXRBbmltYXRpb24oZ29vZ2xlLm1hcHMuQW5pbWF0aW9uLkJPVU5DRSk7XG4gICAgICAgICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudE1hcmtlci5zZXRBbmltYXRpb24obnVsbCk7XG4gICAgICAgICAgICAgICAgfSw3MDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogU2V0IFwiYWN0aXZlXCIgaWNvbiBvbiBjdXJyZW50IG1hcmtlclxuICAgICAgICAgKi9cbiAgICAgICAgc2VsZi5hY3RpdmVDb2xvciA9IGZ1bmN0aW9uKGN1cnJlbnRNYXJrZXIpe1xuICAgICAgICAgICAgY3VycmVudE1hcmtlci5zZXRJY29uKHBpbnMuYWN0aXZlLnBpbkltYWdlKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNldCBcImRlZmF1bHRcIiBpY29uIG9uIGN1cnJlbnQgbWFya2VyXG4gICAgICAgICAqL1xuICAgICAgICBzZWxmLmRlZmF1bHRDb2xvciA9IGZ1bmN0aW9uKGN1cnJlbnRNYXJrZXIpe1xuICAgICAgICAgICAgY3VycmVudE1hcmtlci5zZXRJY29uKHBpbnMuZGVmYXVsdC5waW5JbWFnZSk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXQgXCJkZWZhdWx0XCIgaWNvbiBvbiBBTEwgbWFya2Vyc1xuICAgICAgICAgKi9cbiAgICAgICAgc2VsZi5kZWZhdWx0Q29sb3JBbGwgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgZm9yKHZhciBpID0gMDsgaTwgc2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50SXRlbSA9IHNlbGYubG9jYXRpb25zTGlzdCgpW2ldO1xuICAgICAgICAgICAgICAgIHNlbGYuZGVmYXVsdENvbG9yKGN1cnJlbnRJdGVtLm1hcmtlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgc2VsZi50b2dnbGVNZW51ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciBjb250YWluZXJfZWxlbWVudCA9ICQoXCIubmF2aWdhdGlvbl9saXN0XCIpO1xuICAgICAgICAgICAgY29udGFpbmVyX2VsZW1lbnQuaGFzQ2xhc3MoXCJzbGlkZVwiKSA/IGNvbnRhaW5lcl9lbGVtZW50LnJlbW92ZUNsYXNzKFwic2xpZGVcIikgOiBjb250YWluZXJfZWxlbWVudC5hZGRDbGFzcyhcInNsaWRlXCIpO1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICBrby5hcHBseUJpbmRpbmdzKG5ldyBteVZpZXdNb2RlbCk7XG59O1xuXG4vLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbi8qIGdvb2dsZVN1Y2Nlc3MoKSBpcyB0aGUgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCB3aWxsIHJ1biB3aGVuIEdvb2dsZSBNYXBzIEFwaVxuLyogbG9hZHMuXG4vKiBnb29nbGVTdWNjZXNzKCk6IGNhbGxzIHRoZSBpbml0aWF0ZVZpZXcoKSBmdW5jdGlvbiAuXG4qL1xuZnVuY3Rpb24gZ29vZ2xlU3VjY2Vzcygpe1xuICAgIGluaXRpYXRlVmlldygpO1xufTtcbi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuLyogZ29vZ2xlRXJyb3IoKSB3aWxsIHJ1biBpZiBHb29nbGUgTWFwcyBBcGkgZG9lcyBub3QgbG9hZCBwcm9wZXJseS4gSXQganVzdFxuLyogZGlzcGxheXMgYW4gZXJyb3IgbWVzc2FnZS5cbiovXG5mdW5jdGlvbiBnb29nbGVFcnJvcigpe1xuICAgICQoJ2JvZHknKS5odG1sKCcnKTtcbiAgICAkKCdib2R5JykuYXBwZW5kKFwiPGgxPlRoZXJlIHdhcyBhbiBlcnJvciBsb2FkaW5nIEdvb2dsZSBNYXBzLiBQbGVhc2UgdHJ5IGFnYWluIGxhdGVyLjwvaDE+XCIpO1xufTtcblxuXG4gICAgICAgICJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
