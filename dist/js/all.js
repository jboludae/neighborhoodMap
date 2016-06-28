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
                    self.inactiveAll();
                    var currentMarker = this;
                    currentItem.active(true);
                    self.activeColor(currentMarker);
                    self.Bounce(currentMarker);
                    infoWindow.open(self.myMap, currentMarker);
                });
            }, timeout);
        };

        self.activateMarker = function(){
            var marker = this.marker;
            var location = this;
            self.inactiveAll();
            location.active(true);
            self.activeColor(marker);
            self.Bounce(marker);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhbGwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBpbml0aWF0ZVZpZXcoKXtcbiAgICB2YXIgeWVscF9sb2NhdGlvbnM7XG4gICAgdmFyIHBpbnMgPSB7XG4gICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgIHBpbkltYWdlIDogbmV3IGdvb2dsZS5tYXBzLk1hcmtlckltYWdlKFwiaHR0cDovL2NoYXJ0LmFwaXMuZ29vZ2xlLmNvbS9jaGFydD9jaHN0PWRfbWFwX3Bpbl9sZXR0ZXImY2hsZD0lRTIlODAlQTJ8XCIgK1xuICAgICAgICAgICAgJ0REODg4OCcsXG4gICAgICAgICAgICBuZXcgZ29vZ2xlLm1hcHMuU2l6ZSgyMSwgMzQpLFxuICAgICAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlBvaW50KDAsMCksXG4gICAgICAgICAgICBuZXcgZ29vZ2xlLm1hcHMuUG9pbnQoMTAsIDM0KSlcbiAgICAgICAgfSxcbiAgICAgICAgYWN0aXZlOiB7XG4gICAgICAgICAgICBwaW5JbWFnZSA6IG5ldyBnb29nbGUubWFwcy5NYXJrZXJJbWFnZShcImh0dHA6Ly9jaGFydC5hcGlzLmdvb2dsZS5jb20vY2hhcnQ/Y2hzdD1kX21hcF9waW5fbGV0dGVyJmNobGQ9JUUyJTgwJUEyfFwiICtcbiAgICAgICAgICAgICdBQUREREQnLFxuICAgICAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlNpemUoMjEsIDM0KSxcbiAgICAgICAgICAgIG5ldyBnb29nbGUubWFwcy5Qb2ludCgwLDApLFxuICAgICAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlBvaW50KDEwLCAzNCkpXG5cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgbmVpZ2hib3Job29kTWFwID0gZnVuY3Rpb24oKXtcbiAgICAgICAgdGhpcy5tYXBEaXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwJyk7XG4gICAgICAgIHRoaXMuY2VudGVyTWFwID0ge2xhdDogNDMuMjYzMjI0LCBsbmc6IC0yLjkzNTAwM307XG4gICAgICAgIHRoaXMuem9vbSA9IDE1O1xuICAgICAgICB0aGlzLm1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAodGhpcy5tYXBEaXYsIHtcbiAgICAgICAgICAgIHpvb206IHRoaXMuem9vbSxcbiAgICAgICAgICAgIGNlbnRlcjogdGhpcy5jZW50ZXJNYXBcbiAgICAgICAgfSk7XG4gICAgfTtcblxuXG4gICAgdmFyIExvY2F0aW9uID0gZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgIHRoaXMubmFtZSA9IGRhdGEubmFtZTtcbiAgICAgICAgdGhpcy5sYXQgPSBwYXJzZUZsb2F0KGRhdGEubG9jYXRpb24uY29vcmRpbmF0ZS5sYXRpdHVkZSk7XG4gICAgICAgIHRoaXMubG5nID0gcGFyc2VGbG9hdChkYXRhLmxvY2F0aW9uLmNvb3JkaW5hdGUubG9uZ2l0dWRlKTtcbiAgICAgICAgdGhpcy5kaXNwbGF5ID0ga28ub2JzZXJ2YWJsZSh0cnVlKTtcbiAgICAgICAgdGhpcy5tYXJrZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmFjdGl2ZSA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xuICAgIH07XG5cbiAgICB2YXIgbXlWaWV3TW9kZWwgPSBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNlbGYubG9jYXRpb25zTGlzdCA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XG4gICAgICAgIHNlbGYubXlNYXAgPSBuZXcgbmVpZ2hib3Job29kTWFwKCk7XG4gICAgICAgIHNlbGYuY3VycmVudEZpbHRlciA9IGtvLm9ic2VydmFibGUoJycpO1xuXG4gICAgICAgIHZhciBpbmZvV2luZG93ID0gbmV3IGdvb2dsZS5tYXBzLkluZm9XaW5kb3coe1xuICAgICAgICAgICAgY29udGVudDogXCI8aDM+Sm9zZXA8L2gzPlwiXG4gICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBUTyBETzogSU5URUdSQVRFIFdJVEggWUVMUCBBUElcbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYSByYW5kb20gbnVtYmVyIGFuZCByZXR1cm5zIGl0IGFzIGEgc3RyaW5nIGZvciBPQXV0aGVudGljYXRpb25cbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAgICovXG4gICAgZnVuY3Rpb24gbm9uY2VfZ2VuZXJhdGUoKSB7XG4gICAgICAgIHJldHVybiAoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMWUxMikudG9TdHJpbmcoKSk7XG4gICAgfVxuXG4gICAgdmFyIFlFTFBfQkFTRV9VUkwgPSAnaHR0cHM6Ly9hcGkueWVscC5jb20vdjIvc2VhcmNoPyc7XG5cblxuICAgIHZhciB5ZWxwX3VybCA9IFlFTFBfQkFTRV9VUkw7XG5cbiAgICB2YXIgcGFyYW1ldGVycyA9IHtcbiAgICAgICAgb2F1dGhfY29uc3VtZXJfa2V5OiAnUzgtOFRpYVBTY21Wd1N0dVIxR0FfUScsXG4gICAgICAgIG9hdXRoX3Rva2VuOiAnVW9BN20xODUxeWFPc0Z6c2JCZ1FPbGlNREdTZXJfR3MnLFxuICAgICAgICBvYXV0aF9ub25jZTogbm9uY2VfZ2VuZXJhdGUoKSxcbiAgICAgICAgb2F1dGhfdGltZXN0YW1wOiBNYXRoLmZsb29yKERhdGUubm93KCkvMTAwMCksXG4gICAgICAgIG9hdXRoX3NpZ25hdHVyZV9tZXRob2Q6ICdITUFDLVNIQTEnLFxuICAgICAgICBvYXV0aF92ZXJzaW9uIDogJzEuMCcsXG4gICAgICAgIGNhbGxiYWNrOiAnY2InLCAvLyBUaGlzIGlzIGNydWNpYWwgdG8gaW5jbHVkZSBmb3IganNvbnAgaW1wbGVtZW50YXRpb24gaW4gQUpBWCBvciBlbHNlIHRoZSBvYXV0aC1zaWduYXR1cmUgd2lsbCBiZSB3cm9uZy5cbiAgICAgICAgbG9jYXRpb246ICdCaWxiYW8rU3BhaW4nLFxuICAgICAgICB0ZXJtOiAncmVzdGF1cmFudCcsXG4gICAgICAgIGxpbWl0OiAyMCxcbiAgICAgICAgc29ydDogMixcbiAgICAgICAgY2xsOiAnNDMuMjYzMjI0LEMtMi45MzUwMDMnXG4gICAgfTtcblxuICAgIHZhciBlbmNvZGVkU2lnbmF0dXJlID0gb2F1dGhTaWduYXR1cmUuZ2VuZXJhdGUoJ0dFVCcseWVscF91cmwsIHBhcmFtZXRlcnMsICdQVWFkY1REcF85YzFEaFJEN3BrZnBFN1JETWsnLCAnb3RQR3paRC1CeG93Tm03WXlsVnpHVkIxQ2lRJyk7XG4gICAgcGFyYW1ldGVycy5vYXV0aF9zaWduYXR1cmUgPSBlbmNvZGVkU2lnbmF0dXJlO1xuXG4gICAgdmFyIHNldHRpbmdzID0ge1xuICAgICAgICB1cmw6IHllbHBfdXJsLFxuICAgICAgICBkYXRhOiBwYXJhbWV0ZXJzLFxuICAgICAgICBjYWNoZTogdHJ1ZSwgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBjcnVjaWFsIHRvIGluY2x1ZGUgYXMgd2VsbCB0byBwcmV2ZW50IGpRdWVyeSBmcm9tIGFkZGluZyBvbiBhIGNhY2hlLWJ1c3RlciBwYXJhbWV0ZXIgXCJfPTIzNDg5NDg5NzQ5ODM3XCIsIGludmFsaWRhdGluZyBvdXIgb2F1dGgtc2lnbmF0dXJlXG4gICAgICAgIGRhdGFUeXBlOiAnanNvbnAnLFxuICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXN1bHRzKSB7XG4gICAgICAgICAgeWVscF9sb2NhdGlvbnMgPSByZXN1bHRzLmJ1c2luZXNzZXM7XG4gICAgICAgICAgc2VsZi5pbml0KCk7XG4gICAgICAgIH0sXG4gICAgICAgIGZhaWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdmYWlsZWQhIScpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIFNlbmQgQUpBWCBxdWVyeSB2aWEgalF1ZXJ5IGxpYnJhcnkuXG4gICAgJC5hamF4KHNldHRpbmdzKTtcblxuICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcblxuXG4gICAgICAgIC8vIC0tLS0tLS0tLS0gVE8gRE86IElNUExFTUVOVCBHT09HTEUgTUFQUyBQTEFDRVNcbiAgICAgICAgc2VsZi5zZXJ2aWNlID0gbmV3IGdvb2dsZS5tYXBzLnBsYWNlcy5QbGFjZXNTZXJ2aWNlKHNlbGYubXlNYXAubWFwKTtcbiAgICAgICAgc2VsZi5wcm9jZXNzUmVzdWx0cyA9IGZ1bmN0aW9uKHJlc3VsdHMsc3RhdHVzKXtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHJlc3VsdHMpO1xuICAgICAgICB9O1xuICAgICAgICBzZWxmLnNlcnZpY2UubmVhcmJ5U2VhcmNoKHtcbiAgICAgICAgICAgIGxvY2F0aW9uOiBzZWxmLm15TWFwLmNlbnRlck1hcCxcbiAgICAgICAgICAgIHJhZGl1czogMjAwMCxcbiAgICAgICAgICAgIHR5cGU6IFsnY2FmZSddXG4gICAgICAgIH0sIHNlbGYucHJvY2Vzc1Jlc3VsdHMpO1xuXG5cbiAgICAgICAgLy8gLS0tLS0tLS0tLSBUTyBETzogSU1QTEVNRU5UIEdPT0dMRSBNQVBTIFBMQUNFU1xuXG4gICAgICAgIHZhciBzdWJzY3JpcHRpb24gPSBzZWxmLmN1cnJlbnRGaWx0ZXIuc3Vic2NyaWJlKGZ1bmN0aW9uKG5ld1ZhbHVlKXtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpPHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgbG9jYXRpb25OYW1lID0gc2VsZi5sb2NhdGlvbnNMaXN0KClbaV0ubmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIHRhcmdldFN0cmluZyA9IG5ld1ZhbHVlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgaWYgKGxvY2F0aW9uTmFtZS5pbmRleE9mKHRhcmdldFN0cmluZykgPT09IC0xKXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5sb2NhdGlvbnNMaXN0KClbaV0uZGlzcGxheShmYWxzZSk7XG4gICAgICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubG9jYXRpb25zTGlzdCgpW2ldLmRpc3BsYXkodHJ1ZSk7ICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGYucmVkcmF3TWFya2VycygpO1xuICAgICAgICB9KTtcblxuICAgICAgICBzZWxmLmluaXQgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgeWVscF9sb2NhdGlvbnMuZm9yRWFjaChmdW5jdGlvbihsb2NhdGlvbkl0ZW0pe1xuICAgICAgICAgICAgICAgIHNlbGYubG9jYXRpb25zTGlzdC5wdXNoKG5ldyBMb2NhdGlvbihsb2NhdGlvbkl0ZW0pKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc2VsZi5kcmF3TWFya2VycygpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHNlbGYuZHJhd01hcmtlcnMgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgZm9yKHZhciBpID0gMDsgaTwgc2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50SXRlbSA9IHNlbGYubG9jYXRpb25zTGlzdCgpW2ldO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50SXRlbS5kaXNwbGF5KCkgPT09IHRydWUpe1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmFkZE1hcmtlcldpdGhBbmltYXRpb24oY3VycmVudEl0ZW0sIGkqMTAwKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYoY3VycmVudEl0ZW0ubWFya2VyICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlci5zZXRNYXAobnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHNlbGYucmVkcmF3TWFya2VycyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpPCBzZWxmLmxvY2F0aW9uc0xpc3QoKS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRJdGVtID0gc2VsZi5sb2NhdGlvbnNMaXN0KClbaV07XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRJdGVtLmRpc3BsYXkoKSA9PT0gdHJ1ZSl7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlci5zZXRNYXAoc2VsZi5teU1hcC5tYXApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZihjdXJyZW50SXRlbS5tYXJrZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEl0ZW0ubWFya2VyLnNldE1hcChudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgc2VsZi5jbGVhck1hcmtlcnMgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgZm9yKHZhciBpID0gMDsgaTwgc2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50SXRlbSA9IHNlbGYubG9jYXRpb25zTGlzdCgpW2ldO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlci5zZXRNYXAobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgc2VsZi5hZGRNYXJrZXJXaXRoQW5pbWF0aW9uID0gZnVuY3Rpb24oY3VycmVudEl0ZW0sIHRpbWVvdXQpe1xuICAgICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKHtcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHtsYXQ6IGN1cnJlbnRJdGVtLmxhdCwgbG5nOiBjdXJyZW50SXRlbS5sbmd9LFxuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb246IGdvb2dsZS5tYXBzLkFuaW1hdGlvbi5EUk9QLFxuICAgICAgICAgICAgICAgICAgICBpY29uOiBwaW5zLmRlZmF1bHQucGluSW1hZ2UsXG4gICAgICAgICAgICAgICAgICAgIG1hcDogc2VsZi5teU1hcC5tYXBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIuYWRkTGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5pbmFjdGl2ZUFsbCgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudE1hcmtlciA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLmFjdGl2ZSh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5hY3RpdmVDb2xvcihjdXJyZW50TWFya2VyKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5Cb3VuY2UoY3VycmVudE1hcmtlcik7XG4gICAgICAgICAgICAgICAgICAgIGluZm9XaW5kb3cub3BlbihzZWxmLm15TWFwLCBjdXJyZW50TWFya2VyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sIHRpbWVvdXQpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHNlbGYuYWN0aXZhdGVNYXJrZXIgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIG1hcmtlciA9IHRoaXMubWFya2VyO1xuICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gdGhpcztcbiAgICAgICAgICAgIHNlbGYuaW5hY3RpdmVBbGwoKTtcbiAgICAgICAgICAgIGxvY2F0aW9uLmFjdGl2ZSh0cnVlKTtcbiAgICAgICAgICAgIHNlbGYuYWN0aXZlQ29sb3IobWFya2VyKTtcbiAgICAgICAgICAgIHNlbGYuQm91bmNlKG1hcmtlcik7XG4gICAgICAgICAgICBpbmZvV2luZG93Lm9wZW4oc2VsZi5teU1hcCwgbWFya2VyKTtcbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLmZpbmRDbGlja2VkTWFya2VyID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5Cb3VuY2UgPSBmdW5jdGlvbihjdXJyZW50TWFya2VyKXtcbiAgICAgICAgICAgIC8vIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIGlmIChjdXJyZW50TWFya2VyLmdldEFuaW1hdGlvbigpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudE1hcmtlci5zZXRBbmltYXRpb24obnVsbCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRNYXJrZXIuc2V0QW5pbWF0aW9uKGdvb2dsZS5tYXBzLkFuaW1hdGlvbi5CT1VOQ0UpO1xuICAgICAgICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRNYXJrZXIuc2V0QW5pbWF0aW9uKG51bGwpO1xuICAgICAgICAgICAgICAgIH0sNzAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLmFjdGl2ZUNvbG9yID0gZnVuY3Rpb24oY3VycmVudE1hcmtlcil7XG4gICAgICAgICAgICBjdXJyZW50TWFya2VyLnNldEljb24ocGlucy5hY3RpdmUucGluSW1hZ2UpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHNlbGYuZGVmYXVsdENvbG9yID0gZnVuY3Rpb24oY3VycmVudE1hcmtlcil7XG4gICAgICAgICAgICBjdXJyZW50TWFya2VyLnNldEljb24ocGlucy5kZWZhdWx0LnBpbkltYWdlKTtcbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLmluYWN0aXZlQWxsID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGk8IHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5hY3RpdmUoZmFsc2UpO1xuICAgICAgICAgICAgICAgIHNlbGYuZGVmYXVsdENvbG9yKGN1cnJlbnRJdGVtLm1hcmtlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgc2VsZi5kZWZhdWx0Q29sb3JBbGwgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgZm9yKHZhciBpID0gMDsgaTwgc2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50SXRlbSA9IHNlbGYubG9jYXRpb25zTGlzdCgpW2ldO1xuICAgICAgICAgICAgICAgIHNlbGYuZGVmYXVsdENvbG9yKGN1cnJlbnRJdGVtLm1hcmtlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfTtcblxuXG4gICAga28uYXBwbHlCaW5kaW5ncyhuZXcgbXlWaWV3TW9kZWwpO1xufTtcblxuZnVuY3Rpb24gZ29vZ2xlU3VjY2Vzcygpe1xuICAgIGluaXRpYXRlVmlldygpO1xufTtcblxuZnVuY3Rpb24gZ29vZ2xlRXJyb3IoKXtcbiAgICAkKCdib2R5JykuaHRtbCgnJyk7XG4gICAgJCgnYm9keScpLmFwcGVuZChcIjxoMT5UaGVyZSB3YXMgYW4gZXJyb3IgbG9hZGluZyBHb29nbGUgTWFwcy4gUGxlYXNlIHRyeSBhZ2FpbiBpbiAxMCBob3Vycy48L2gxPlwiKTtcbn07XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
