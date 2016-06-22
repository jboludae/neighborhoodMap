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
    self.service.nearbySearch({
        location: self.myMap.centerMap,
        radius: 1000,
        type: ['restaurant','bar']
    }, self.processResults);

    self.processResults = function(results,status){
        console.log(results);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhbGwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBpbml0aWF0ZVZpZXcoKXtcbnZhciBsb2NhdGlvbnMgPSBbXG4gICAge1xuICAgICAgICAnbmFtZSc6ICdFbCBHbG9ibycsXG4gICAgICAgICdsb2NhdGlvbic6IHtcbiAgICAgICAgICAgICdsYXQnOiAnNDMuMjYxODQzNjkyNjAwMycsXG4gICAgICAgICAgICAnbG5nJzogJy0yLjkzMjYyMTM4OTE2MzE2J1xuICAgICAgICB9LFxuICAgICAgICAnZGlzcGxheSc6ICd0cnVlJ1xuICAgIH0sXG4gICAge1xuICAgICAgICAnbmFtZSc6ICdFdHhhbm9iZScsXG4gICAgICAgICdsb2NhdGlvbic6IHtcbiAgICAgICAgICAgICdsYXQnOiAnNDMuMjY4NTUwOScsXG4gICAgICAgICAgICAnbG5nJzogJy0yLjkzNTM0ODcnXG4gICAgICAgIH0sXG4gICAgICAgICdkaXNwbGF5JzogJ3RydWUnXG4gICAgfSxcbiAgICB7XG4gICAgICAgICduYW1lJzogJ0NhZmUgSXJ1w7FhJyxcbiAgICAgICAgJ2xvY2F0aW9uJzoge1xuICAgICAgICAgICAgJ2xhdCc6ICc0My4yNjIzNzExJyxcbiAgICAgICAgICAgICdsbmcnOiAnLTIuOTI4MDMnXG4gICAgICAgIH0sXG4gICAgICAgICdkaXNwbGF5JzogJ3RydWUnXG4gICAgfSxcbiAgICB7XG4gICAgICAgICduYW1lJzogJ0d1cmUgVG9raScsXG4gICAgICAgICdsb2NhdGlvbic6IHtcbiAgICAgICAgICAgICdsYXQnOiAnNDMuMjU5Mzg1ODg2OTkyNScsXG4gICAgICAgICAgICAnbG5nJzogJy0yLjkyMjM4NDc3OTQ1ODA3J1xuICAgICAgICB9LFxuICAgICAgICAnZGlzcGxheSc6ICd0cnVlJ1xuICAgIH0sXG4gICAge1xuICAgICAgICAnbmFtZSc6ICdTdW1vIEJpbGJhbycsXG4gICAgICAgICdsb2NhdGlvbic6IHtcbiAgICAgICAgICAgICdsYXQnOiAnNDMuMjYyMDQxJyxcbiAgICAgICAgICAgICdsbmcnOiAnLTIuOTI3OTAzJ1xuICAgICAgICB9LFxuICAgICAgICAnZGlzcGxheSc6ICd0cnVlJ1xuICAgIH1cbl07XG5cbi8vIFRPIERPOiBJTlRFR1JBVEUgV0lUSCBZRUxQIEFQSVxuLyoqXG4gKiBHZW5lcmF0ZXMgYSByYW5kb20gbnVtYmVyIGFuZCByZXR1cm5zIGl0IGFzIGEgc3RyaW5nIGZvciBPQXV0aGVudGljYXRpb25cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gbm9uY2VfZ2VuZXJhdGUoKSB7XG4gICAgcmV0dXJuIChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxZTEyKS50b1N0cmluZygpKTtcbn1cblxudmFyIFlFTFBfQkFTRV9VUkwgPSAnaHR0cHM6Ly9hcGkueWVscC5jb20vdjIvc2VhcmNoPyc7XG5cblxudmFyIHllbHBfdXJsID0gWUVMUF9CQVNFX1VSTDtcblxudmFyIHBhcmFtZXRlcnMgPSB7XG4gICAgb2F1dGhfY29uc3VtZXJfa2V5OiAnUzgtOFRpYVBTY21Wd1N0dVIxR0FfUScsXG4gICAgb2F1dGhfdG9rZW46ICdVb0E3bTE4NTF5YU9zRnpzYkJnUU9saU1ER1Nlcl9HcycsXG4gICAgb2F1dGhfbm9uY2U6IG5vbmNlX2dlbmVyYXRlKCksXG4gICAgb2F1dGhfdGltZXN0YW1wOiBNYXRoLmZsb29yKERhdGUubm93KCkvMTAwMCksXG4gICAgb2F1dGhfc2lnbmF0dXJlX21ldGhvZDogJ0hNQUMtU0hBMScsXG4gICAgb2F1dGhfdmVyc2lvbiA6ICcxLjAnLFxuICAgIGNhbGxiYWNrOiAnY2InLCAvLyBUaGlzIGlzIGNydWNpYWwgdG8gaW5jbHVkZSBmb3IganNvbnAgaW1wbGVtZW50YXRpb24gaW4gQUpBWCBvciBlbHNlIHRoZSBvYXV0aC1zaWduYXR1cmUgd2lsbCBiZSB3cm9uZy5cbiAgICBsb2NhdGlvbjogJ0JpbGJhbytTcGFpbicsXG4gICAgdGVybTogJ2NhZmUgaXJ1bmEnLFxuICAgIGNsbDogJzQzLjI2MzIyNCxDLTIuOTM1MDAzJ1xufTtcblxudmFyIGVuY29kZWRTaWduYXR1cmUgPSBvYXV0aFNpZ25hdHVyZS5nZW5lcmF0ZSgnR0VUJyx5ZWxwX3VybCwgcGFyYW1ldGVycywgJ1BVYWRjVERwXzljMURoUkQ3cGtmcEU3UkRNaycsICdvdFBHelpELUJ4b3dObTdZeWxWekdWQjFDaVEnKTtcbnBhcmFtZXRlcnMub2F1dGhfc2lnbmF0dXJlID0gZW5jb2RlZFNpZ25hdHVyZTtcblxudmFyIHNldHRpbmdzID0ge1xuICAgIHVybDogeWVscF91cmwsXG4gICAgZGF0YTogcGFyYW1ldGVycyxcbiAgICBjYWNoZTogdHJ1ZSwgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBjcnVjaWFsIHRvIGluY2x1ZGUgYXMgd2VsbCB0byBwcmV2ZW50IGpRdWVyeSBmcm9tIGFkZGluZyBvbiBhIGNhY2hlLWJ1c3RlciBwYXJhbWV0ZXIgXCJfPTIzNDg5NDg5NzQ5ODM3XCIsIGludmFsaWRhdGluZyBvdXIgb2F1dGgtc2lnbmF0dXJlXG4gICAgZGF0YVR5cGU6ICdqc29ucCcsXG4gICAgc3VjY2VzczogZnVuY3Rpb24ocmVzdWx0cykge1xuICAgICAgY29uc29sZS5sb2cocmVzdWx0cyk7XG4gICAgfSxcbiAgICBmYWlsOiBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdmYWlsZWQhIScpO1xuICAgIH1cbn07XG5cbi8vIFNlbmQgQUpBWCBxdWVyeSB2aWEgalF1ZXJ5IGxpYnJhcnkuXG4kLmFqYXgoc2V0dGluZ3MpO1xuXG4vLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cblxudmFyIHBpbnMgPSB7XG4gICAgZGVmYXVsdDoge1xuICAgICAgICBwaW5JbWFnZSA6IG5ldyBnb29nbGUubWFwcy5NYXJrZXJJbWFnZShcImh0dHA6Ly9jaGFydC5hcGlzLmdvb2dsZS5jb20vY2hhcnQ/Y2hzdD1kX21hcF9waW5fbGV0dGVyJmNobGQ9JUUyJTgwJUEyfFwiICtcbiAgICAgICAgJ0REODg4OCcsXG4gICAgICAgIG5ldyBnb29nbGUubWFwcy5TaXplKDIxLCAzNCksXG4gICAgICAgIG5ldyBnb29nbGUubWFwcy5Qb2ludCgwLDApLFxuICAgICAgICBuZXcgZ29vZ2xlLm1hcHMuUG9pbnQoMTAsIDM0KSlcbiAgICB9LFxuICAgIGFjdGl2ZToge1xuICAgICAgICBwaW5JbWFnZSA6IG5ldyBnb29nbGUubWFwcy5NYXJrZXJJbWFnZShcImh0dHA6Ly9jaGFydC5hcGlzLmdvb2dsZS5jb20vY2hhcnQ/Y2hzdD1kX21hcF9waW5fbGV0dGVyJmNobGQ9JUUyJTgwJUEyfFwiICtcbiAgICAgICAgJ0FBRERERCcsXG4gICAgICAgIG5ldyBnb29nbGUubWFwcy5TaXplKDIxLCAzNCksXG4gICAgICAgIG5ldyBnb29nbGUubWFwcy5Qb2ludCgwLDApLFxuICAgICAgICBuZXcgZ29vZ2xlLm1hcHMuUG9pbnQoMTAsIDM0KSlcblxuICAgIH1cbn07XG5cbnZhciBuZWlnaGJvcmhvb2RNYXAgPSBmdW5jdGlvbigpe1xuICAgIHRoaXMubWFwRGl2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hcCcpO1xuICAgIHRoaXMuY2VudGVyTWFwID0ge2xhdDogNDMuMjYzMjI0LCBsbmc6IC0yLjkzNTAwM307XG4gICAgdGhpcy56b29tID0gMTU7XG4gICAgdGhpcy5tYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwKHRoaXMubWFwRGl2LCB7XG4gICAgICAgIHpvb206IHRoaXMuem9vbSxcbiAgICAgICAgY2VudGVyOiB0aGlzLmNlbnRlck1hcFxuICAgIH0pO1xufTtcblxuXG52YXIgTG9jYXRpb24gPSBmdW5jdGlvbihkYXRhKXtcbiAgICB0aGlzLm5hbWUgPSBkYXRhWyduYW1lJ107XG4gICAgdGhpcy5sYXQgPSBwYXJzZUZsb2F0KGRhdGFbJ2xvY2F0aW9uJ11bJ2xhdCddKTtcbiAgICB0aGlzLmxuZyA9IHBhcnNlRmxvYXQoZGF0YVsnbG9jYXRpb24nXVsnbG5nJ10pO1xuICAgIHRoaXMuZGlzcGxheSA9IGtvLm9ic2VydmFibGUoZGF0YVsnZGlzcGxheSddID09PSAndHJ1ZScpO1xuICAgIHRoaXMubWFya2VyID0gbnVsbDtcbiAgICB0aGlzLmFjdGl2ZSA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xufTtcblxudmFyIG15Vmlld01vZGVsID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgc2VsZi5sb2NhdGlvbnNMaXN0ID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcbiAgICBzZWxmLm15TWFwID0gbmV3IG5laWdoYm9yaG9vZE1hcCgpO1xuICAgIHNlbGYuY3VycmVudEZpbHRlciA9IGtvLm9ic2VydmFibGUoJycpO1xuXG4gICAgdmFyIGluZm9XaW5kb3cgPSBuZXcgZ29vZ2xlLm1hcHMuSW5mb1dpbmRvdyh7XG4gICAgICAgIGNvbnRlbnQ6IFwiSm9zZXBcIlxuICAgIH0pO1xuXG5cbiAgICAvLyAtLS0tLS0tLS0tIFRPIERPOiBJTVBMRU1FTlQgR09PR0xFIE1BUFMgUExBQ0VTXG4gICAgc2VsZi5zZXJ2aWNlID0gbmV3IGdvb2dsZS5tYXBzLnBsYWNlcy5QbGFjZXNTZXJ2aWNlKHNlbGYubXlNYXAubWFwKTtcbiAgICBzZWxmLnNlcnZpY2UubmVhcmJ5U2VhcmNoKHtcbiAgICAgICAgbG9jYXRpb246IHNlbGYubXlNYXAuY2VudGVyTWFwLFxuICAgICAgICByYWRpdXM6IDEwMDAsXG4gICAgICAgIHR5cGU6IFsncmVzdGF1cmFudCcsJ2JhciddXG4gICAgfSwgc2VsZi5wcm9jZXNzUmVzdWx0cyk7XG5cbiAgICBzZWxmLnByb2Nlc3NSZXN1bHRzID0gZnVuY3Rpb24ocmVzdWx0cyxzdGF0dXMpe1xuICAgICAgICBjb25zb2xlLmxvZyhyZXN1bHRzKTtcbiAgICB9O1xuICAgIC8vIC0tLS0tLS0tLS0gVE8gRE86IElNUExFTUVOVCBHT09HTEUgTUFQUyBQTEFDRVNcblxuICAgIHZhciBzdWJzY3JpcHRpb24gPSBzZWxmLmN1cnJlbnRGaWx0ZXIuc3Vic2NyaWJlKGZ1bmN0aW9uKG5ld1ZhbHVlKXtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGk8c2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIGxvY2F0aW9uTmFtZSA9IHNlbGYubG9jYXRpb25zTGlzdCgpW2ldLm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIHRhcmdldFN0cmluZyA9IG5ld1ZhbHVlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICBpZiAobG9jYXRpb25OYW1lLmluZGV4T2YodGFyZ2V0U3RyaW5nKSA9PT0gLTEpe1xuICAgICAgICAgICAgICAgIHNlbGYubG9jYXRpb25zTGlzdCgpW2ldLmRpc3BsYXkoZmFsc2UpO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgc2VsZi5sb2NhdGlvbnNMaXN0KClbaV0uZGlzcGxheSh0cnVlKTsgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc2VsZi5yZWRyYXdNYXJrZXJzKCk7XG4gICAgfSk7XG5cbiAgICBzZWxmLmluaXQgPSBmdW5jdGlvbigpe1xuICAgICAgICBsb2NhdGlvbnMuZm9yRWFjaChmdW5jdGlvbihsb2NhdGlvbkl0ZW0pe1xuICAgICAgICAgICAgc2VsZi5sb2NhdGlvbnNMaXN0LnB1c2gobmV3IExvY2F0aW9uKGxvY2F0aW9uSXRlbSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgc2VsZi5kcmF3TWFya2VycygpO1xuICAgIH07XG5cbiAgICBzZWxmLmRyYXdNYXJrZXJzID0gZnVuY3Rpb24oKXtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaTwgc2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRJdGVtID0gc2VsZi5sb2NhdGlvbnNMaXN0KClbaV07XG4gICAgICAgICAgICBpZiAoY3VycmVudEl0ZW0uZGlzcGxheSgpID09PSB0cnVlKXtcbiAgICAgICAgICAgICAgICBzZWxmLmFkZE1hcmtlcldpdGhBbmltYXRpb24oY3VycmVudEl0ZW0sIGkqMjAwKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZihjdXJyZW50SXRlbS5tYXJrZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIuc2V0TWFwKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYucmVkcmF3TWFya2VycyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGk8IHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIHZhciBjdXJyZW50SXRlbSA9IHNlbGYubG9jYXRpb25zTGlzdCgpW2ldO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRJdGVtLmRpc3BsYXkoKSA9PT0gdHJ1ZSl7XG4gICAgICAgICAgICAgICAgY3VycmVudEl0ZW0ubWFya2VyLnNldE1hcChzZWxmLm15TWFwLm1hcCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYoY3VycmVudEl0ZW0ubWFya2VyICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudEl0ZW0ubWFya2VyLnNldE1hcChudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBzZWxmLmNsZWFyTWFya2VycyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGk8IHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIHZhciBjdXJyZW50SXRlbSA9IHNlbGYubG9jYXRpb25zTGlzdCgpW2ldO1xuICAgICAgICAgICAgY3VycmVudEl0ZW0ubWFya2VyLnNldE1hcChudWxsKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBzZWxmLmFkZE1hcmtlcldpdGhBbmltYXRpb24gPSBmdW5jdGlvbihjdXJyZW50SXRlbSwgdGltZW91dCl7XG4gICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKHtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjoge2xhdDogY3VycmVudEl0ZW0ubGF0LCBsbmc6IGN1cnJlbnRJdGVtLmxuZ30sXG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uOiBnb29nbGUubWFwcy5BbmltYXRpb24uRFJPUCxcbiAgICAgICAgICAgICAgICBpY29uOiBwaW5zLmRlZmF1bHQucGluSW1hZ2UsXG4gICAgICAgICAgICAgICAgbWFwOiBzZWxmLm15TWFwLm1hcFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIuYWRkTGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBzZWxmLmluYWN0aXZlQWxsKCk7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRNYXJrZXIgPSB0aGlzO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLmFjdGl2ZSh0cnVlKTtcbiAgICAgICAgICAgICAgICBzZWxmLmFjdGl2ZUNvbG9yKGN1cnJlbnRNYXJrZXIpO1xuICAgICAgICAgICAgICAgIHNlbGYuQm91bmNlKGN1cnJlbnRNYXJrZXIpO1xuICAgICAgICAgICAgICAgIGluZm9XaW5kb3cub3BlbihzZWxmLm15TWFwLCBjdXJyZW50TWFya2VyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICB9O1xuXG4gICAgc2VsZi5hY3RpdmF0ZU1hcmtlciA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBtYXJrZXIgPSB0aGlzLm1hcmtlcjtcbiAgICAgICAgdmFyIGxvY2F0aW9uID0gdGhpcztcbiAgICAgICAgc2VsZi5pbmFjdGl2ZUFsbCgpO1xuICAgICAgICBsb2NhdGlvbi5hY3RpdmUodHJ1ZSk7XG4gICAgICAgIHNlbGYuYWN0aXZlQ29sb3IobWFya2VyKTtcbiAgICAgICAgc2VsZi5Cb3VuY2UobWFya2VyKTtcbiAgICAgICAgaW5mb1dpbmRvdy5vcGVuKHNlbGYubXlNYXAsIG1hcmtlcik7XG4gICAgfTtcblxuICAgIHNlbGYuZmluZENsaWNrZWRNYXJrZXIgPSBmdW5jdGlvbigpe1xuICAgICAgICBjb25zb2xlLmxvZyh0aGlzKTtcbiAgICB9XG5cbiAgICBzZWxmLkJvdW5jZSA9IGZ1bmN0aW9uKGN1cnJlbnRNYXJrZXIpe1xuICAgICAgICAvLyB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGlmIChjdXJyZW50TWFya2VyLmdldEFuaW1hdGlvbigpICE9PSBudWxsKSB7XG4gICAgICAgICAgICBjdXJyZW50TWFya2VyLnNldEFuaW1hdGlvbihudWxsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGN1cnJlbnRNYXJrZXIuc2V0QW5pbWF0aW9uKGdvb2dsZS5tYXBzLkFuaW1hdGlvbi5CT1VOQ0UpO1xuICAgICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBjdXJyZW50TWFya2VyLnNldEFuaW1hdGlvbihudWxsKTtcbiAgICAgICAgICAgIH0sNzAwKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBzZWxmLmFjdGl2ZUNvbG9yID0gZnVuY3Rpb24oY3VycmVudE1hcmtlcil7XG4gICAgICAgIGN1cnJlbnRNYXJrZXIuc2V0SWNvbihwaW5zLmFjdGl2ZS5waW5JbWFnZSk7XG4gICAgfTtcblxuICAgIHNlbGYuZGVmYXVsdENvbG9yID0gZnVuY3Rpb24oY3VycmVudE1hcmtlcil7XG4gICAgICAgIGN1cnJlbnRNYXJrZXIuc2V0SWNvbihwaW5zLmRlZmF1bHQucGluSW1hZ2UpO1xuICAgIH07XG5cbiAgICBzZWxmLmluYWN0aXZlQWxsID0gZnVuY3Rpb24oKXtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaTwgc2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRJdGVtID0gc2VsZi5sb2NhdGlvbnNMaXN0KClbaV07XG4gICAgICAgICAgICBjdXJyZW50SXRlbS5hY3RpdmUoZmFsc2UpO1xuICAgICAgICAgICAgc2VsZi5kZWZhdWx0Q29sb3IoY3VycmVudEl0ZW0ubWFya2VyKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBzZWxmLmRlZmF1bHRDb2xvckFsbCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGk8IHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIHZhciBjdXJyZW50SXRlbSA9IHNlbGYubG9jYXRpb25zTGlzdCgpW2ldO1xuICAgICAgICAgICAgc2VsZi5kZWZhdWx0Q29sb3IoY3VycmVudEl0ZW0ubWFya2VyKTtcbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIHNlbGYuaW5pdCgpO1xufTtcblxuXG4gICAga28uYXBwbHlCaW5kaW5ncyhuZXcgbXlWaWV3TW9kZWwpO1xufTtcblxuZnVuY3Rpb24gZ29vZ2xlU3VjY2Vzcygpe1xuICAgIGluaXRpYXRlVmlldygpO1xufTtcblxuZnVuY3Rpb24gZ29vZ2xlRXJyb3IoKXtcbiAgICAkKCdib2R5JykuaHRtbCgnJyk7XG4gICAgJCgnYm9keScpLmFwcGVuZChcIjxoMT5UaGVyZSB3YXMgYW4gZXJyb3IgbG9hZGluZyBHb29nbGUgTWFwcy4gUGxlYXNlIHRyeSBhZ2FpbiBpbiAxMCBob3Vycy48L2gxPlwiKTtcbn07XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
