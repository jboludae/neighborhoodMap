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


        
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhbGwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBpbml0aWF0ZVZpZXcoKXtcbiAgICB2YXIgeWVscF9sb2NhdGlvbnM7XG4gICAgdmFyIHBpbnMgPSB7XG4gICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgIHBpbkltYWdlIDogbmV3IGdvb2dsZS5tYXBzLk1hcmtlckltYWdlKFwiaHR0cDovL2NoYXJ0LmFwaXMuZ29vZ2xlLmNvbS9jaGFydD9jaHN0PWRfbWFwX3Bpbl9sZXR0ZXImY2hsZD0lRTIlODAlQTJ8XCIgK1xuICAgICAgICAgICAgJ0REODg4OCcsXG4gICAgICAgICAgICBuZXcgZ29vZ2xlLm1hcHMuU2l6ZSgyMSwgMzQpLFxuICAgICAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlBvaW50KDAsMCksXG4gICAgICAgICAgICBuZXcgZ29vZ2xlLm1hcHMuUG9pbnQoMTAsIDM0KSlcbiAgICAgICAgfSxcbiAgICAgICAgYWN0aXZlOiB7XG4gICAgICAgICAgICBwaW5JbWFnZSA6IG5ldyBnb29nbGUubWFwcy5NYXJrZXJJbWFnZShcImh0dHA6Ly9jaGFydC5hcGlzLmdvb2dsZS5jb20vY2hhcnQ/Y2hzdD1kX21hcF9waW5fbGV0dGVyJmNobGQ9JUUyJTgwJUEyfFwiICtcbiAgICAgICAgICAgICdBQUREREQnLFxuICAgICAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlNpemUoMjEsIDM0KSxcbiAgICAgICAgICAgIG5ldyBnb29nbGUubWFwcy5Qb2ludCgwLDApLFxuICAgICAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlBvaW50KDEwLCAzNCkpXG5cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgbmVpZ2hib3Job29kTWFwID0gZnVuY3Rpb24oKXtcbiAgICAgICAgdGhpcy5tYXBEaXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwJyk7XG4gICAgICAgIHRoaXMuY2VudGVyTWFwID0ge2xhdDogNDMuMjYzMjI0LCBsbmc6IC0yLjkzNTAwM307XG4gICAgICAgIHRoaXMuem9vbSA9IDE1O1xuICAgICAgICB0aGlzLm1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAodGhpcy5tYXBEaXYsIHtcbiAgICAgICAgICAgIHpvb206IHRoaXMuem9vbSxcbiAgICAgICAgICAgIGNlbnRlcjogdGhpcy5jZW50ZXJNYXBcbiAgICAgICAgfSk7XG4gICAgfTtcblxuXG4gICAgdmFyIExvY2F0aW9uID0gZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgIHRoaXMubmFtZSA9IGRhdGEubmFtZTtcbiAgICAgICAgdGhpcy5sYXQgPSBwYXJzZUZsb2F0KGRhdGEubG9jYXRpb24uY29vcmRpbmF0ZS5sYXRpdHVkZSk7XG4gICAgICAgIHRoaXMubG5nID0gcGFyc2VGbG9hdChkYXRhLmxvY2F0aW9uLmNvb3JkaW5hdGUubG9uZ2l0dWRlKTtcbiAgICAgICAgdGhpcy5hZGRyZXNzID0gZGF0YS5sb2NhdGlvbi5hZGRyZXNzLmpvaW4oXCIgXCIpO1xuICAgICAgICB0aGlzLnBob25lID0gZGF0YS5kaXNwbGF5X3Bob25lO1xuICAgICAgICB0aGlzLmNpdHkgPSBkYXRhLmxvY2F0aW9uLmNpdHk7XG4gICAgICAgIHRoaXMucG9zdGFsX2NvZGUgPSBkYXRhLmxvY2F0aW9uLnBvc3RhbF9jb2RlO1xuICAgICAgICB0aGlzLnllbHBfcmF0aW5nID0gZGF0YS5yYXRpbmc7XG4gICAgICAgIHRoaXMucmV2aWV3X2NvdW50ID0gZGF0YS5yZXZpZXdfY291bnQ7XG4gICAgICAgIHRoaXMucmF0aW5nX2ltZ191cmwgPSBkYXRhLnJhdGluZ19pbWdfdXJsO1xuICAgICAgICB0aGlzLmRpc3BsYXkgPSBrby5vYnNlcnZhYmxlKHRydWUpO1xuICAgICAgICB0aGlzLm1hcmtlciA9IG51bGw7XG4gICAgICAgIHRoaXMuYWN0aXZlID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG4gICAgfTtcblxuICAgIHZhciBteVZpZXdNb2RlbCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi5sb2NhdGlvbnNMaXN0ID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcbiAgICAgICAgc2VsZi5teU1hcCA9IG5ldyBuZWlnaGJvcmhvb2RNYXAoKTtcbiAgICAgICAgc2VsZi5jdXJyZW50RmlsdGVyID0ga28ub2JzZXJ2YWJsZSgnJyk7XG5cbiAgICAgICAgdmFyIGluZm9XaW5kb3cgPSBuZXcgZ29vZ2xlLm1hcHMuSW5mb1dpbmRvdygpO1xuXG4gICAgICAgIC8vIFRPIERPOiBJTlRFR1JBVEUgV0lUSCBZRUxQIEFQSVxuICAgICAgICAvKipcbiAgICAgICAgICogR2VuZXJhdGVzIGEgcmFuZG9tIG51bWJlciBhbmQgcmV0dXJucyBpdCBhcyBhIHN0cmluZyBmb3IgT0F1dGhlbnRpY2F0aW9uXG4gICAgICAgICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIG5vbmNlX2dlbmVyYXRlKCkge1xuICAgICAgICAgICAgcmV0dXJuIChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxZTEyKS50b1N0cmluZygpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBZRUxQX0JBU0VfVVJMID0gJ2h0dHBzOi8vYXBpLnllbHAuY29tL3YyL3NlYXJjaD8nO1xuXG5cbiAgICAgICAgdmFyIHllbHBfdXJsID0gWUVMUF9CQVNFX1VSTDtcblxuICAgICAgICB2YXIgcGFyYW1ldGVycyA9IHtcbiAgICAgICAgICAgIG9hdXRoX2NvbnN1bWVyX2tleTogJ1M4LThUaWFQU2NtVndTdHVSMUdBX1EnLFxuICAgICAgICAgICAgb2F1dGhfdG9rZW46ICdVb0E3bTE4NTF5YU9zRnpzYkJnUU9saU1ER1Nlcl9HcycsXG4gICAgICAgICAgICBvYXV0aF9ub25jZTogbm9uY2VfZ2VuZXJhdGUoKSxcbiAgICAgICAgICAgIG9hdXRoX3RpbWVzdGFtcDogTWF0aC5mbG9vcihEYXRlLm5vdygpLzEwMDApLFxuICAgICAgICAgICAgb2F1dGhfc2lnbmF0dXJlX21ldGhvZDogJ0hNQUMtU0hBMScsXG4gICAgICAgICAgICBvYXV0aF92ZXJzaW9uIDogJzEuMCcsXG4gICAgICAgICAgICBjYWxsYmFjazogJ2NiJywgLy8gVGhpcyBpcyBjcnVjaWFsIHRvIGluY2x1ZGUgZm9yIGpzb25wIGltcGxlbWVudGF0aW9uIGluIEFKQVggb3IgZWxzZSB0aGUgb2F1dGgtc2lnbmF0dXJlIHdpbGwgYmUgd3JvbmcuXG4gICAgICAgICAgICBsb2NhdGlvbjogJ0JpbGJhbytTcGFpbicsXG4gICAgICAgICAgICB0ZXJtOiAncmVzdGF1cmFudCcsXG4gICAgICAgICAgICBsaW1pdDogMjAsXG4gICAgICAgICAgICBzb3J0OiAyLFxuICAgICAgICAgICAgY2xsOiAnNDMuMjYzMjI0LEMtMi45MzUwMDMnXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGVuY29kZWRTaWduYXR1cmUgPSBvYXV0aFNpZ25hdHVyZS5nZW5lcmF0ZSgnR0VUJyx5ZWxwX3VybCwgcGFyYW1ldGVycywgJ1BVYWRjVERwXzljMURoUkQ3cGtmcEU3UkRNaycsICdvdFBHelpELUJ4b3dObTdZeWxWekdWQjFDaVEnKTtcbiAgICAgICAgcGFyYW1ldGVycy5vYXV0aF9zaWduYXR1cmUgPSBlbmNvZGVkU2lnbmF0dXJlO1xuXG4gICAgICAgIHZhciBzZXR0aW5ncyA9IHtcbiAgICAgICAgICAgIHVybDogeWVscF91cmwsXG4gICAgICAgICAgICBkYXRhOiBwYXJhbWV0ZXJzLFxuICAgICAgICAgICAgY2FjaGU6IHRydWUsICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgY3J1Y2lhbCB0byBpbmNsdWRlIGFzIHdlbGwgdG8gcHJldmVudCBqUXVlcnkgZnJvbSBhZGRpbmcgb24gYSBjYWNoZS1idXN0ZXIgcGFyYW1ldGVyIFwiXz0yMzQ4OTQ4OTc0OTgzN1wiLCBpbnZhbGlkYXRpbmcgb3VyIG9hdXRoLXNpZ25hdHVyZVxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29ucCcsXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXN1bHRzKSB7XG4gICAgICAgICAgICAgIHllbHBfbG9jYXRpb25zID0gcmVzdWx0cy5idXNpbmVzc2VzO1xuICAgICAgICAgICAgICBzZWxmLmluaXQoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmYWlsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZhaWxlZCEhJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gU2VuZCBBSkFYIHF1ZXJ5IHZpYSBqUXVlcnkgbGlicmFyeS5cbiAgICAgICAgJC5hamF4KHNldHRpbmdzKTtcblxuICAgICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIC8vIC0tLS0tLS0tLS0gVE8gRE86IElNUExFTUVOVCBHT09HTEUgTUFQUyBQTEFDRVNcbiAgICAgICAgc2VsZi5wcmludENvbnNvbGUgPSBmdW5jdGlvbihwbGFjZSwgc3RhdHVzKXtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHBsYWNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuc2VydmljZSA9IG5ldyBnb29nbGUubWFwcy5wbGFjZXMuUGxhY2VzU2VydmljZShzZWxmLm15TWFwLm1hcCk7XG4gICAgICAgIFxuICAgICAgICBzZWxmLnJldHJpZXZlUGxhY2VzRGV0YWlscyA9IGZ1bmN0aW9uKHJlc3VsdHMsc3RhdHVzLCBsb2NhdGlvbil7XG4gICAgICAgICAgICB2YXIgcmVxdWVzdCA9IHtcbiAgICAgICAgICAgICAgICBwbGFjZUlkOiByZXN1bHRzWzBdLnBsYWNlX2lkXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgc2VsZi5zZXJ2aWNlLmdldERldGFpbHMocmVxdWVzdCxmdW5jdGlvbihyZXN1bHQsc3RhdHVzKXtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbi5wbGFjZV9pZCA9IHJlc3VsdC5wbGFjZV9pZDtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbi5waG90b3NfYXJyYXkgPSByZXN1bHQucGhvdG9zO1xuICAgICAgICAgICAgICAgIGxvY2F0aW9uLmZpcnN0X3BpY3R1cmVfdXJsID0gcmVzdWx0LnBob3Rvc1swXS5nZXRVcmwoeydtYXhIZWlnaHQnOiAzMDAsICdtYXhXaWR0aCc6IDMwMH0pO1xuICAgICAgICAgICAgICAgIGxvY2F0aW9uLndlYnNpdGUgPSByZXN1bHQud2Vic2l0ZTtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbi5yYXRpbmcgPSByZXN1bHQucmF0aW5nO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgc2VsZi5wcmVwYXJlSW5mb1dpbmRvd0NvbnRlbnQobG9jYXRpb24pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgc2VsZi5yZXRyaWV2ZUluZm9Hb29nbGVQbGFjZXMgPSBmdW5jdGlvbihsb2NhdGlvbil7XG4gICAgICAgICAgICBzZWxmLnNlcnZpY2UubmVhcmJ5U2VhcmNoKHtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbjogc2VsZi5teU1hcC5jZW50ZXJNYXAsXG4gICAgICAgICAgICAgICAgcmFkaXVzOiAyMDAwLFxuICAgICAgICAgICAgICAgIGtleXdvcmQ6IGxvY2F0aW9uLm5hbWVcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKHJlc3VsdCwgc3RhdHVzKXtcbiAgICAgICAgICAgICAgICBzZWxmLnJldHJpZXZlUGxhY2VzRGV0YWlscyhyZXN1bHQsIHN0YXR1cywgbG9jYXRpb24pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICAvLyAtLS0tLS0tLS0tIFRPIERPOiBJTVBMRU1FTlQgR09PR0xFIE1BUFMgUExBQ0VTXG5cbiAgICAgICAgdmFyIHN1YnNjcmlwdGlvbiA9IHNlbGYuY3VycmVudEZpbHRlci5zdWJzY3JpYmUoZnVuY3Rpb24obmV3VmFsdWUpe1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGk8c2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciBsb2NhdGlvbk5hbWUgPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXS5uYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgdGFyZ2V0U3RyaW5nID0gbmV3VmFsdWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICBpZiAobG9jYXRpb25OYW1lLmluZGV4T2YodGFyZ2V0U3RyaW5nKSA9PT0gLTEpe1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXS5kaXNwbGF5KGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5sb2NhdGlvbnNMaXN0KClbaV0uZGlzcGxheSh0cnVlKTsgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZi5yZWRyYXdNYXJrZXJzKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHNlbGYuaW5pdCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB5ZWxwX2xvY2F0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKGxvY2F0aW9uSXRlbSl7XG4gICAgICAgICAgICAgICAgc2VsZi5sb2NhdGlvbnNMaXN0LnB1c2gobmV3IExvY2F0aW9uKGxvY2F0aW9uSXRlbSkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzZWxmLmRyYXdNYXJrZXJzKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgc2VsZi5kcmF3TWFya2VycyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpPCBzZWxmLmxvY2F0aW9uc0xpc3QoKS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRJdGVtID0gc2VsZi5sb2NhdGlvbnNMaXN0KClbaV07XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRJdGVtLmRpc3BsYXkoKSA9PT0gdHJ1ZSl7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuYWRkTWFya2VyV2l0aEFuaW1hdGlvbihjdXJyZW50SXRlbSwgaSoxMDApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZihjdXJyZW50SXRlbS5tYXJrZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEl0ZW0ubWFya2VyLnNldE1hcChudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgc2VsZi5yZWRyYXdNYXJrZXJzID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGk8IHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudEl0ZW0uZGlzcGxheSgpID09PSB0cnVlKXtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEl0ZW0ubWFya2VyLnNldE1hcChzZWxmLm15TWFwLm1hcCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmKGN1cnJlbnRJdGVtLm1hcmtlciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIuc2V0TWFwKG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLmNsZWFyTWFya2VycyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpPCBzZWxmLmxvY2F0aW9uc0xpc3QoKS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRJdGVtID0gc2VsZi5sb2NhdGlvbnNMaXN0KClbaV07XG4gICAgICAgICAgICAgICAgY3VycmVudEl0ZW0ubWFya2VyLnNldE1hcChudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLmFkZE1hcmtlcldpdGhBbmltYXRpb24gPSBmdW5jdGlvbihjdXJyZW50SXRlbSwgdGltZW91dCl7XG4gICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjoge2xhdDogY3VycmVudEl0ZW0ubGF0LCBsbmc6IGN1cnJlbnRJdGVtLmxuZ30sXG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogZ29vZ2xlLm1hcHMuQW5pbWF0aW9uLkRST1AsXG4gICAgICAgICAgICAgICAgICAgIGljb246IHBpbnMuZGVmYXVsdC5waW5JbWFnZSxcbiAgICAgICAgICAgICAgICAgICAgbWFwOiBzZWxmLm15TWFwLm1hcFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlci5hZGRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmFjdGl2YXRlTWFya2VyLmNhbGwoY3VycmVudEl0ZW0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSwgdGltZW91dCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgc2VsZi5pbml0Q29udGVudCA9IGZ1bmN0aW9uKGxvY2F0aW9uKXtcbiAgICAgICAgICAgIHNlbGYucmV0cmlldmVJbmZvR29vZ2xlUGxhY2VzKGxvY2F0aW9uKTtcbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLnByZXBhcmVJbmZvV2luZG93Q29udGVudCA9IGZ1bmN0aW9uKGxvY2F0aW9uKXtcbiAgICAgICAgICAgIHZhciBwaWN0dXJlU3RyaW5nID0gXCI8aWZyYW1lIHdpZHRoPSczMDAnIGhlaWdodD0nYXV0bycgZnJhbWVib3JkZXI9JzAnIHNyYz0nXCIrbG9jYXRpb24uZmlyc3RfcGljdHVyZV91cmwrXCInPjwvaWZyYW1lPlwiO1xuICAgICAgICAgICAgdmFyIGNvbnRlbnRTdHJpbmcgPSBcIjxkaXYgY2xhc3M9J2luZm9XaW4nPlwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0naW1hZ2VDb250ZW50Jz5cIitcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwaWN0dXJlU3RyaW5nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPC9kaXY+XCIrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J3RleHRDb250ZW50Jz5cIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8aDUgY2xhc3M9J2luZm9UaXRsZSc+XCIrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uLm5hbWUgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPC9oNT5cIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8dWwgY2xhc3M9J2luZm9EYXRhJz5cIitcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8bGk+IFRlbC4gXCIrbG9jYXRpb24ucGhvbmUrXCI8L2xpPlwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxsaT5cIitsb2NhdGlvbi5hZGRyZXNzK1wiPC9saT5cIitcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8bGk+XCIrbG9jYXRpb24ucG9zdGFsX2NvZGUrXCIgXCIrbG9jYXRpb24uY2l0eStcIjwvbGk+XCIrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPGxpPlwiK1wiPGEgaHJlZj0nXCIrbG9jYXRpb24ud2Vic2l0ZStcIicgdGFyZ2V0PSdfYmxhbmsnPlwiK2xvY2F0aW9uLndlYnNpdGUrXCI8L2E+PC9saT5cIitcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjwvdWw+XCIrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjwvZGl2PlwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdyYXRpbmdzQ29udGVudCc+XCIrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8aW1nIHNyYz0nXCIrbG9jYXRpb24ucmF0aW5nX2ltZ191cmwgK1wiJyBhbHQ9J3llbHAgc3RhciByYXRpbmcnPlwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPHNwYW4gY2xhc3M9J3Jldmlld0NvdW50Jz4gXCIrbG9jYXRpb24ucmV2aWV3X2NvdW50K1wiIFllbHAgcmV2aWV3czwvc3Bhbj5cIisgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjwvZGl2PlwiK1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPC9kaXY+XCI7XG4gICAgICAgICAgICBpbmZvV2luZG93LnNldENvbnRlbnQoY29udGVudFN0cmluZyk7XG4gICAgICAgIH07XG5cblxuICAgICAgICBzZWxmLmFjdGl2YXRlTWFya2VyID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciBtYXJrZXIgPSB0aGlzLm1hcmtlcjtcbiAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IHRoaXM7XG4gICAgICAgICAgICBzZWxmLmluYWN0aXZlQWxsKCk7XG4gICAgICAgICAgICBsb2NhdGlvbi5hY3RpdmUodHJ1ZSk7XG4gICAgICAgICAgICBzZWxmLmFjdGl2ZUNvbG9yKG1hcmtlcik7XG4gICAgICAgICAgICBzZWxmLkJvdW5jZShtYXJrZXIpO1xuICAgICAgICAgICAgc2VsZi5pbml0Q29udGVudChsb2NhdGlvbik7XG4gICAgICAgICAgICAvLyBpbmZvV2luZG93LnNldENvbnRlbnQobG9jYXRpb24ubmFtZSk7XG4gICAgICAgICAgICBpbmZvV2luZG93Lm9wZW4oc2VsZi5teU1hcCwgbWFya2VyKTtcbiAgICAgICAgfTtcblxuXG4gICAgICAgIHNlbGYuZmluZENsaWNrZWRNYXJrZXIgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLkJvdW5jZSA9IGZ1bmN0aW9uKGN1cnJlbnRNYXJrZXIpe1xuICAgICAgICAgICAgLy8gdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRNYXJrZXIuZ2V0QW5pbWF0aW9uKCkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50TWFya2VyLnNldEFuaW1hdGlvbihudWxsKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY3VycmVudE1hcmtlci5zZXRBbmltYXRpb24oZ29vZ2xlLm1hcHMuQW5pbWF0aW9uLkJPVU5DRSk7XG4gICAgICAgICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudE1hcmtlci5zZXRBbmltYXRpb24obnVsbCk7XG4gICAgICAgICAgICAgICAgfSw3MDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHNlbGYuYWN0aXZlQ29sb3IgPSBmdW5jdGlvbihjdXJyZW50TWFya2VyKXtcbiAgICAgICAgICAgIGN1cnJlbnRNYXJrZXIuc2V0SWNvbihwaW5zLmFjdGl2ZS5waW5JbWFnZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgc2VsZi5kZWZhdWx0Q29sb3IgPSBmdW5jdGlvbihjdXJyZW50TWFya2VyKXtcbiAgICAgICAgICAgIGN1cnJlbnRNYXJrZXIuc2V0SWNvbihwaW5zLmRlZmF1bHQucGluSW1hZ2UpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHNlbGYuaW5hY3RpdmVBbGwgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgZm9yKHZhciBpID0gMDsgaTwgc2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50SXRlbSA9IHNlbGYubG9jYXRpb25zTGlzdCgpW2ldO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLmFjdGl2ZShmYWxzZSk7XG4gICAgICAgICAgICAgICAgc2VsZi5kZWZhdWx0Q29sb3IoY3VycmVudEl0ZW0ubWFya2VyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLmRlZmF1bHRDb2xvckFsbCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpPCBzZWxmLmxvY2F0aW9uc0xpc3QoKS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRJdGVtID0gc2VsZi5sb2NhdGlvbnNMaXN0KClbaV07XG4gICAgICAgICAgICAgICAgc2VsZi5kZWZhdWx0Q29sb3IoY3VycmVudEl0ZW0ubWFya2VyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9O1xuXG5cbiAgICBrby5hcHBseUJpbmRpbmdzKG5ldyBteVZpZXdNb2RlbCk7XG59O1xuXG5mdW5jdGlvbiBnb29nbGVTdWNjZXNzKCl7XG4gICAgaW5pdGlhdGVWaWV3KCk7XG59O1xuXG5mdW5jdGlvbiBnb29nbGVFcnJvcigpe1xuICAgICQoJ2JvZHknKS5odG1sKCcnKTtcbiAgICAkKCdib2R5JykuYXBwZW5kKFwiPGgxPlRoZXJlIHdhcyBhbiBlcnJvciBsb2FkaW5nIEdvb2dsZSBNYXBzLiBQbGVhc2UgdHJ5IGFnYWluIGluIDEwIGhvdXJzLjwvaDE+XCIpO1xufTtcblxuXG4gICAgICAgICJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
