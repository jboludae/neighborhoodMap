function initiateView(){
    var locations = [
        {
            'name': 'El Globo',
            'location': {
                'lat': '43.2618436926003',
                'lng': '-2.93262138916316'
            },
            'display': 'true'
        },
        {
            'name': 'Etxanobe',
            'location': {
                'lat': '43.2685509',
                'lng': '-2.9353487'
            },
            'display': 'true'
        },
        {
            'name': 'Cafe Iruña',
            'location': {
                'lat': '43.2623711',
                'lng': '-2.92803'
            },
            'display': 'true'
        },
        {
            'name': 'Gure Toki',
            'location': {
                'lat': '43.2593858869925',
                'lng': '-2.92238477945807'
            },
            'display': 'true'
        },
        {
            'name': 'Sumo Bilbao',
            'location': {
                'lat': '43.262041',
                'lng': '-2.927903'
            },
            'display': 'true'
        }
    ];

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
        term: 'cafe iruna',
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
          console.log(results);
        },
        fail: function() {
          console.log('failed!!');
        }
    };

    // Send AJAX query via jQuery library.
    $.ajax(settings);

    // *******************************


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
        this.name = data['name'];
        this.lat = parseFloat(data['location']['lat']);
        this.lng = parseFloat(data['location']['lng']);
        this.display = ko.observable(data['display'] === 'true');
        this.marker = null;
        this.active = ko.observable(false);
    };

    var myViewModel = function(){
        var self = this;
        self.locationsList = ko.observableArray([]);
        self.myMap = new neighborhoodMap();
        self.currentFilter = ko.observable('');

        var infoWindow = new google.maps.InfoWindow({
            content: "Josep"
        });


        // ---------- TO DO: IMPLEMENT GOOGLE MAPS PLACES
        self.service = new google.maps.places.PlacesService(self.myMap.map);
        self.processResults = function(results,status){
            console.log(results);
        };
        self.service.nearbySearch({
            location: self.myMap.centerMap,
            radius: 1000,
            type: ['restaurant','bar']
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
            locations.forEach(function(locationItem){
                self.locationsList.push(new Location(locationItem));
            });
            self.drawMarkers();
        };

        self.drawMarkers = function(){
            for(var i = 0; i< self.locationsList().length; i++){
                var currentItem = self.locationsList()[i];
                if (currentItem.display() === true){
                    self.addMarkerWithAnimation(currentItem, i*200);
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


        self.init();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFsbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIGluaXRpYXRlVmlldygpe1xuICAgIHZhciBsb2NhdGlvbnMgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICAgICduYW1lJzogJ0VsIEdsb2JvJyxcbiAgICAgICAgICAgICdsb2NhdGlvbic6IHtcbiAgICAgICAgICAgICAgICAnbGF0JzogJzQzLjI2MTg0MzY5MjYwMDMnLFxuICAgICAgICAgICAgICAgICdsbmcnOiAnLTIuOTMyNjIxMzg5MTYzMTYnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ2Rpc3BsYXknOiAndHJ1ZSdcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgJ25hbWUnOiAnRXR4YW5vYmUnLFxuICAgICAgICAgICAgJ2xvY2F0aW9uJzoge1xuICAgICAgICAgICAgICAgICdsYXQnOiAnNDMuMjY4NTUwOScsXG4gICAgICAgICAgICAgICAgJ2xuZyc6ICctMi45MzUzNDg3J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdkaXNwbGF5JzogJ3RydWUnXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgICduYW1lJzogJ0NhZmUgSXJ1w7FhJyxcbiAgICAgICAgICAgICdsb2NhdGlvbic6IHtcbiAgICAgICAgICAgICAgICAnbGF0JzogJzQzLjI2MjM3MTEnLFxuICAgICAgICAgICAgICAgICdsbmcnOiAnLTIuOTI4MDMnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ2Rpc3BsYXknOiAndHJ1ZSdcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgJ25hbWUnOiAnR3VyZSBUb2tpJyxcbiAgICAgICAgICAgICdsb2NhdGlvbic6IHtcbiAgICAgICAgICAgICAgICAnbGF0JzogJzQzLjI1OTM4NTg4Njk5MjUnLFxuICAgICAgICAgICAgICAgICdsbmcnOiAnLTIuOTIyMzg0Nzc5NDU4MDcnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ2Rpc3BsYXknOiAndHJ1ZSdcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgJ25hbWUnOiAnU3VtbyBCaWxiYW8nLFxuICAgICAgICAgICAgJ2xvY2F0aW9uJzoge1xuICAgICAgICAgICAgICAgICdsYXQnOiAnNDMuMjYyMDQxJyxcbiAgICAgICAgICAgICAgICAnbG5nJzogJy0yLjkyNzkwMydcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnZGlzcGxheSc6ICd0cnVlJ1xuICAgICAgICB9XG4gICAgXTtcblxuICAgIC8vIFRPIERPOiBJTlRFR1JBVEUgV0lUSCBZRUxQIEFQSVxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBhIHJhbmRvbSBudW1iZXIgYW5kIHJldHVybnMgaXQgYXMgYSBzdHJpbmcgZm9yIE9BdXRoZW50aWNhdGlvblxuICAgICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBub25jZV9nZW5lcmF0ZSgpIHtcbiAgICAgICAgcmV0dXJuIChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxZTEyKS50b1N0cmluZygpKTtcbiAgICB9XG5cbiAgICB2YXIgWUVMUF9CQVNFX1VSTCA9ICdodHRwczovL2FwaS55ZWxwLmNvbS92Mi9zZWFyY2g/JztcblxuXG4gICAgdmFyIHllbHBfdXJsID0gWUVMUF9CQVNFX1VSTDtcblxuICAgIHZhciBwYXJhbWV0ZXJzID0ge1xuICAgICAgICBvYXV0aF9jb25zdW1lcl9rZXk6ICdTOC04VGlhUFNjbVZ3U3R1UjFHQV9RJyxcbiAgICAgICAgb2F1dGhfdG9rZW46ICdVb0E3bTE4NTF5YU9zRnpzYkJnUU9saU1ER1Nlcl9HcycsXG4gICAgICAgIG9hdXRoX25vbmNlOiBub25jZV9nZW5lcmF0ZSgpLFxuICAgICAgICBvYXV0aF90aW1lc3RhbXA6IE1hdGguZmxvb3IoRGF0ZS5ub3coKS8xMDAwKSxcbiAgICAgICAgb2F1dGhfc2lnbmF0dXJlX21ldGhvZDogJ0hNQUMtU0hBMScsXG4gICAgICAgIG9hdXRoX3ZlcnNpb24gOiAnMS4wJyxcbiAgICAgICAgY2FsbGJhY2s6ICdjYicsIC8vIFRoaXMgaXMgY3J1Y2lhbCB0byBpbmNsdWRlIGZvciBqc29ucCBpbXBsZW1lbnRhdGlvbiBpbiBBSkFYIG9yIGVsc2UgdGhlIG9hdXRoLXNpZ25hdHVyZSB3aWxsIGJlIHdyb25nLlxuICAgICAgICBsb2NhdGlvbjogJ0JpbGJhbytTcGFpbicsXG4gICAgICAgIHRlcm06ICdjYWZlIGlydW5hJyxcbiAgICAgICAgY2xsOiAnNDMuMjYzMjI0LEMtMi45MzUwMDMnXG4gICAgfTtcblxuICAgIHZhciBlbmNvZGVkU2lnbmF0dXJlID0gb2F1dGhTaWduYXR1cmUuZ2VuZXJhdGUoJ0dFVCcseWVscF91cmwsIHBhcmFtZXRlcnMsICdQVWFkY1REcF85YzFEaFJEN3BrZnBFN1JETWsnLCAnb3RQR3paRC1CeG93Tm03WXlsVnpHVkIxQ2lRJyk7XG4gICAgcGFyYW1ldGVycy5vYXV0aF9zaWduYXR1cmUgPSBlbmNvZGVkU2lnbmF0dXJlO1xuXG4gICAgdmFyIHNldHRpbmdzID0ge1xuICAgICAgICB1cmw6IHllbHBfdXJsLFxuICAgICAgICBkYXRhOiBwYXJhbWV0ZXJzLFxuICAgICAgICBjYWNoZTogdHJ1ZSwgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBjcnVjaWFsIHRvIGluY2x1ZGUgYXMgd2VsbCB0byBwcmV2ZW50IGpRdWVyeSBmcm9tIGFkZGluZyBvbiBhIGNhY2hlLWJ1c3RlciBwYXJhbWV0ZXIgXCJfPTIzNDg5NDg5NzQ5ODM3XCIsIGludmFsaWRhdGluZyBvdXIgb2F1dGgtc2lnbmF0dXJlXG4gICAgICAgIGRhdGFUeXBlOiAnanNvbnAnLFxuICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXN1bHRzKSB7XG4gICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0cyk7XG4gICAgICAgIH0sXG4gICAgICAgIGZhaWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdmYWlsZWQhIScpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIFNlbmQgQUpBWCBxdWVyeSB2aWEgalF1ZXJ5IGxpYnJhcnkuXG4gICAgJC5hamF4KHNldHRpbmdzKTtcblxuICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcblxuXG4gICAgdmFyIHBpbnMgPSB7XG4gICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgIHBpbkltYWdlIDogbmV3IGdvb2dsZS5tYXBzLk1hcmtlckltYWdlKFwiaHR0cDovL2NoYXJ0LmFwaXMuZ29vZ2xlLmNvbS9jaGFydD9jaHN0PWRfbWFwX3Bpbl9sZXR0ZXImY2hsZD0lRTIlODAlQTJ8XCIgK1xuICAgICAgICAgICAgJ0REODg4OCcsXG4gICAgICAgICAgICBuZXcgZ29vZ2xlLm1hcHMuU2l6ZSgyMSwgMzQpLFxuICAgICAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlBvaW50KDAsMCksXG4gICAgICAgICAgICBuZXcgZ29vZ2xlLm1hcHMuUG9pbnQoMTAsIDM0KSlcbiAgICAgICAgfSxcbiAgICAgICAgYWN0aXZlOiB7XG4gICAgICAgICAgICBwaW5JbWFnZSA6IG5ldyBnb29nbGUubWFwcy5NYXJrZXJJbWFnZShcImh0dHA6Ly9jaGFydC5hcGlzLmdvb2dsZS5jb20vY2hhcnQ/Y2hzdD1kX21hcF9waW5fbGV0dGVyJmNobGQ9JUUyJTgwJUEyfFwiICtcbiAgICAgICAgICAgICdBQUREREQnLFxuICAgICAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlNpemUoMjEsIDM0KSxcbiAgICAgICAgICAgIG5ldyBnb29nbGUubWFwcy5Qb2ludCgwLDApLFxuICAgICAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlBvaW50KDEwLCAzNCkpXG5cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgbmVpZ2hib3Job29kTWFwID0gZnVuY3Rpb24oKXtcbiAgICAgICAgdGhpcy5tYXBEaXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwJyk7XG4gICAgICAgIHRoaXMuY2VudGVyTWFwID0ge2xhdDogNDMuMjYzMjI0LCBsbmc6IC0yLjkzNTAwM307XG4gICAgICAgIHRoaXMuem9vbSA9IDE1O1xuICAgICAgICB0aGlzLm1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAodGhpcy5tYXBEaXYsIHtcbiAgICAgICAgICAgIHpvb206IHRoaXMuem9vbSxcbiAgICAgICAgICAgIGNlbnRlcjogdGhpcy5jZW50ZXJNYXBcbiAgICAgICAgfSk7XG4gICAgfTtcblxuXG4gICAgdmFyIExvY2F0aW9uID0gZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgIHRoaXMubmFtZSA9IGRhdGFbJ25hbWUnXTtcbiAgICAgICAgdGhpcy5sYXQgPSBwYXJzZUZsb2F0KGRhdGFbJ2xvY2F0aW9uJ11bJ2xhdCddKTtcbiAgICAgICAgdGhpcy5sbmcgPSBwYXJzZUZsb2F0KGRhdGFbJ2xvY2F0aW9uJ11bJ2xuZyddKTtcbiAgICAgICAgdGhpcy5kaXNwbGF5ID0ga28ub2JzZXJ2YWJsZShkYXRhWydkaXNwbGF5J10gPT09ICd0cnVlJyk7XG4gICAgICAgIHRoaXMubWFya2VyID0gbnVsbDtcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcbiAgICB9O1xuXG4gICAgdmFyIG15Vmlld01vZGVsID0gZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLmxvY2F0aW9uc0xpc3QgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xuICAgICAgICBzZWxmLm15TWFwID0gbmV3IG5laWdoYm9yaG9vZE1hcCgpO1xuICAgICAgICBzZWxmLmN1cnJlbnRGaWx0ZXIgPSBrby5vYnNlcnZhYmxlKCcnKTtcblxuICAgICAgICB2YXIgaW5mb1dpbmRvdyA9IG5ldyBnb29nbGUubWFwcy5JbmZvV2luZG93KHtcbiAgICAgICAgICAgIGNvbnRlbnQ6IFwiSm9zZXBcIlxuICAgICAgICB9KTtcblxuXG4gICAgICAgIC8vIC0tLS0tLS0tLS0gVE8gRE86IElNUExFTUVOVCBHT09HTEUgTUFQUyBQTEFDRVNcbiAgICAgICAgc2VsZi5zZXJ2aWNlID0gbmV3IGdvb2dsZS5tYXBzLnBsYWNlcy5QbGFjZXNTZXJ2aWNlKHNlbGYubXlNYXAubWFwKTtcbiAgICAgICAgc2VsZi5wcm9jZXNzUmVzdWx0cyA9IGZ1bmN0aW9uKHJlc3VsdHMsc3RhdHVzKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdHMpO1xuICAgICAgICB9O1xuICAgICAgICBzZWxmLnNlcnZpY2UubmVhcmJ5U2VhcmNoKHtcbiAgICAgICAgICAgIGxvY2F0aW9uOiBzZWxmLm15TWFwLmNlbnRlck1hcCxcbiAgICAgICAgICAgIHJhZGl1czogMTAwMCxcbiAgICAgICAgICAgIHR5cGU6IFsncmVzdGF1cmFudCcsJ2JhciddXG4gICAgICAgIH0sIHNlbGYucHJvY2Vzc1Jlc3VsdHMpO1xuXG5cbiAgICAgICAgLy8gLS0tLS0tLS0tLSBUTyBETzogSU1QTEVNRU5UIEdPT0dMRSBNQVBTIFBMQUNFU1xuXG4gICAgICAgIHZhciBzdWJzY3JpcHRpb24gPSBzZWxmLmN1cnJlbnRGaWx0ZXIuc3Vic2NyaWJlKGZ1bmN0aW9uKG5ld1ZhbHVlKXtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpPHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgbG9jYXRpb25OYW1lID0gc2VsZi5sb2NhdGlvbnNMaXN0KClbaV0ubmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIHRhcmdldFN0cmluZyA9IG5ld1ZhbHVlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgaWYgKGxvY2F0aW9uTmFtZS5pbmRleE9mKHRhcmdldFN0cmluZykgPT09IC0xKXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5sb2NhdGlvbnNMaXN0KClbaV0uZGlzcGxheShmYWxzZSk7XG4gICAgICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubG9jYXRpb25zTGlzdCgpW2ldLmRpc3BsYXkodHJ1ZSk7ICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGYucmVkcmF3TWFya2VycygpO1xuICAgICAgICB9KTtcblxuICAgICAgICBzZWxmLmluaXQgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgbG9jYXRpb25zLmZvckVhY2goZnVuY3Rpb24obG9jYXRpb25JdGVtKXtcbiAgICAgICAgICAgICAgICBzZWxmLmxvY2F0aW9uc0xpc3QucHVzaChuZXcgTG9jYXRpb24obG9jYXRpb25JdGVtKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHNlbGYuZHJhd01hcmtlcnMoKTtcbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLmRyYXdNYXJrZXJzID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGk8IHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudEl0ZW0uZGlzcGxheSgpID09PSB0cnVlKXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5hZGRNYXJrZXJXaXRoQW5pbWF0aW9uKGN1cnJlbnRJdGVtLCBpKjIwMCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmKGN1cnJlbnRJdGVtLm1hcmtlciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIuc2V0TWFwKG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLnJlZHJhd01hcmtlcnMgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgZm9yKHZhciBpID0gMDsgaTwgc2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50SXRlbSA9IHNlbGYubG9jYXRpb25zTGlzdCgpW2ldO1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50SXRlbS5kaXNwbGF5KCkgPT09IHRydWUpe1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIuc2V0TWFwKHNlbGYubXlNYXAubWFwKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYoY3VycmVudEl0ZW0ubWFya2VyICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlci5zZXRNYXAobnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHNlbGYuY2xlYXJNYXJrZXJzID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGk8IHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIuc2V0TWFwKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHNlbGYuYWRkTWFya2VyV2l0aEFuaW1hdGlvbiA9IGZ1bmN0aW9uKGN1cnJlbnRJdGVtLCB0aW1lb3V0KXtcbiAgICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgY3VycmVudEl0ZW0ubWFya2VyID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcih7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7bGF0OiBjdXJyZW50SXRlbS5sYXQsIGxuZzogY3VycmVudEl0ZW0ubG5nfSxcbiAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uOiBnb29nbGUubWFwcy5BbmltYXRpb24uRFJPUCxcbiAgICAgICAgICAgICAgICAgICAgaWNvbjogcGlucy5kZWZhdWx0LnBpbkltYWdlLFxuICAgICAgICAgICAgICAgICAgICBtYXA6IHNlbGYubXlNYXAubWFwXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY3VycmVudEl0ZW0ubWFya2VyLmFkZExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuaW5hY3RpdmVBbGwoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRNYXJrZXIgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5hY3RpdmUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuYWN0aXZlQ29sb3IoY3VycmVudE1hcmtlcik7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuQm91bmNlKGN1cnJlbnRNYXJrZXIpO1xuICAgICAgICAgICAgICAgICAgICBpbmZvV2luZG93Lm9wZW4oc2VsZi5teU1hcCwgY3VycmVudE1hcmtlcik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLmFjdGl2YXRlTWFya2VyID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciBtYXJrZXIgPSB0aGlzLm1hcmtlcjtcbiAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IHRoaXM7XG4gICAgICAgICAgICBzZWxmLmluYWN0aXZlQWxsKCk7XG4gICAgICAgICAgICBsb2NhdGlvbi5hY3RpdmUodHJ1ZSk7XG4gICAgICAgICAgICBzZWxmLmFjdGl2ZUNvbG9yKG1hcmtlcik7XG4gICAgICAgICAgICBzZWxmLkJvdW5jZShtYXJrZXIpO1xuICAgICAgICAgICAgaW5mb1dpbmRvdy5vcGVuKHNlbGYubXlNYXAsIG1hcmtlcik7XG4gICAgICAgIH07XG5cbiAgICAgICAgc2VsZi5maW5kQ2xpY2tlZE1hcmtlciA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuQm91bmNlID0gZnVuY3Rpb24oY3VycmVudE1hcmtlcil7XG4gICAgICAgICAgICAvLyB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICBpZiAoY3VycmVudE1hcmtlci5nZXRBbmltYXRpb24oKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRNYXJrZXIuc2V0QW5pbWF0aW9uKG51bGwpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50TWFya2VyLnNldEFuaW1hdGlvbihnb29nbGUubWFwcy5BbmltYXRpb24uQk9VTkNFKTtcbiAgICAgICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50TWFya2VyLnNldEFuaW1hdGlvbihudWxsKTtcbiAgICAgICAgICAgICAgICB9LDcwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgc2VsZi5hY3RpdmVDb2xvciA9IGZ1bmN0aW9uKGN1cnJlbnRNYXJrZXIpe1xuICAgICAgICAgICAgY3VycmVudE1hcmtlci5zZXRJY29uKHBpbnMuYWN0aXZlLnBpbkltYWdlKTtcbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLmRlZmF1bHRDb2xvciA9IGZ1bmN0aW9uKGN1cnJlbnRNYXJrZXIpe1xuICAgICAgICAgICAgY3VycmVudE1hcmtlci5zZXRJY29uKHBpbnMuZGVmYXVsdC5waW5JbWFnZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgc2VsZi5pbmFjdGl2ZUFsbCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpPCBzZWxmLmxvY2F0aW9uc0xpc3QoKS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRJdGVtID0gc2VsZi5sb2NhdGlvbnNMaXN0KClbaV07XG4gICAgICAgICAgICAgICAgY3VycmVudEl0ZW0uYWN0aXZlKGZhbHNlKTtcbiAgICAgICAgICAgICAgICBzZWxmLmRlZmF1bHRDb2xvcihjdXJyZW50SXRlbS5tYXJrZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHNlbGYuZGVmYXVsdENvbG9yQWxsID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGk8IHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgICAgICBzZWxmLmRlZmF1bHRDb2xvcihjdXJyZW50SXRlbS5tYXJrZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG5cbiAgICAgICAgc2VsZi5pbml0KCk7XG4gICAgfTtcblxuXG4gICAga28uYXBwbHlCaW5kaW5ncyhuZXcgbXlWaWV3TW9kZWwpO1xufTtcblxuZnVuY3Rpb24gZ29vZ2xlU3VjY2Vzcygpe1xuICAgIGluaXRpYXRlVmlldygpO1xufTtcblxuZnVuY3Rpb24gZ29vZ2xlRXJyb3IoKXtcbiAgICAkKCdib2R5JykuaHRtbCgnJyk7XG4gICAgJCgnYm9keScpLmFwcGVuZChcIjxoMT5UaGVyZSB3YXMgYW4gZXJyb3IgbG9hZGluZyBHb29nbGUgTWFwcy4gUGxlYXNlIHRyeSBhZ2FpbiBpbiAxMCBob3Vycy48L2gxPlwiKTtcbn07XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
