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
                    self.activateMarker.call(currentItem);
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
            infoWindow.setContent(location.name);
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


        
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFsbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIGluaXRpYXRlVmlldygpe1xuICAgIHZhciB5ZWxwX2xvY2F0aW9ucztcbiAgICB2YXIgcGlucyA9IHtcbiAgICAgICAgZGVmYXVsdDoge1xuICAgICAgICAgICAgcGluSW1hZ2UgOiBuZXcgZ29vZ2xlLm1hcHMuTWFya2VySW1hZ2UoXCJodHRwOi8vY2hhcnQuYXBpcy5nb29nbGUuY29tL2NoYXJ0P2Noc3Q9ZF9tYXBfcGluX2xldHRlciZjaGxkPSVFMiU4MCVBMnxcIiArXG4gICAgICAgICAgICAnREQ4ODg4JyxcbiAgICAgICAgICAgIG5ldyBnb29nbGUubWFwcy5TaXplKDIxLCAzNCksXG4gICAgICAgICAgICBuZXcgZ29vZ2xlLm1hcHMuUG9pbnQoMCwwKSxcbiAgICAgICAgICAgIG5ldyBnb29nbGUubWFwcy5Qb2ludCgxMCwgMzQpKVxuICAgICAgICB9LFxuICAgICAgICBhY3RpdmU6IHtcbiAgICAgICAgICAgIHBpbkltYWdlIDogbmV3IGdvb2dsZS5tYXBzLk1hcmtlckltYWdlKFwiaHR0cDovL2NoYXJ0LmFwaXMuZ29vZ2xlLmNvbS9jaGFydD9jaHN0PWRfbWFwX3Bpbl9sZXR0ZXImY2hsZD0lRTIlODAlQTJ8XCIgK1xuICAgICAgICAgICAgJ0FBRERERCcsXG4gICAgICAgICAgICBuZXcgZ29vZ2xlLm1hcHMuU2l6ZSgyMSwgMzQpLFxuICAgICAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlBvaW50KDAsMCksXG4gICAgICAgICAgICBuZXcgZ29vZ2xlLm1hcHMuUG9pbnQoMTAsIDM0KSlcblxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBuZWlnaGJvcmhvb2RNYXAgPSBmdW5jdGlvbigpe1xuICAgICAgICB0aGlzLm1hcERpdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXAnKTtcbiAgICAgICAgdGhpcy5jZW50ZXJNYXAgPSB7bGF0OiA0My4yNjMyMjQsIGxuZzogLTIuOTM1MDAzfTtcbiAgICAgICAgdGhpcy56b29tID0gMTU7XG4gICAgICAgIHRoaXMubWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcCh0aGlzLm1hcERpdiwge1xuICAgICAgICAgICAgem9vbTogdGhpcy56b29tLFxuICAgICAgICAgICAgY2VudGVyOiB0aGlzLmNlbnRlck1hcFxuICAgICAgICB9KTtcbiAgICB9O1xuXG5cbiAgICB2YXIgTG9jYXRpb24gPSBmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgdGhpcy5uYW1lID0gZGF0YS5uYW1lO1xuICAgICAgICB0aGlzLmxhdCA9IHBhcnNlRmxvYXQoZGF0YS5sb2NhdGlvbi5jb29yZGluYXRlLmxhdGl0dWRlKTtcbiAgICAgICAgdGhpcy5sbmcgPSBwYXJzZUZsb2F0KGRhdGEubG9jYXRpb24uY29vcmRpbmF0ZS5sb25naXR1ZGUpO1xuICAgICAgICB0aGlzLmRpc3BsYXkgPSBrby5vYnNlcnZhYmxlKHRydWUpO1xuICAgICAgICB0aGlzLm1hcmtlciA9IG51bGw7XG4gICAgICAgIHRoaXMuYWN0aXZlID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG4gICAgfTtcblxuICAgIHZhciBteVZpZXdNb2RlbCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi5sb2NhdGlvbnNMaXN0ID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcbiAgICAgICAgc2VsZi5teU1hcCA9IG5ldyBuZWlnaGJvcmhvb2RNYXAoKTtcbiAgICAgICAgc2VsZi5jdXJyZW50RmlsdGVyID0ga28ub2JzZXJ2YWJsZSgnJyk7XG5cbiAgICAgICAgdmFyIGluZm9XaW5kb3cgPSBuZXcgZ29vZ2xlLm1hcHMuSW5mb1dpbmRvdyh7XG4gICAgICAgICAgICBjb250ZW50OiBcIjxoMz5Kb3NlcDwvaDM+XCJcbiAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIFRPIERPOiBJTlRFR1JBVEUgV0lUSCBZRUxQIEFQSVxuICAgICAgICAvKipcbiAgICAgICAgICogR2VuZXJhdGVzIGEgcmFuZG9tIG51bWJlciBhbmQgcmV0dXJucyBpdCBhcyBhIHN0cmluZyBmb3IgT0F1dGhlbnRpY2F0aW9uXG4gICAgICAgICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIG5vbmNlX2dlbmVyYXRlKCkge1xuICAgICAgICAgICAgcmV0dXJuIChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxZTEyKS50b1N0cmluZygpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBZRUxQX0JBU0VfVVJMID0gJ2h0dHBzOi8vYXBpLnllbHAuY29tL3YyL3NlYXJjaD8nO1xuXG5cbiAgICAgICAgdmFyIHllbHBfdXJsID0gWUVMUF9CQVNFX1VSTDtcblxuICAgICAgICB2YXIgcGFyYW1ldGVycyA9IHtcbiAgICAgICAgICAgIG9hdXRoX2NvbnN1bWVyX2tleTogJ1M4LThUaWFQU2NtVndTdHVSMUdBX1EnLFxuICAgICAgICAgICAgb2F1dGhfdG9rZW46ICdVb0E3bTE4NTF5YU9zRnpzYkJnUU9saU1ER1Nlcl9HcycsXG4gICAgICAgICAgICBvYXV0aF9ub25jZTogbm9uY2VfZ2VuZXJhdGUoKSxcbiAgICAgICAgICAgIG9hdXRoX3RpbWVzdGFtcDogTWF0aC5mbG9vcihEYXRlLm5vdygpLzEwMDApLFxuICAgICAgICAgICAgb2F1dGhfc2lnbmF0dXJlX21ldGhvZDogJ0hNQUMtU0hBMScsXG4gICAgICAgICAgICBvYXV0aF92ZXJzaW9uIDogJzEuMCcsXG4gICAgICAgICAgICBjYWxsYmFjazogJ2NiJywgLy8gVGhpcyBpcyBjcnVjaWFsIHRvIGluY2x1ZGUgZm9yIGpzb25wIGltcGxlbWVudGF0aW9uIGluIEFKQVggb3IgZWxzZSB0aGUgb2F1dGgtc2lnbmF0dXJlIHdpbGwgYmUgd3JvbmcuXG4gICAgICAgICAgICBsb2NhdGlvbjogJ0JpbGJhbytTcGFpbicsXG4gICAgICAgICAgICB0ZXJtOiAncmVzdGF1cmFudCcsXG4gICAgICAgICAgICBsaW1pdDogMjAsXG4gICAgICAgICAgICBzb3J0OiAyLFxuICAgICAgICAgICAgY2xsOiAnNDMuMjYzMjI0LEMtMi45MzUwMDMnXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGVuY29kZWRTaWduYXR1cmUgPSBvYXV0aFNpZ25hdHVyZS5nZW5lcmF0ZSgnR0VUJyx5ZWxwX3VybCwgcGFyYW1ldGVycywgJ1BVYWRjVERwXzljMURoUkQ3cGtmcEU3UkRNaycsICdvdFBHelpELUJ4b3dObTdZeWxWekdWQjFDaVEnKTtcbiAgICAgICAgcGFyYW1ldGVycy5vYXV0aF9zaWduYXR1cmUgPSBlbmNvZGVkU2lnbmF0dXJlO1xuXG4gICAgICAgIHZhciBzZXR0aW5ncyA9IHtcbiAgICAgICAgICAgIHVybDogeWVscF91cmwsXG4gICAgICAgICAgICBkYXRhOiBwYXJhbWV0ZXJzLFxuICAgICAgICAgICAgY2FjaGU6IHRydWUsICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgY3J1Y2lhbCB0byBpbmNsdWRlIGFzIHdlbGwgdG8gcHJldmVudCBqUXVlcnkgZnJvbSBhZGRpbmcgb24gYSBjYWNoZS1idXN0ZXIgcGFyYW1ldGVyIFwiXz0yMzQ4OTQ4OTc0OTgzN1wiLCBpbnZhbGlkYXRpbmcgb3VyIG9hdXRoLXNpZ25hdHVyZVxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29ucCcsXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXN1bHRzKSB7XG4gICAgICAgICAgICAgIHllbHBfbG9jYXRpb25zID0gcmVzdWx0cy5idXNpbmVzc2VzO1xuICAgICAgICAgICAgICBzZWxmLmluaXQoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmYWlsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZhaWxlZCEhJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gU2VuZCBBSkFYIHF1ZXJ5IHZpYSBqUXVlcnkgbGlicmFyeS5cbiAgICAgICAgJC5hamF4KHNldHRpbmdzKTtcblxuICAgICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cblxuICAgICAgICAvLyAtLS0tLS0tLS0tIFRPIERPOiBJTVBMRU1FTlQgR09PR0xFIE1BUFMgUExBQ0VTXG4gICAgICAgIHNlbGYuc2VydmljZSA9IG5ldyBnb29nbGUubWFwcy5wbGFjZXMuUGxhY2VzU2VydmljZShzZWxmLm15TWFwLm1hcCk7XG4gICAgICAgIHNlbGYucHJvY2Vzc1Jlc3VsdHMgPSBmdW5jdGlvbihyZXN1bHRzLHN0YXR1cyl7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhyZXN1bHRzKTtcbiAgICAgICAgfTtcbiAgICAgICAgc2VsZi5zZXJ2aWNlLm5lYXJieVNlYXJjaCh7XG4gICAgICAgICAgICBsb2NhdGlvbjogc2VsZi5teU1hcC5jZW50ZXJNYXAsXG4gICAgICAgICAgICByYWRpdXM6IDIwMDAsXG4gICAgICAgICAgICB0eXBlOiBbJ2NhZmUnXVxuICAgICAgICB9LCBzZWxmLnByb2Nlc3NSZXN1bHRzKTtcblxuXG4gICAgICAgIC8vIC0tLS0tLS0tLS0gVE8gRE86IElNUExFTUVOVCBHT09HTEUgTUFQUyBQTEFDRVNcblxuICAgICAgICB2YXIgc3Vic2NyaXB0aW9uID0gc2VsZi5jdXJyZW50RmlsdGVyLnN1YnNjcmliZShmdW5jdGlvbihuZXdWYWx1ZSl7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaTxzZWxmLmxvY2F0aW9uc0xpc3QoKS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uTmFtZSA9IHNlbGYubG9jYXRpb25zTGlzdCgpW2ldLm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICB0YXJnZXRTdHJpbmcgPSBuZXdWYWx1ZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIGlmIChsb2NhdGlvbk5hbWUuaW5kZXhPZih0YXJnZXRTdHJpbmcpID09PSAtMSl7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubG9jYXRpb25zTGlzdCgpW2ldLmRpc3BsYXkoZmFsc2UpO1xuICAgICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXS5kaXNwbGF5KHRydWUpOyAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWxmLnJlZHJhd01hcmtlcnMoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2VsZi5pbml0ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHllbHBfbG9jYXRpb25zLmZvckVhY2goZnVuY3Rpb24obG9jYXRpb25JdGVtKXtcbiAgICAgICAgICAgICAgICBzZWxmLmxvY2F0aW9uc0xpc3QucHVzaChuZXcgTG9jYXRpb24obG9jYXRpb25JdGVtKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHNlbGYuZHJhd01hcmtlcnMoKTtcbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLmRyYXdNYXJrZXJzID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGk8IHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudEl0ZW0uZGlzcGxheSgpID09PSB0cnVlKXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5hZGRNYXJrZXJXaXRoQW5pbWF0aW9uKGN1cnJlbnRJdGVtLCBpKjEwMCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmKGN1cnJlbnRJdGVtLm1hcmtlciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIuc2V0TWFwKG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLnJlZHJhd01hcmtlcnMgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgZm9yKHZhciBpID0gMDsgaTwgc2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50SXRlbSA9IHNlbGYubG9jYXRpb25zTGlzdCgpW2ldO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50SXRlbS5kaXNwbGF5KCkgPT09IHRydWUpe1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIuc2V0TWFwKHNlbGYubXlNYXAubWFwKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYoY3VycmVudEl0ZW0ubWFya2VyICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlci5zZXRNYXAobnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHNlbGYuY2xlYXJNYXJrZXJzID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGk8IHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIuc2V0TWFwKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHNlbGYuYWRkTWFya2VyV2l0aEFuaW1hdGlvbiA9IGZ1bmN0aW9uKGN1cnJlbnRJdGVtLCB0aW1lb3V0KXtcbiAgICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgY3VycmVudEl0ZW0ubWFya2VyID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcih7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7bGF0OiBjdXJyZW50SXRlbS5sYXQsIGxuZzogY3VycmVudEl0ZW0ubG5nfSxcbiAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uOiBnb29nbGUubWFwcy5BbmltYXRpb24uRFJPUCxcbiAgICAgICAgICAgICAgICAgICAgaWNvbjogcGlucy5kZWZhdWx0LnBpbkltYWdlLFxuICAgICAgICAgICAgICAgICAgICBtYXA6IHNlbGYubXlNYXAubWFwXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY3VycmVudEl0ZW0ubWFya2VyLmFkZExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuYWN0aXZhdGVNYXJrZXIuY2FsbChjdXJyZW50SXRlbSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICAgICAgfTtcbiAgICAgICAgc2VsZi5hY3RpdmF0ZU1hcmtlciA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgbWFya2VyID0gdGhpcy5tYXJrZXI7XG4gICAgICAgICAgICB2YXIgbG9jYXRpb24gPSB0aGlzO1xuICAgICAgICAgICAgc2VsZi5pbmFjdGl2ZUFsbCgpO1xuICAgICAgICAgICAgbG9jYXRpb24uYWN0aXZlKHRydWUpO1xuICAgICAgICAgICAgc2VsZi5hY3RpdmVDb2xvcihtYXJrZXIpO1xuICAgICAgICAgICAgc2VsZi5Cb3VuY2UobWFya2VyKTtcbiAgICAgICAgICAgIGluZm9XaW5kb3cuc2V0Q29udGVudChsb2NhdGlvbi5uYW1lKTtcbiAgICAgICAgICAgIGluZm9XaW5kb3cub3BlbihzZWxmLm15TWFwLCBtYXJrZXIpO1xuICAgICAgICB9O1xuXG5cbiAgICAgICAgc2VsZi5maW5kQ2xpY2tlZE1hcmtlciA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuQm91bmNlID0gZnVuY3Rpb24oY3VycmVudE1hcmtlcil7XG4gICAgICAgICAgICAvLyB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICBpZiAoY3VycmVudE1hcmtlci5nZXRBbmltYXRpb24oKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRNYXJrZXIuc2V0QW5pbWF0aW9uKG51bGwpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50TWFya2VyLnNldEFuaW1hdGlvbihnb29nbGUubWFwcy5BbmltYXRpb24uQk9VTkNFKTtcbiAgICAgICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50TWFya2VyLnNldEFuaW1hdGlvbihudWxsKTtcbiAgICAgICAgICAgICAgICB9LDcwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgc2VsZi5hY3RpdmVDb2xvciA9IGZ1bmN0aW9uKGN1cnJlbnRNYXJrZXIpe1xuICAgICAgICAgICAgY3VycmVudE1hcmtlci5zZXRJY29uKHBpbnMuYWN0aXZlLnBpbkltYWdlKTtcbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLmRlZmF1bHRDb2xvciA9IGZ1bmN0aW9uKGN1cnJlbnRNYXJrZXIpe1xuICAgICAgICAgICAgY3VycmVudE1hcmtlci5zZXRJY29uKHBpbnMuZGVmYXVsdC5waW5JbWFnZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgc2VsZi5pbmFjdGl2ZUFsbCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpPCBzZWxmLmxvY2F0aW9uc0xpc3QoKS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRJdGVtID0gc2VsZi5sb2NhdGlvbnNMaXN0KClbaV07XG4gICAgICAgICAgICAgICAgY3VycmVudEl0ZW0uYWN0aXZlKGZhbHNlKTtcbiAgICAgICAgICAgICAgICBzZWxmLmRlZmF1bHRDb2xvcihjdXJyZW50SXRlbS5tYXJrZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHNlbGYuZGVmYXVsdENvbG9yQWxsID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGk8IHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgICAgICBzZWxmLmRlZmF1bHRDb2xvcihjdXJyZW50SXRlbS5tYXJrZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH07XG5cblxuICAgIGtvLmFwcGx5QmluZGluZ3MobmV3IG15Vmlld01vZGVsKTtcbn07XG5cbmZ1bmN0aW9uIGdvb2dsZVN1Y2Nlc3MoKXtcbiAgICBpbml0aWF0ZVZpZXcoKTtcbn07XG5cbmZ1bmN0aW9uIGdvb2dsZUVycm9yKCl7XG4gICAgJCgnYm9keScpLmh0bWwoJycpO1xuICAgICQoJ2JvZHknKS5hcHBlbmQoXCI8aDE+VGhlcmUgd2FzIGFuIGVycm9yIGxvYWRpbmcgR29vZ2xlIE1hcHMuIFBsZWFzZSB0cnkgYWdhaW4gaW4gMTAgaG91cnMuPC9oMT5cIik7XG59O1xuXG5cbiAgICAgICAgIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
