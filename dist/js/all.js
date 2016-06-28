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

        var infoWindow = new google.maps.InfoWindow({
            content: "<h3>Josep</h3>"
        });

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
        self.service = new google.maps.places.PlacesService(self.myMap.map);
        self.processResults = function(results,status){
            // console.log(results);
        };
        self.service.nearbySearch({
            location: self.myMap.centerMap,
            radius: 2000,
            type: ['cafe']
        }, self.processResults);


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

        self.prepareContent = function(location){
            var streetViewString = "<iframe width='300' height='300' frameborder='0' src='https://www.google.com/maps/embed/v1/streetview?key=AIzaSyDpH8QVW2DZa0D9E251zhSIbLDmDzWB4k4&location=46.414382,10.013988&heading=210&pitch=10&fov=35'></iframe>";
            var contentString = "<div class='infoWin'>" +
                                    "<div class='textContent'>" +
                                        "<h5 class='infoTitle'>"+
                                            location.name +
                                        "</h5>" +
                                        "<ul class='infoData'>"+
                                            "<li> Tel. "+location.phone+"</li>"+
                                            "<li>"+location.address+"</li>"+
                                            "<li>"+location.postal_code+" "+location.city+"</li>"+
                                        "</ul>"+
                                    "</div>"+
                                    "<div class='imageContent'>"+
                                        "<img src='"+location.rating_img_url +"' alt='yelp star rating'>"+
                                        "<span class='reviewCount'> "+location.review_count+" Yelp reviews</span>"+
                                        streetViewString +
                                    "</div>"+
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
            self.prepareContent(location);
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


        
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhbGwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBpbml0aWF0ZVZpZXcoKXtcbiAgICB2YXIgeWVscF9sb2NhdGlvbnM7XG4gICAgdmFyIHBpbnMgPSB7XG4gICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgIHBpbkltYWdlIDogbmV3IGdvb2dsZS5tYXBzLk1hcmtlckltYWdlKFwiaHR0cDovL2NoYXJ0LmFwaXMuZ29vZ2xlLmNvbS9jaGFydD9jaHN0PWRfbWFwX3Bpbl9sZXR0ZXImY2hsZD0lRTIlODAlQTJ8XCIgK1xuICAgICAgICAgICAgJ0REODg4OCcsXG4gICAgICAgICAgICBuZXcgZ29vZ2xlLm1hcHMuU2l6ZSgyMSwgMzQpLFxuICAgICAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlBvaW50KDAsMCksXG4gICAgICAgICAgICBuZXcgZ29vZ2xlLm1hcHMuUG9pbnQoMTAsIDM0KSlcbiAgICAgICAgfSxcbiAgICAgICAgYWN0aXZlOiB7XG4gICAgICAgICAgICBwaW5JbWFnZSA6IG5ldyBnb29nbGUubWFwcy5NYXJrZXJJbWFnZShcImh0dHA6Ly9jaGFydC5hcGlzLmdvb2dsZS5jb20vY2hhcnQ/Y2hzdD1kX21hcF9waW5fbGV0dGVyJmNobGQ9JUUyJTgwJUEyfFwiICtcbiAgICAgICAgICAgICdBQUREREQnLFxuICAgICAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlNpemUoMjEsIDM0KSxcbiAgICAgICAgICAgIG5ldyBnb29nbGUubWFwcy5Qb2ludCgwLDApLFxuICAgICAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlBvaW50KDEwLCAzNCkpXG5cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgbmVpZ2hib3Job29kTWFwID0gZnVuY3Rpb24oKXtcbiAgICAgICAgdGhpcy5tYXBEaXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwJyk7XG4gICAgICAgIHRoaXMuY2VudGVyTWFwID0ge2xhdDogNDMuMjYzMjI0LCBsbmc6IC0yLjkzNTAwM307XG4gICAgICAgIHRoaXMuem9vbSA9IDE1O1xuICAgICAgICB0aGlzLm1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAodGhpcy5tYXBEaXYsIHtcbiAgICAgICAgICAgIHpvb206IHRoaXMuem9vbSxcbiAgICAgICAgICAgIGNlbnRlcjogdGhpcy5jZW50ZXJNYXBcbiAgICAgICAgfSk7XG4gICAgfTtcblxuXG4gICAgdmFyIExvY2F0aW9uID0gZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgIHRoaXMubmFtZSA9IGRhdGEubmFtZTtcbiAgICAgICAgdGhpcy5sYXQgPSBwYXJzZUZsb2F0KGRhdGEubG9jYXRpb24uY29vcmRpbmF0ZS5sYXRpdHVkZSk7XG4gICAgICAgIHRoaXMubG5nID0gcGFyc2VGbG9hdChkYXRhLmxvY2F0aW9uLmNvb3JkaW5hdGUubG9uZ2l0dWRlKTtcbiAgICAgICAgdGhpcy5hZGRyZXNzID0gZGF0YS5sb2NhdGlvbi5hZGRyZXNzLmpvaW4oXCIgXCIpO1xuICAgICAgICB0aGlzLnBob25lID0gZGF0YS5kaXNwbGF5X3Bob25lO1xuICAgICAgICB0aGlzLmNpdHkgPSBkYXRhLmxvY2F0aW9uLmNpdHk7XG4gICAgICAgIHRoaXMucG9zdGFsX2NvZGUgPSBkYXRhLmxvY2F0aW9uLnBvc3RhbF9jb2RlO1xuICAgICAgICB0aGlzLnllbHBfcmF0aW5nID0gZGF0YS5yYXRpbmc7XG4gICAgICAgIHRoaXMucmV2aWV3X2NvdW50ID0gZGF0YS5yZXZpZXdfY291bnQ7XG4gICAgICAgIHRoaXMucmF0aW5nX2ltZ191cmwgPSBkYXRhLnJhdGluZ19pbWdfdXJsO1xuICAgICAgICB0aGlzLmRpc3BsYXkgPSBrby5vYnNlcnZhYmxlKHRydWUpO1xuICAgICAgICB0aGlzLm1hcmtlciA9IG51bGw7XG4gICAgICAgIHRoaXMuYWN0aXZlID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG4gICAgfTtcblxuICAgIHZhciBteVZpZXdNb2RlbCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi5sb2NhdGlvbnNMaXN0ID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcbiAgICAgICAgc2VsZi5teU1hcCA9IG5ldyBuZWlnaGJvcmhvb2RNYXAoKTtcbiAgICAgICAgc2VsZi5jdXJyZW50RmlsdGVyID0ga28ub2JzZXJ2YWJsZSgnJyk7XG5cbiAgICAgICAgdmFyIGluZm9XaW5kb3cgPSBuZXcgZ29vZ2xlLm1hcHMuSW5mb1dpbmRvdyh7XG4gICAgICAgICAgICBjb250ZW50OiBcIjxoMz5Kb3NlcDwvaDM+XCJcbiAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIFRPIERPOiBJTlRFR1JBVEUgV0lUSCBZRUxQIEFQSVxuICAgICAgICAvKipcbiAgICAgICAgICogR2VuZXJhdGVzIGEgcmFuZG9tIG51bWJlciBhbmQgcmV0dXJucyBpdCBhcyBhIHN0cmluZyBmb3IgT0F1dGhlbnRpY2F0aW9uXG4gICAgICAgICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIG5vbmNlX2dlbmVyYXRlKCkge1xuICAgICAgICAgICAgcmV0dXJuIChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxZTEyKS50b1N0cmluZygpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBZRUxQX0JBU0VfVVJMID0gJ2h0dHBzOi8vYXBpLnllbHAuY29tL3YyL3NlYXJjaD8nO1xuXG5cbiAgICAgICAgdmFyIHllbHBfdXJsID0gWUVMUF9CQVNFX1VSTDtcblxuICAgICAgICB2YXIgcGFyYW1ldGVycyA9IHtcbiAgICAgICAgICAgIG9hdXRoX2NvbnN1bWVyX2tleTogJ1M4LThUaWFQU2NtVndTdHVSMUdBX1EnLFxuICAgICAgICAgICAgb2F1dGhfdG9rZW46ICdVb0E3bTE4NTF5YU9zRnpzYkJnUU9saU1ER1Nlcl9HcycsXG4gICAgICAgICAgICBvYXV0aF9ub25jZTogbm9uY2VfZ2VuZXJhdGUoKSxcbiAgICAgICAgICAgIG9hdXRoX3RpbWVzdGFtcDogTWF0aC5mbG9vcihEYXRlLm5vdygpLzEwMDApLFxuICAgICAgICAgICAgb2F1dGhfc2lnbmF0dXJlX21ldGhvZDogJ0hNQUMtU0hBMScsXG4gICAgICAgICAgICBvYXV0aF92ZXJzaW9uIDogJzEuMCcsXG4gICAgICAgICAgICBjYWxsYmFjazogJ2NiJywgLy8gVGhpcyBpcyBjcnVjaWFsIHRvIGluY2x1ZGUgZm9yIGpzb25wIGltcGxlbWVudGF0aW9uIGluIEFKQVggb3IgZWxzZSB0aGUgb2F1dGgtc2lnbmF0dXJlIHdpbGwgYmUgd3JvbmcuXG4gICAgICAgICAgICBsb2NhdGlvbjogJ0JpbGJhbytTcGFpbicsXG4gICAgICAgICAgICB0ZXJtOiAncmVzdGF1cmFudCcsXG4gICAgICAgICAgICBsaW1pdDogMjAsXG4gICAgICAgICAgICBzb3J0OiAyLFxuICAgICAgICAgICAgY2xsOiAnNDMuMjYzMjI0LEMtMi45MzUwMDMnXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGVuY29kZWRTaWduYXR1cmUgPSBvYXV0aFNpZ25hdHVyZS5nZW5lcmF0ZSgnR0VUJyx5ZWxwX3VybCwgcGFyYW1ldGVycywgJ1BVYWRjVERwXzljMURoUkQ3cGtmcEU3UkRNaycsICdvdFBHelpELUJ4b3dObTdZeWxWekdWQjFDaVEnKTtcbiAgICAgICAgcGFyYW1ldGVycy5vYXV0aF9zaWduYXR1cmUgPSBlbmNvZGVkU2lnbmF0dXJlO1xuXG4gICAgICAgIHZhciBzZXR0aW5ncyA9IHtcbiAgICAgICAgICAgIHVybDogeWVscF91cmwsXG4gICAgICAgICAgICBkYXRhOiBwYXJhbWV0ZXJzLFxuICAgICAgICAgICAgY2FjaGU6IHRydWUsICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgY3J1Y2lhbCB0byBpbmNsdWRlIGFzIHdlbGwgdG8gcHJldmVudCBqUXVlcnkgZnJvbSBhZGRpbmcgb24gYSBjYWNoZS1idXN0ZXIgcGFyYW1ldGVyIFwiXz0yMzQ4OTQ4OTc0OTgzN1wiLCBpbnZhbGlkYXRpbmcgb3VyIG9hdXRoLXNpZ25hdHVyZVxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29ucCcsXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXN1bHRzKSB7XG4gICAgICAgICAgICAgIHllbHBfbG9jYXRpb25zID0gcmVzdWx0cy5idXNpbmVzc2VzO1xuICAgICAgICAgICAgICBzZWxmLmluaXQoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmYWlsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZhaWxlZCEhJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gU2VuZCBBSkFYIHF1ZXJ5IHZpYSBqUXVlcnkgbGlicmFyeS5cbiAgICAgICAgJC5hamF4KHNldHRpbmdzKTtcblxuICAgICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cblxuICAgICAgICAvLyAtLS0tLS0tLS0tIFRPIERPOiBJTVBMRU1FTlQgR09PR0xFIE1BUFMgUExBQ0VTXG4gICAgICAgIHNlbGYuc2VydmljZSA9IG5ldyBnb29nbGUubWFwcy5wbGFjZXMuUGxhY2VzU2VydmljZShzZWxmLm15TWFwLm1hcCk7XG4gICAgICAgIHNlbGYucHJvY2Vzc1Jlc3VsdHMgPSBmdW5jdGlvbihyZXN1bHRzLHN0YXR1cyl7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhyZXN1bHRzKTtcbiAgICAgICAgfTtcbiAgICAgICAgc2VsZi5zZXJ2aWNlLm5lYXJieVNlYXJjaCh7XG4gICAgICAgICAgICBsb2NhdGlvbjogc2VsZi5teU1hcC5jZW50ZXJNYXAsXG4gICAgICAgICAgICByYWRpdXM6IDIwMDAsXG4gICAgICAgICAgICB0eXBlOiBbJ2NhZmUnXVxuICAgICAgICB9LCBzZWxmLnByb2Nlc3NSZXN1bHRzKTtcblxuXG4gICAgICAgIC8vIC0tLS0tLS0tLS0gVE8gRE86IElNUExFTUVOVCBHT09HTEUgTUFQUyBQTEFDRVNcblxuICAgICAgICB2YXIgc3Vic2NyaXB0aW9uID0gc2VsZi5jdXJyZW50RmlsdGVyLnN1YnNjcmliZShmdW5jdGlvbihuZXdWYWx1ZSl7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaTxzZWxmLmxvY2F0aW9uc0xpc3QoKS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uTmFtZSA9IHNlbGYubG9jYXRpb25zTGlzdCgpW2ldLm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICB0YXJnZXRTdHJpbmcgPSBuZXdWYWx1ZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIGlmIChsb2NhdGlvbk5hbWUuaW5kZXhPZih0YXJnZXRTdHJpbmcpID09PSAtMSl7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubG9jYXRpb25zTGlzdCgpW2ldLmRpc3BsYXkoZmFsc2UpO1xuICAgICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXS5kaXNwbGF5KHRydWUpOyAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWxmLnJlZHJhd01hcmtlcnMoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2VsZi5pbml0ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHllbHBfbG9jYXRpb25zLmZvckVhY2goZnVuY3Rpb24obG9jYXRpb25JdGVtKXtcbiAgICAgICAgICAgICAgICBzZWxmLmxvY2F0aW9uc0xpc3QucHVzaChuZXcgTG9jYXRpb24obG9jYXRpb25JdGVtKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHNlbGYuZHJhd01hcmtlcnMoKTtcbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLmRyYXdNYXJrZXJzID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGk8IHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudEl0ZW0uZGlzcGxheSgpID09PSB0cnVlKXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5hZGRNYXJrZXJXaXRoQW5pbWF0aW9uKGN1cnJlbnRJdGVtLCBpKjEwMCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmKGN1cnJlbnRJdGVtLm1hcmtlciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIuc2V0TWFwKG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLnJlZHJhd01hcmtlcnMgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgZm9yKHZhciBpID0gMDsgaTwgc2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50SXRlbSA9IHNlbGYubG9jYXRpb25zTGlzdCgpW2ldO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50SXRlbS5kaXNwbGF5KCkgPT09IHRydWUpe1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIuc2V0TWFwKHNlbGYubXlNYXAubWFwKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYoY3VycmVudEl0ZW0ubWFya2VyICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlci5zZXRNYXAobnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHNlbGYuY2xlYXJNYXJrZXJzID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGk8IHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIuc2V0TWFwKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHNlbGYuYWRkTWFya2VyV2l0aEFuaW1hdGlvbiA9IGZ1bmN0aW9uKGN1cnJlbnRJdGVtLCB0aW1lb3V0KXtcbiAgICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgY3VycmVudEl0ZW0ubWFya2VyID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcih7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7bGF0OiBjdXJyZW50SXRlbS5sYXQsIGxuZzogY3VycmVudEl0ZW0ubG5nfSxcbiAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uOiBnb29nbGUubWFwcy5BbmltYXRpb24uRFJPUCxcbiAgICAgICAgICAgICAgICAgICAgaWNvbjogcGlucy5kZWZhdWx0LnBpbkltYWdlLFxuICAgICAgICAgICAgICAgICAgICBtYXA6IHNlbGYubXlNYXAubWFwXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY3VycmVudEl0ZW0ubWFya2VyLmFkZExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuYWN0aXZhdGVNYXJrZXIuY2FsbChjdXJyZW50SXRlbSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLnByZXBhcmVDb250ZW50ID0gZnVuY3Rpb24obG9jYXRpb24pe1xuICAgICAgICAgICAgdmFyIHN0cmVldFZpZXdTdHJpbmcgPSBcIjxpZnJhbWUgd2lkdGg9JzMwMCcgaGVpZ2h0PSczMDAnIGZyYW1lYm9yZGVyPScwJyBzcmM9J2h0dHBzOi8vd3d3Lmdvb2dsZS5jb20vbWFwcy9lbWJlZC92MS9zdHJlZXR2aWV3P2tleT1BSXphU3lEcEg4UVZXMkRaYTBEOUUyNTF6aFNJYkxEbUR6V0I0azQmbG9jYXRpb249NDYuNDE0MzgyLDEwLjAxMzk4OCZoZWFkaW5nPTIxMCZwaXRjaD0xMCZmb3Y9MzUnPjwvaWZyYW1lPlwiO1xuICAgICAgICAgICAgdmFyIGNvbnRlbnRTdHJpbmcgPSBcIjxkaXYgY2xhc3M9J2luZm9XaW4nPlwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0ndGV4dENvbnRlbnQnPlwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxoNSBjbGFzcz0naW5mb1RpdGxlJz5cIitcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYXRpb24ubmFtZSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8L2g1PlwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjx1bCBjbGFzcz0naW5mb0RhdGEnPlwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxsaT4gVGVsLiBcIitsb2NhdGlvbi5waG9uZStcIjwvbGk+XCIrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPGxpPlwiK2xvY2F0aW9uLmFkZHJlc3MrXCI8L2xpPlwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxsaT5cIitsb2NhdGlvbi5wb3N0YWxfY29kZStcIiBcIitsb2NhdGlvbi5jaXR5K1wiPC9saT5cIitcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjwvdWw+XCIrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjwvZGl2PlwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdpbWFnZUNvbnRlbnQnPlwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPGltZyBzcmM9J1wiK2xvY2F0aW9uLnJhdGluZ19pbWdfdXJsICtcIicgYWx0PSd5ZWxwIHN0YXIgcmF0aW5nJz5cIitcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxzcGFuIGNsYXNzPSdyZXZpZXdDb3VudCc+IFwiK2xvY2F0aW9uLnJldmlld19jb3VudCtcIiBZZWxwIHJldmlld3M8L3NwYW4+XCIrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyZWV0Vmlld1N0cmluZyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjwvZGl2PlwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjwvZGl2PlwiO1xuICAgICAgICAgICAgaW5mb1dpbmRvdy5zZXRDb250ZW50KGNvbnRlbnRTdHJpbmcpO1xuICAgICAgICB9O1xuXG5cbiAgICAgICAgc2VsZi5hY3RpdmF0ZU1hcmtlciA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgbWFya2VyID0gdGhpcy5tYXJrZXI7XG4gICAgICAgICAgICB2YXIgbG9jYXRpb24gPSB0aGlzO1xuICAgICAgICAgICAgc2VsZi5pbmFjdGl2ZUFsbCgpO1xuICAgICAgICAgICAgbG9jYXRpb24uYWN0aXZlKHRydWUpO1xuICAgICAgICAgICAgc2VsZi5hY3RpdmVDb2xvcihtYXJrZXIpO1xuICAgICAgICAgICAgc2VsZi5Cb3VuY2UobWFya2VyKTtcbiAgICAgICAgICAgIHNlbGYucHJlcGFyZUNvbnRlbnQobG9jYXRpb24pO1xuICAgICAgICAgICAgLy8gaW5mb1dpbmRvdy5zZXRDb250ZW50KGxvY2F0aW9uLm5hbWUpO1xuICAgICAgICAgICAgaW5mb1dpbmRvdy5vcGVuKHNlbGYubXlNYXAsIG1hcmtlcik7XG4gICAgICAgIH07XG5cblxuICAgICAgICBzZWxmLmZpbmRDbGlja2VkTWFya2VyID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5Cb3VuY2UgPSBmdW5jdGlvbihjdXJyZW50TWFya2VyKXtcbiAgICAgICAgICAgIC8vIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIGlmIChjdXJyZW50TWFya2VyLmdldEFuaW1hdGlvbigpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudE1hcmtlci5zZXRBbmltYXRpb24obnVsbCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRNYXJrZXIuc2V0QW5pbWF0aW9uKGdvb2dsZS5tYXBzLkFuaW1hdGlvbi5CT1VOQ0UpO1xuICAgICAgICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRNYXJrZXIuc2V0QW5pbWF0aW9uKG51bGwpO1xuICAgICAgICAgICAgICAgIH0sNzAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLmFjdGl2ZUNvbG9yID0gZnVuY3Rpb24oY3VycmVudE1hcmtlcil7XG4gICAgICAgICAgICBjdXJyZW50TWFya2VyLnNldEljb24ocGlucy5hY3RpdmUucGluSW1hZ2UpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHNlbGYuZGVmYXVsdENvbG9yID0gZnVuY3Rpb24oY3VycmVudE1hcmtlcil7XG4gICAgICAgICAgICBjdXJyZW50TWFya2VyLnNldEljb24ocGlucy5kZWZhdWx0LnBpbkltYWdlKTtcbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLmluYWN0aXZlQWxsID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGk8IHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5hY3RpdmUoZmFsc2UpO1xuICAgICAgICAgICAgICAgIHNlbGYuZGVmYXVsdENvbG9yKGN1cnJlbnRJdGVtLm1hcmtlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgc2VsZi5kZWZhdWx0Q29sb3JBbGwgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgZm9yKHZhciBpID0gMDsgaTwgc2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50SXRlbSA9IHNlbGYubG9jYXRpb25zTGlzdCgpW2ldO1xuICAgICAgICAgICAgICAgIHNlbGYuZGVmYXVsdENvbG9yKGN1cnJlbnRJdGVtLm1hcmtlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfTtcblxuXG4gICAga28uYXBwbHlCaW5kaW5ncyhuZXcgbXlWaWV3TW9kZWwpO1xufTtcblxuZnVuY3Rpb24gZ29vZ2xlU3VjY2Vzcygpe1xuICAgIGluaXRpYXRlVmlldygpO1xufTtcblxuZnVuY3Rpb24gZ29vZ2xlRXJyb3IoKXtcbiAgICAkKCdib2R5JykuaHRtbCgnJyk7XG4gICAgJCgnYm9keScpLmFwcGVuZChcIjxoMT5UaGVyZSB3YXMgYW4gZXJyb3IgbG9hZGluZyBHb29nbGUgTWFwcy4gUGxlYXNlIHRyeSBhZ2FpbiBpbiAxMCBob3Vycy48L2gxPlwiKTtcbn07XG5cblxuICAgICAgICAiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
