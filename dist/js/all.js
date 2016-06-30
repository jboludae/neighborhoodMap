
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
                                        "<span class='reviewCount'> "+location.review_count+" Yelp reviews</span>"+                                    "</div>"+

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


        
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFsbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4vKiBpbml0aWF0ZVZpZXcoKSB3cmFwcyB0aGUgd2hvbGUgcGFnZSBmdW5jdGlvbmFsaXR5LiBBbGwgZnVuY3Rpb25zIGFuZCB2YXJpYWJsZXNcbi8qIGFyZSBpbml0aWFsaXplZCBhbmQgc2V0IHVwIGFuZCB0aGVuIGtvLmFwcGx5QmluZGluZ3MobmV3IG15Vmlld01vZGVsKSBpc1xuLyogY2FsbGVkLCB3aGljaCB3aWxsIGluaXRpYWxpemUgdGhlIHZhcmlhYmxlcy5cbiovXG5mdW5jdGlvbiBpbml0aWF0ZVZpZXcoKXtcbiAgICAvLyBwaW5zOiB3aWxsIGhvbGQgc29tZSBwZXJzb25pbGl6ZWQgc3R5bGVzIGZvciB0aGUgbWFya2Vyc1xuICAgIHZhciBwaW5zID0ge1xuICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICBwaW5JbWFnZSA6IG5ldyBnb29nbGUubWFwcy5NYXJrZXJJbWFnZShcImh0dHA6Ly9jaGFydC5hcGlzLmdvb2dsZS5jb20vY2hhcnQ/Y2hzdD1kX21hcF9waW5fbGV0dGVyJmNobGQ9JUUyJTgwJUEyfFwiICtcbiAgICAgICAgICAgICdERDg4ODgnLFxuICAgICAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlNpemUoMjEsIDM0KSxcbiAgICAgICAgICAgIG5ldyBnb29nbGUubWFwcy5Qb2ludCgwLDApLFxuICAgICAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlBvaW50KDEwLCAzNCkpXG4gICAgICAgIH0sXG4gICAgICAgIGFjdGl2ZToge1xuICAgICAgICAgICAgcGluSW1hZ2UgOiBuZXcgZ29vZ2xlLm1hcHMuTWFya2VySW1hZ2UoXCJodHRwOi8vY2hhcnQuYXBpcy5nb29nbGUuY29tL2NoYXJ0P2Noc3Q9ZF9tYXBfcGluX2xldHRlciZjaGxkPSVFMiU4MCVBMnxcIiArXG4gICAgICAgICAgICAnQUFEREREJyxcbiAgICAgICAgICAgIG5ldyBnb29nbGUubWFwcy5TaXplKDIxLCAzNCksXG4gICAgICAgICAgICBuZXcgZ29vZ2xlLm1hcHMuUG9pbnQoMCwwKSxcbiAgICAgICAgICAgIG5ldyBnb29nbGUubWFwcy5Qb2ludCgxMCwgMzQpKVxuXG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8vIG5laWdoYm9yaG9vZE1hcDogd2lsbCBob2xkIHRoZSBHb29nbGUgTWFwcyBvYmplY3RcbiAgICB2YXIgbmVpZ2hib3Job29kTWFwID0gZnVuY3Rpb24oKXtcbiAgICAgICAgdGhpcy5tYXBEaXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwJyk7XG4gICAgICAgIHRoaXMuY2VudGVyTWFwID0ge2xhdDogNDMuMjYzMjI0LCBsbmc6IC0yLjkzNTAwM307XG4gICAgICAgIHRoaXMuem9vbSA9IDE1O1xuICAgICAgICB0aGlzLm1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAodGhpcy5tYXBEaXYsIHtcbiAgICAgICAgICAgIHpvb206IHRoaXMuem9vbSxcbiAgICAgICAgICAgIGNlbnRlcjogdGhpcy5jZW50ZXJNYXBcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICAvLyBsb2NhdGlvbjogd2lsbCBob2xkIGFsbCB0aGUgZGF0YSBvZiBhIHNwZWNpZmljIGxvY2F0aW9uXG4gICAgdmFyIExvY2F0aW9uID0gZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgIHRoaXMubmFtZSA9IGRhdGEubmFtZTtcbiAgICAgICAgdGhpcy5sYXQgPSBwYXJzZUZsb2F0KGRhdGEubG9jYXRpb24uY29vcmRpbmF0ZS5sYXRpdHVkZSk7XG4gICAgICAgIHRoaXMubG5nID0gcGFyc2VGbG9hdChkYXRhLmxvY2F0aW9uLmNvb3JkaW5hdGUubG9uZ2l0dWRlKTtcbiAgICAgICAgdGhpcy5hZGRyZXNzID0gZGF0YS5sb2NhdGlvbi5hZGRyZXNzLmpvaW4oXCIgXCIpO1xuICAgICAgICB0aGlzLnBob25lID0gZGF0YS5kaXNwbGF5X3Bob25lO1xuICAgICAgICB0aGlzLmNpdHkgPSBkYXRhLmxvY2F0aW9uLmNpdHk7XG4gICAgICAgIHRoaXMucG9zdGFsX2NvZGUgPSBkYXRhLmxvY2F0aW9uLnBvc3RhbF9jb2RlO1xuICAgICAgICB0aGlzLnllbHBfcmF0aW5nID0gZGF0YS5yYXRpbmc7XG4gICAgICAgIHRoaXMucmV2aWV3X2NvdW50ID0gZGF0YS5yZXZpZXdfY291bnQ7XG4gICAgICAgIHRoaXMucmF0aW5nX2ltZ191cmwgPSBkYXRhLnJhdGluZ19pbWdfdXJsO1xuICAgICAgICB0aGlzLmRpc3BsYXkgPSBrby5vYnNlcnZhYmxlKHRydWUpOyAvLyB0aGlzIHdpbGwgYmUgdXNlZnVsIHRvIGZpbHRlciB0aGUgbWFya2VyXG4gICAgICAgIHRoaXMubWFya2VyID0gbnVsbDsgXG4gICAgICAgIHRoaXMuYWN0aXZlID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7IC8vIHRoaXMgd2lsbCBiZSB1c2VmdWwgdG8gaGlnaGxpZ2h0IHRoZSBjdXJyZW50IG1hcmtlclxuICAgIH07XG5cbiAgICB2YXIgbXlWaWV3TW9kZWwgPSBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNlbGYueWVscF9sb2NhdGlvbnM7IC8vIHllbHBfbG9jYXRpb246IHdpbGwgaG9sZCB0aGUgZnJvbSB0aGUgWWVscCBBcGlcbiAgICAgICAgc2VsZi5sb2NhdGlvbnNMaXN0ID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTsgLy8gd2lsbCBob2xkIGEgbGlzdCBvZiBMb2NhdGlvbiBvYmplY3RzIChsaW5lIDM3KVxuICAgICAgICBzZWxmLm15TWFwID0gbmV3IG5laWdoYm9yaG9vZE1hcCgpO1xuICAgICAgICBzZWxmLmN1cnJlbnRGaWx0ZXIgPSBrby5vYnNlcnZhYmxlKCcnKTtcbiAgICAgICAgc2VsZi5pbmZvV2luZG93ID0gbmV3IGdvb2dsZS5tYXBzLkluZm9XaW5kb3coKTtcbiAgICAgICAgLyoqIFlFTFAgQVBJICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgICogR2VuZXJhdGVzIGEgcmFuZG9tIG51bWJlciBhbmQgcmV0dXJucyBpdCBhcyBhIHN0cmluZyBmb3IgT0F1dGhlbnRpY2F0aW9uXG4gICAgICAgICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIG5vbmNlX2dlbmVyYXRlKCkge1xuICAgICAgICAgICAgcmV0dXJuIChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxZTEyKS50b1N0cmluZygpKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgWUVMUF9CQVNFX1VSTCA9ICdodHRwczovL2FwaS55ZWxwLmNvbS92Mi9zZWFyY2g/JztcbiAgICAgICAgdmFyIHllbHBfdXJsID0gWUVMUF9CQVNFX1VSTDtcbiAgICAgICAgdmFyIHBhcmFtZXRlcnMgPSB7XG4gICAgICAgICAgICBvYXV0aF9jb25zdW1lcl9rZXk6ICdTOC04VGlhUFNjbVZ3U3R1UjFHQV9RJyxcbiAgICAgICAgICAgIG9hdXRoX3Rva2VuOiAnVW9BN20xODUxeWFPc0Z6c2JCZ1FPbGlNREdTZXJfR3MnLFxuICAgICAgICAgICAgb2F1dGhfbm9uY2U6IG5vbmNlX2dlbmVyYXRlKCksXG4gICAgICAgICAgICBvYXV0aF90aW1lc3RhbXA6IE1hdGguZmxvb3IoRGF0ZS5ub3coKS8xMDAwKSxcbiAgICAgICAgICAgIG9hdXRoX3NpZ25hdHVyZV9tZXRob2Q6ICdITUFDLVNIQTEnLFxuICAgICAgICAgICAgb2F1dGhfdmVyc2lvbiA6ICcxLjAnLFxuICAgICAgICAgICAgY2FsbGJhY2s6ICdjYicsIC8vIFRoaXMgaXMgY3J1Y2lhbCB0byBpbmNsdWRlIGZvciBqc29ucCBpbXBsZW1lbnRhdGlvbiBpbiBBSkFYIG9yIGVsc2UgdGhlIG9hdXRoLXNpZ25hdHVyZSB3aWxsIGJlIHdyb25nLlxuICAgICAgICAgICAgbG9jYXRpb246ICdCaWxiYW8rU3BhaW4nLFxuICAgICAgICAgICAgdGVybTogJ3Jlc3RhdXJhbnQnLFxuICAgICAgICAgICAgbGltaXQ6IDIwLFxuICAgICAgICAgICAgc29ydDogMixcbiAgICAgICAgICAgIGNsbDogJzQzLjI2MzIyNCxDLTIuOTM1MDAzJ1xuICAgICAgICB9O1xuICAgICAgICB2YXIgZW5jb2RlZFNpZ25hdHVyZSA9IG9hdXRoU2lnbmF0dXJlLmdlbmVyYXRlKCdHRVQnLHllbHBfdXJsLCBwYXJhbWV0ZXJzLCAnUFVhZGNURHBfOWMxRGhSRDdwa2ZwRTdSRE1rJywgJ290UEd6WkQtQnhvd05tN1l5bFZ6R1ZCMUNpUScpO1xuICAgICAgICBwYXJhbWV0ZXJzLm9hdXRoX3NpZ25hdHVyZSA9IGVuY29kZWRTaWduYXR1cmU7XG4gICAgICAgIHZhciBzZXR0aW5ncyA9IHtcbiAgICAgICAgICAgIHVybDogeWVscF91cmwsXG4gICAgICAgICAgICBkYXRhOiBwYXJhbWV0ZXJzLFxuICAgICAgICAgICAgY2FjaGU6IHRydWUsICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgY3J1Y2lhbCB0byBpbmNsdWRlIGFzIHdlbGwgdG8gcHJldmVudCBqUXVlcnkgZnJvbSBhZGRpbmcgb24gYSBjYWNoZS1idXN0ZXIgcGFyYW1ldGVyIFwiXz0yMzQ4OTQ4OTc0OTgzN1wiLCBpbnZhbGlkYXRpbmcgb3VyIG9hdXRoLXNpZ25hdHVyZVxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29ucCcsXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXN1bHRzKSB7XG4gICAgICAgICAgICAgIHNlbGYueWVscF9sb2NhdGlvbnMgPSByZXN1bHRzLmJ1c2luZXNzZXM7XG4gICAgICAgICAgICAgIHNlbGYuaW5pdCgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAkKCdib2R5JykuaHRtbCgnJyk7XG4gICAgICAgICAgICAgICAgJCgnYm9keScpLmFwcGVuZChcIjxoMT5UaGVyZSB3YXMgYW4gZXJyb3IgZmV0Y2hpbmcgZGF0YSBmcm9tIFllbHAgQVBJLiBUcnkgYWdhaW4gbGF0ZXIuPC9oMT5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZW5kcyBhamF4IHJlcXVlc3QgdG8gWWVscCBBcGlcbiAgICAgICAgICovXG4gICAgICAgICQuYWpheChzZXR0aW5ncyk7XG4gICAgICAgIC8qKiBHT09HTEUgUExBQ0VTIEFQSSAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAqL1xuICAgICAgICBzZWxmLnNlcnZpY2UgPSBuZXcgZ29vZ2xlLm1hcHMucGxhY2VzLlBsYWNlc1NlcnZpY2Uoc2VsZi5teU1hcC5tYXApO1xuICAgICAgICBzZWxmLnJldHJpZXZlUGxhY2VzRGV0YWlscyA9IGZ1bmN0aW9uKHJlc3VsdHMsIHN0YXR1cywgbG9jYXRpb24pe1xuICAgICAgICAgICAgdmFyIHJlcXVlc3QgPSB7XG4gICAgICAgICAgICAgICAgcGxhY2VJZDogcmVzdWx0c1swXS5wbGFjZV9pZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHNlbGYuc2VydmljZS5nZXREZXRhaWxzKHJlcXVlc3QsZnVuY3Rpb24ocmVzdWx0LHN0YXR1cyl7XG4gICAgICAgICAgICAgICAgbG9jYXRpb24ucGxhY2VfaWQgPSByZXN1bHQucGxhY2VfaWQgPyByZXN1bHQucGxhY2VfaWQgOiBudWxsO1xuICAgICAgICAgICAgICAgIGxvY2F0aW9uLnBob3Rvc19hcnJheSA9IHJlc3VsdC5waG90b3MgPyByZXN1bHQucGhvdG9zIDogbnVsbDtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbi5maXJzdF9waWN0dXJlX3VybCA9IHJlc3VsdC5waG90b3MgPyByZXN1bHQucGhvdG9zWzBdLmdldFVybCh7J21heEhlaWdodCc6IDMwMCwgJ21heFdpZHRoJzogMzAwfSk6bnVsbDtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbi53ZWJzaXRlID0gcmVzdWx0LndlYnNpdGUgPyByZXN1bHQud2Vic2l0ZSA6ICcnO1xuICAgICAgICAgICAgICAgIGxvY2F0aW9uLnJhdGluZyA9IHJlc3VsdC5yYXRpbmcgPyByZXN1bHQucmF0aW5nIDogJ05vIHJhdGluZyBhdmFpbGFibGUnO1xuICAgICAgICAgICAgICAgIHNlbGYucHJlcGFyZUluZm9XaW5kb3dDb250ZW50KGxvY2F0aW9uKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHNlbGYucmV0cmlldmVJbmZvR29vZ2xlUGxhY2VzID0gZnVuY3Rpb24obG9jYXRpb24pe1xuICAgICAgICAgICAgc2VsZi5zZXJ2aWNlLm5lYXJieVNlYXJjaCh7XG4gICAgICAgICAgICAgICAgbG9jYXRpb246IHNlbGYubXlNYXAuY2VudGVyTWFwLFxuICAgICAgICAgICAgICAgIHJhZGl1czogMjAwMCxcbiAgICAgICAgICAgICAgICBrZXl3b3JkOiBsb2NhdGlvbi5uYW1lXG4gICAgICAgICAgICB9LCBmdW5jdGlvbihyZXN1bHQsIHN0YXR1cyl7XG4gICAgICAgICAgICAgICAgc2VsZi5yZXRyaWV2ZVBsYWNlc0RldGFpbHMocmVzdWx0LCBzdGF0dXMsIGxvY2F0aW9uKTsgLy8gY2FsbCBmdW5jdGlvbiBpbiBsaW5lIDEwNlxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICAvKiogU0VUIFVQIElORk9XSU5ET1cgKioqKioqKioqKioqKipcbiAgICAgICAgICovXG4gICAgICAgIHNlbGYuaW5pdENvbnRlbnQgPSBmdW5jdGlvbihsb2NhdGlvbil7XG4gICAgICAgICAgICBzZWxmLnJldHJpZXZlSW5mb0dvb2dsZVBsYWNlcyhsb2NhdGlvbik7IC8vIGNhbGwgZnVuY3Rpb24gaW4gbGluZSAxMjFcbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLnByZXBhcmVJbmZvV2luZG93Q29udGVudCA9IGZ1bmN0aW9uKGxvY2F0aW9uKXtcbiAgICAgICAgICAgIHZhciBwaWN0dXJlU3RyaW5nID0gbG9jYXRpb24uZmlyc3RfcGljdHVyZV91cmwgPyBcIjxpZnJhbWUgd2lkdGg9JzMwMCcgaGVpZ2h0PSdhdXRvJyBmcmFtZWJvcmRlcj0nMCcgc3JjPSdcIitsb2NhdGlvbi5maXJzdF9waWN0dXJlX3VybCtcIic+PC9pZnJhbWU+XCI6ICcnO1xuICAgICAgICAgICAgdmFyIGNvbnRlbnRTdHJpbmcgPSBcIjxkaXYgY2xhc3M9J2luZm9XaW4nPlwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0naW1hZ2VDb250ZW50Jz5cIitcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwaWN0dXJlU3RyaW5nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPC9kaXY+XCIrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J3RleHRDb250ZW50Jz5cIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8aDUgY2xhc3M9J2luZm9UaXRsZSc+XCIrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPC9oNT5cIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8dWwgY2xhc3M9J2luZm9EYXRhJz5cIitcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8bGk+IFRlbC4gXCIrbG9jYXRpb24ucGhvbmUrXCI8L2xpPlwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxsaT5cIitsb2NhdGlvbi5hZGRyZXNzK1wiPC9saT5cIitcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8bGk+XCIrbG9jYXRpb24ucG9zdGFsX2NvZGUrXCIgXCIrbG9jYXRpb24uY2l0eStcIjwvbGk+XCIrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPGxpPlwiK1wiPGEgaHJlZj0nXCIrbG9jYXRpb24ud2Vic2l0ZStcIicgdGFyZ2V0PSdfYmxhbmsnPlwiK2xvY2F0aW9uLndlYnNpdGUrXCI8L2E+PC9saT5cIitcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjwvdWw+XCIrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjwvZGl2PlwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdyYXRpbmdzQ29udGVudCc+XCIrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8aW1nIHNyYz0nXCIrbG9jYXRpb24ucmF0aW5nX2ltZ191cmwgK1wiJyBhbHQ9J3llbHAgc3RhciByYXRpbmcnPlwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPHNwYW4gY2xhc3M9J3Jldmlld0NvdW50Jz4gXCIrbG9jYXRpb24ucmV2aWV3X2NvdW50K1wiIFllbHAgcmV2aWV3czwvc3Bhbj5cIisgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjwvZGl2PlwiK1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPC9kaXY+XCI7XG4gICAgICAgICAgICBzZWxmLmluZm9XaW5kb3cuc2V0Q29udGVudChjb250ZW50U3RyaW5nKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKiogU0VUIFVQIE1BUktFUlMgQU5EIFRIRUlSIEZVTkNUSU9OQUxJVFkgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICAqL1xuICAgICAgICAvKipcbiAgICAgICAgICogUG9wdWxhdGUgbG9jYXRpb25zTGlzdCBhbmQgZHJhdyBtYXJrZXJzIG9uIG1hcFxuICAgICAgICAgKi9cbiAgICAgICAgc2VsZi5pbml0ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHNlbGYueWVscF9sb2NhdGlvbnMuZm9yRWFjaChmdW5jdGlvbihsb2NhdGlvbkl0ZW0pe1xuICAgICAgICAgICAgICAgIHNlbGYubG9jYXRpb25zTGlzdC5wdXNoKG5ldyBMb2NhdGlvbihsb2NhdGlvbkl0ZW0pKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc2VsZi5kcmF3TWFya2VycygpO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQnVpbGQgYW4gZXZlbnQgaGFuZGxlciB0aGF0IHdpbGwgZmlsdGVyIGxvY2F0aW9uc1xuICAgICAgICAgKi9cbiAgICAgICAgdmFyIHN1YnNjcmlwdGlvbiA9IHNlbGYuY3VycmVudEZpbHRlci5zdWJzY3JpYmUoZnVuY3Rpb24obmV3VmFsdWUpe1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGk8c2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciBsb2NhdGlvbk5hbWUgPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXS5uYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgdGFyZ2V0U3RyaW5nID0gbmV3VmFsdWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAobG9jYXRpb25OYW1lLmluZGV4T2YodGFyZ2V0U3RyaW5nKSA9PT0gLTEpID8gXG4gICAgICAgICAgICAgICAgICAgIHNlbGYubG9jYXRpb25zTGlzdCgpW2ldLmRpc3BsYXkoZmFsc2UpIDpcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5sb2NhdGlvbnNMaXN0KClbaV0uZGlzcGxheSh0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGYucmVkcmF3TWFya2VycygpO1xuICAgICAgICB9KTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIERyYXcgQUxMIG1hcmtlcnMgb24gbWFwXG4gICAgICAgICAqL1xuICAgICAgICBzZWxmLmRyYXdNYXJrZXJzID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGk8IHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudEl0ZW0uZGlzcGxheSgpID09PSB0cnVlKXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5hZGRNYXJrZXJXaXRoQW5pbWF0aW9uKGN1cnJlbnRJdGVtLCBpKjEwMCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmKGN1cnJlbnRJdGVtLm1hcmtlciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIuc2V0TWFwKG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIERyYXcgbWFya2VycyB3aXRoIGRpc3BsYXkgcHJvcGVydHkgaXMgc2V0IHRvIHRydWVcbiAgICAgICAgICovXG4gICAgICAgIHNlbGYucmVkcmF3TWFya2VycyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpPCBzZWxmLmxvY2F0aW9uc0xpc3QoKS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRJdGVtID0gc2VsZi5sb2NhdGlvbnNMaXN0KClbaV07XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRJdGVtLmRpc3BsYXkoKSA9PT0gdHJ1ZSl7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlci5zZXRNYXAoc2VsZi5teU1hcC5tYXApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZihjdXJyZW50SXRlbS5tYXJrZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEl0ZW0ubWFya2VyLnNldE1hcChudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmUgYWxsIG1hcmtlcnMgZnJvbSBtYXBcbiAgICAgICAgICovXG4gICAgICAgIHNlbGYuY2xlYXJNYXJrZXJzID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGk8IHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIuc2V0TWFwKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogV2lsbCBkcmF3IG1hcmtlciB3aXRoIGFuaW1hdGlvbiBhbmQgYWRkIGFuIGV2ZW50IGxpc3RlbmVyXG4gICAgICAgICAqIHRvIGFjdGl2YXRlIHRoZSBjaG9zZW4gbWFya2VyXG4gICAgICAgICAqL1xuICAgICAgICBzZWxmLmFkZE1hcmtlcldpdGhBbmltYXRpb24gPSBmdW5jdGlvbihjdXJyZW50SXRlbSwgdGltZW91dCl7XG4gICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjoge2xhdDogY3VycmVudEl0ZW0ubGF0LCBsbmc6IGN1cnJlbnRJdGVtLmxuZ30sXG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogZ29vZ2xlLm1hcHMuQW5pbWF0aW9uLkRST1AsXG4gICAgICAgICAgICAgICAgICAgIGljb246IHBpbnMuZGVmYXVsdC5waW5JbWFnZSxcbiAgICAgICAgICAgICAgICAgICAgbWFwOiBzZWxmLm15TWFwLm1hcFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlci5hZGRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmFjdGl2YXRlTWFya2VyLmNhbGwoY3VycmVudEl0ZW0pOyAvLyBXZSB1c2UgLmNhbGwoKSB0byBzcGVjaWZ5IHRoZSB0aGlzIHZhbHVlIG9mIHRoZSBhY3RpdmF0ZU1hcmtlciBmdW5jdGlvblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSwgdGltZW91dCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFjdGl2YXRlIG1hcmtlcjogY2hhbmdlIGNvbG9yLCBib3VuY2UsIG9wZW4gaW5mbyB3aW5kb3dcbiAgICAgICAgICovXG4gICAgICAgIHNlbGYuYWN0aXZhdGVNYXJrZXIgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIG1hcmtlciA9IHRoaXMubWFya2VyO1xuICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gdGhpcztcbiAgICAgICAgICAgIHNlbGYuaW5hY3RpdmVBbGwoKTtcbiAgICAgICAgICAgIGxvY2F0aW9uLmFjdGl2ZSh0cnVlKTtcbiAgICAgICAgICAgIHNlbGYuYWN0aXZlQ29sb3IobWFya2VyKTtcbiAgICAgICAgICAgIHNlbGYuQm91bmNlKG1hcmtlcik7XG4gICAgICAgICAgICBzZWxmLmluaXRDb250ZW50KGxvY2F0aW9uKTtcbiAgICAgICAgICAgIHNlbGYuaW5mb1dpbmRvdy5vcGVuKHNlbGYubXlNYXAsIG1hcmtlcik7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZWFjdGl2YXRlIGFsbCBtYXJrZXJzOiBjaGFuZ2UgY29sb3IsIGJvdW5jZSwgb3BlbiBpbmZvIHdpbmRvd1xuICAgICAgICAgKi9cbiAgICAgICAgc2VsZi5pbmFjdGl2ZUFsbCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpPCBzZWxmLmxvY2F0aW9uc0xpc3QoKS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRJdGVtID0gc2VsZi5sb2NhdGlvbnNMaXN0KClbaV07XG4gICAgICAgICAgICAgICAgY3VycmVudEl0ZW0uYWN0aXZlKGZhbHNlKTtcbiAgICAgICAgICAgICAgICBzZWxmLmRlZmF1bHRDb2xvcihjdXJyZW50SXRlbS5tYXJrZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQm91bmNlIG1hcmtlclxuICAgICAgICAgKi9cbiAgICAgICAgc2VsZi5Cb3VuY2UgPSBmdW5jdGlvbihjdXJyZW50TWFya2VyKXtcbiAgICAgICAgICAgIGlmIChjdXJyZW50TWFya2VyLmdldEFuaW1hdGlvbigpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudE1hcmtlci5zZXRBbmltYXRpb24obnVsbCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRNYXJrZXIuc2V0QW5pbWF0aW9uKGdvb2dsZS5tYXBzLkFuaW1hdGlvbi5CT1VOQ0UpO1xuICAgICAgICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRNYXJrZXIuc2V0QW5pbWF0aW9uKG51bGwpO1xuICAgICAgICAgICAgICAgIH0sNzAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNldCBcImFjdGl2ZVwiIGljb24gb24gY3VycmVudCBtYXJrZXJcbiAgICAgICAgICovXG4gICAgICAgIHNlbGYuYWN0aXZlQ29sb3IgPSBmdW5jdGlvbihjdXJyZW50TWFya2VyKXtcbiAgICAgICAgICAgIGN1cnJlbnRNYXJrZXIuc2V0SWNvbihwaW5zLmFjdGl2ZS5waW5JbWFnZSk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXQgXCJkZWZhdWx0XCIgaWNvbiBvbiBjdXJyZW50IG1hcmtlclxuICAgICAgICAgKi9cbiAgICAgICAgc2VsZi5kZWZhdWx0Q29sb3IgPSBmdW5jdGlvbihjdXJyZW50TWFya2VyKXtcbiAgICAgICAgICAgIGN1cnJlbnRNYXJrZXIuc2V0SWNvbihwaW5zLmRlZmF1bHQucGluSW1hZ2UpO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogU2V0IFwiZGVmYXVsdFwiIGljb24gb24gQUxMIG1hcmtlcnNcbiAgICAgICAgICovXG4gICAgICAgIHNlbGYuZGVmYXVsdENvbG9yQWxsID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGk8IHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgICAgICBzZWxmLmRlZmF1bHRDb2xvcihjdXJyZW50SXRlbS5tYXJrZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH07XG5cblxuICAgIGtvLmFwcGx5QmluZGluZ3MobmV3IG15Vmlld01vZGVsKTtcbn07XG5cbi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuLyogZ29vZ2xlU3VjY2VzcygpIGlzIHRoZSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IHdpbGwgcnVuIHdoZW4gR29vZ2xlIE1hcHMgQXBpXG4vKiBsb2Fkcy5cbi8qIGdvb2dsZVN1Y2Nlc3MoKTogY2FsbHMgdGhlIGluaXRpYXRlVmlldygpIGZ1bmN0aW9uIC5cbiovXG5mdW5jdGlvbiBnb29nbGVTdWNjZXNzKCl7XG4gICAgaW5pdGlhdGVWaWV3KCk7XG59O1xuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4vKiBnb29nbGVFcnJvcigpIHdpbGwgcnVuIGlmIEdvb2dsZSBNYXBzIEFwaSBkb2VzIG5vdCBsb2FkIHByb3Blcmx5LiBJdCBqdXN0XG4vKiBkaXNwbGF5cyBhbiBlcnJvciBtZXNzYWdlLlxuKi9cbmZ1bmN0aW9uIGdvb2dsZUVycm9yKCl7XG4gICAgJCgnYm9keScpLmh0bWwoJycpO1xuICAgICQoJ2JvZHknKS5hcHBlbmQoXCI8aDE+VGhlcmUgd2FzIGFuIGVycm9yIGxvYWRpbmcgR29vZ2xlIE1hcHMuIFBsZWFzZSB0cnkgYWdhaW4gbGF0ZXIuPC9oMT5cIik7XG59O1xuXG5cbiAgICAgICAgIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
