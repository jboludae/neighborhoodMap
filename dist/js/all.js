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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhbGwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBpbml0aWF0ZVZpZXcoKXtcbnZhciBsb2NhdGlvbnMgPSBbXG4gICAge1xuICAgICAgICAnbmFtZSc6ICdFbCBHbG9ibycsXG4gICAgICAgICdsb2NhdGlvbic6IHtcbiAgICAgICAgICAgICdsYXQnOiAnNDMuMjYxODQzNjkyNjAwMycsXG4gICAgICAgICAgICAnbG5nJzogJy0yLjkzMjYyMTM4OTE2MzE2J1xuICAgICAgICB9LFxuICAgICAgICAnZGlzcGxheSc6ICd0cnVlJ1xuICAgIH0sXG4gICAge1xuICAgICAgICAnbmFtZSc6ICdFdHhhbm9iZScsXG4gICAgICAgICdsb2NhdGlvbic6IHtcbiAgICAgICAgICAgICdsYXQnOiAnNDMuMjY4NTUwOScsXG4gICAgICAgICAgICAnbG5nJzogJy0yLjkzNTM0ODcnXG4gICAgICAgIH0sXG4gICAgICAgICdkaXNwbGF5JzogJ3RydWUnXG4gICAgfSxcbiAgICB7XG4gICAgICAgICduYW1lJzogJ0NhZmUgSXJ1w7FhJyxcbiAgICAgICAgJ2xvY2F0aW9uJzoge1xuICAgICAgICAgICAgJ2xhdCc6ICc0My4yNjIzNzExJyxcbiAgICAgICAgICAgICdsbmcnOiAnLTIuOTI4MDMnXG4gICAgICAgIH0sXG4gICAgICAgICdkaXNwbGF5JzogJ3RydWUnXG4gICAgfSxcbiAgICB7XG4gICAgICAgICduYW1lJzogJ0d1cmUgVG9raScsXG4gICAgICAgICdsb2NhdGlvbic6IHtcbiAgICAgICAgICAgICdsYXQnOiAnNDMuMjU5Mzg1ODg2OTkyNScsXG4gICAgICAgICAgICAnbG5nJzogJy0yLjkyMjM4NDc3OTQ1ODA3J1xuICAgICAgICB9LFxuICAgICAgICAnZGlzcGxheSc6ICd0cnVlJ1xuICAgIH0sXG4gICAge1xuICAgICAgICAnbmFtZSc6ICdTdW1vIEJpbGJhbycsXG4gICAgICAgICdsb2NhdGlvbic6IHtcbiAgICAgICAgICAgICdsYXQnOiAnNDMuMjYyMDQxJyxcbiAgICAgICAgICAgICdsbmcnOiAnLTIuOTI3OTAzJ1xuICAgICAgICB9LFxuICAgICAgICAnZGlzcGxheSc6ICd0cnVlJ1xuICAgIH1cbl07XG5cbi8vIFRPIERPOiBJTlRFR1JBVEUgV0lUSCBZRUxQIEFQSVxuLyoqXG4gKiBHZW5lcmF0ZXMgYSByYW5kb20gbnVtYmVyIGFuZCByZXR1cm5zIGl0IGFzIGEgc3RyaW5nIGZvciBPQXV0aGVudGljYXRpb25cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gbm9uY2VfZ2VuZXJhdGUoKSB7XG4gICAgcmV0dXJuIChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxZTEyKS50b1N0cmluZygpKTtcbn1cblxudmFyIFlFTFBfQkFTRV9VUkwgPSAnaHR0cHM6Ly9hcGkueWVscC5jb20vdjIvc2VhcmNoPyc7XG5cblxudmFyIHllbHBfdXJsID0gWUVMUF9CQVNFX1VSTDtcblxudmFyIHBhcmFtZXRlcnMgPSB7XG4gICAgb2F1dGhfY29uc3VtZXJfa2V5OiAnUzgtOFRpYVBTY21Wd1N0dVIxR0FfUScsXG4gICAgb2F1dGhfdG9rZW46ICdVb0E3bTE4NTF5YU9zRnpzYkJnUU9saU1ER1Nlcl9HcycsXG4gICAgb2F1dGhfbm9uY2U6IG5vbmNlX2dlbmVyYXRlKCksXG4gICAgb2F1dGhfdGltZXN0YW1wOiBNYXRoLmZsb29yKERhdGUubm93KCkvMTAwMCksXG4gICAgb2F1dGhfc2lnbmF0dXJlX21ldGhvZDogJ0hNQUMtU0hBMScsXG4gICAgb2F1dGhfdmVyc2lvbiA6ICcxLjAnLFxuICAgIGNhbGxiYWNrOiAnY2InLCAvLyBUaGlzIGlzIGNydWNpYWwgdG8gaW5jbHVkZSBmb3IganNvbnAgaW1wbGVtZW50YXRpb24gaW4gQUpBWCBvciBlbHNlIHRoZSBvYXV0aC1zaWduYXR1cmUgd2lsbCBiZSB3cm9uZy5cbiAgICBsb2NhdGlvbjogJ0JpbGJhbytTcGFpbicsXG4gICAgdGVybTogJ2NhZmUgaXJ1bmEnLFxuICAgIGNsbDogJzQzLjI2MzIyNCxDLTIuOTM1MDAzJ1xufTtcblxudmFyIGVuY29kZWRTaWduYXR1cmUgPSBvYXV0aFNpZ25hdHVyZS5nZW5lcmF0ZSgnR0VUJyx5ZWxwX3VybCwgcGFyYW1ldGVycywgJ1BVYWRjVERwXzljMURoUkQ3cGtmcEU3UkRNaycsICdvdFBHelpELUJ4b3dObTdZeWxWekdWQjFDaVEnKTtcbnBhcmFtZXRlcnMub2F1dGhfc2lnbmF0dXJlID0gZW5jb2RlZFNpZ25hdHVyZTtcblxudmFyIHNldHRpbmdzID0ge1xuICAgIHVybDogeWVscF91cmwsXG4gICAgZGF0YTogcGFyYW1ldGVycyxcbiAgICBjYWNoZTogdHJ1ZSwgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBjcnVjaWFsIHRvIGluY2x1ZGUgYXMgd2VsbCB0byBwcmV2ZW50IGpRdWVyeSBmcm9tIGFkZGluZyBvbiBhIGNhY2hlLWJ1c3RlciBwYXJhbWV0ZXIgXCJfPTIzNDg5NDg5NzQ5ODM3XCIsIGludmFsaWRhdGluZyBvdXIgb2F1dGgtc2lnbmF0dXJlXG4gICAgZGF0YVR5cGU6ICdqc29ucCcsXG4gICAgc3VjY2VzczogZnVuY3Rpb24ocmVzdWx0cykge1xuICAgICAgY29uc29sZS5sb2cocmVzdWx0cyk7XG4gICAgfSxcbiAgICBmYWlsOiBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdmYWlsZWQhIScpO1xuICAgIH1cbn07XG5cbi8vIFNlbmQgQUpBWCBxdWVyeSB2aWEgalF1ZXJ5IGxpYnJhcnkuXG4kLmFqYXgoc2V0dGluZ3MpO1xuXG4vLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cblxudmFyIHBpbnMgPSB7XG4gICAgZGVmYXVsdDoge1xuICAgICAgICBwaW5JbWFnZSA6IG5ldyBnb29nbGUubWFwcy5NYXJrZXJJbWFnZShcImh0dHA6Ly9jaGFydC5hcGlzLmdvb2dsZS5jb20vY2hhcnQ/Y2hzdD1kX21hcF9waW5fbGV0dGVyJmNobGQ9JUUyJTgwJUEyfFwiICtcbiAgICAgICAgJ0REODg4OCcsXG4gICAgICAgIG5ldyBnb29nbGUubWFwcy5TaXplKDIxLCAzNCksXG4gICAgICAgIG5ldyBnb29nbGUubWFwcy5Qb2ludCgwLDApLFxuICAgICAgICBuZXcgZ29vZ2xlLm1hcHMuUG9pbnQoMTAsIDM0KSlcbiAgICB9LFxuICAgIGFjdGl2ZToge1xuICAgICAgICBwaW5JbWFnZSA6IG5ldyBnb29nbGUubWFwcy5NYXJrZXJJbWFnZShcImh0dHA6Ly9jaGFydC5hcGlzLmdvb2dsZS5jb20vY2hhcnQ/Y2hzdD1kX21hcF9waW5fbGV0dGVyJmNobGQ9JUUyJTgwJUEyfFwiICtcbiAgICAgICAgJ0FBRERERCcsXG4gICAgICAgIG5ldyBnb29nbGUubWFwcy5TaXplKDIxLCAzNCksXG4gICAgICAgIG5ldyBnb29nbGUubWFwcy5Qb2ludCgwLDApLFxuICAgICAgICBuZXcgZ29vZ2xlLm1hcHMuUG9pbnQoMTAsIDM0KSlcblxuICAgIH1cbn07XG5cbnZhciBuZWlnaGJvcmhvb2RNYXAgPSBmdW5jdGlvbigpe1xuICAgIHRoaXMubWFwRGl2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hcCcpO1xuICAgIHRoaXMuY2VudGVyTWFwID0ge2xhdDogNDMuMjYzMjI0LCBsbmc6IC0yLjkzNTAwM307XG4gICAgdGhpcy56b29tID0gMTU7XG4gICAgdGhpcy5tYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwKHRoaXMubWFwRGl2LCB7XG4gICAgICAgIHpvb206IHRoaXMuem9vbSxcbiAgICAgICAgY2VudGVyOiB0aGlzLmNlbnRlck1hcFxuICAgIH0pO1xufTtcblxuXG52YXIgTG9jYXRpb24gPSBmdW5jdGlvbihkYXRhKXtcbiAgICB0aGlzLm5hbWUgPSBkYXRhWyduYW1lJ107XG4gICAgdGhpcy5sYXQgPSBwYXJzZUZsb2F0KGRhdGFbJ2xvY2F0aW9uJ11bJ2xhdCddKTtcbiAgICB0aGlzLmxuZyA9IHBhcnNlRmxvYXQoZGF0YVsnbG9jYXRpb24nXVsnbG5nJ10pO1xuICAgIHRoaXMuZGlzcGxheSA9IGtvLm9ic2VydmFibGUoZGF0YVsnZGlzcGxheSddID09PSAndHJ1ZScpO1xuICAgIHRoaXMubWFya2VyID0gbnVsbDtcbiAgICB0aGlzLmFjdGl2ZSA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xufTtcblxudmFyIG15Vmlld01vZGVsID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgc2VsZi5sb2NhdGlvbnNMaXN0ID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcbiAgICBzZWxmLm15TWFwID0gbmV3IG5laWdoYm9yaG9vZE1hcCgpO1xuICAgIHNlbGYuY3VycmVudEZpbHRlciA9IGtvLm9ic2VydmFibGUoJycpO1xuXG4gICAgdmFyIGluZm9XaW5kb3cgPSBuZXcgZ29vZ2xlLm1hcHMuSW5mb1dpbmRvdyh7XG4gICAgICAgIGNvbnRlbnQ6IFwiSm9zZXBcIlxuICAgIH0pO1xuXG4gICAgdmFyIHN1YnNjcmlwdGlvbiA9IHNlbGYuY3VycmVudEZpbHRlci5zdWJzY3JpYmUoZnVuY3Rpb24obmV3VmFsdWUpe1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaTxzZWxmLmxvY2F0aW9uc0xpc3QoKS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgbG9jYXRpb25OYW1lID0gc2VsZi5sb2NhdGlvbnNMaXN0KClbaV0ubmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgdGFyZ2V0U3RyaW5nID0gbmV3VmFsdWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIGlmIChsb2NhdGlvbk5hbWUuaW5kZXhPZih0YXJnZXRTdHJpbmcpID09PSAtMSl7XG4gICAgICAgICAgICAgICAgc2VsZi5sb2NhdGlvbnNMaXN0KClbaV0uZGlzcGxheShmYWxzZSk7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXS5kaXNwbGF5KHRydWUpOyAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzZWxmLnJlZHJhd01hcmtlcnMoKTtcbiAgICB9KTtcblxuICAgIHNlbGYuaW5pdCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGxvY2F0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKGxvY2F0aW9uSXRlbSl7XG4gICAgICAgICAgICBzZWxmLmxvY2F0aW9uc0xpc3QucHVzaChuZXcgTG9jYXRpb24obG9jYXRpb25JdGVtKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBzZWxmLmRyYXdNYXJrZXJzKCk7XG4gICAgfTtcblxuICAgIHNlbGYuZHJhd01hcmtlcnMgPSBmdW5jdGlvbigpe1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpPCBzZWxmLmxvY2F0aW9uc0xpc3QoKS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50SXRlbS5kaXNwbGF5KCkgPT09IHRydWUpe1xuICAgICAgICAgICAgICAgIHNlbGYuYWRkTWFya2VyV2l0aEFuaW1hdGlvbihjdXJyZW50SXRlbSwgaSoyMDApO1xuICAgICAgICAgICAgfSBlbHNlIGlmKGN1cnJlbnRJdGVtLm1hcmtlciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlci5zZXRNYXAobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VsZi5yZWRyYXdNYXJrZXJzID0gZnVuY3Rpb24oKXtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaTwgc2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRJdGVtID0gc2VsZi5sb2NhdGlvbnNMaXN0KClbaV07XG4gICAgICAgICAgICBpZiAoY3VycmVudEl0ZW0uZGlzcGxheSgpID09PSB0cnVlKXtcbiAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIuc2V0TWFwKHNlbGYubXlNYXAubWFwKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZihjdXJyZW50SXRlbS5tYXJrZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIuc2V0TWFwKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYuY2xlYXJNYXJrZXJzID0gZnVuY3Rpb24oKXtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaTwgc2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRJdGVtID0gc2VsZi5sb2NhdGlvbnNMaXN0KClbaV07XG4gICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIuc2V0TWFwKG51bGwpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYuYWRkTWFya2VyV2l0aEFuaW1hdGlvbiA9IGZ1bmN0aW9uKGN1cnJlbnRJdGVtLCB0aW1lb3V0KXtcbiAgICAgICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7bGF0OiBjdXJyZW50SXRlbS5sYXQsIGxuZzogY3VycmVudEl0ZW0ubG5nfSxcbiAgICAgICAgICAgICAgICBhbmltYXRpb246IGdvb2dsZS5tYXBzLkFuaW1hdGlvbi5EUk9QLFxuICAgICAgICAgICAgICAgIGljb246IHBpbnMuZGVmYXVsdC5waW5JbWFnZSxcbiAgICAgICAgICAgICAgICBtYXA6IHNlbGYubXlNYXAubWFwXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlci5hZGRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHNlbGYuaW5hY3RpdmVBbGwoKTtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudE1hcmtlciA9IHRoaXM7XG4gICAgICAgICAgICAgICAgY3VycmVudEl0ZW0uYWN0aXZlKHRydWUpO1xuICAgICAgICAgICAgICAgIHNlbGYuYWN0aXZlQ29sb3IoY3VycmVudE1hcmtlcik7XG4gICAgICAgICAgICAgICAgc2VsZi5Cb3VuY2UoY3VycmVudE1hcmtlcik7XG4gICAgICAgICAgICAgICAgaW5mb1dpbmRvdy5vcGVuKHNlbGYubXlNYXAsIGN1cnJlbnRNYXJrZXIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIHRpbWVvdXQpO1xuICAgIH07XG5cbiAgICBzZWxmLmFjdGl2YXRlTWFya2VyID0gZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIG1hcmtlciA9IHRoaXMubWFya2VyO1xuICAgICAgICB2YXIgbG9jYXRpb24gPSB0aGlzO1xuICAgICAgICBzZWxmLmluYWN0aXZlQWxsKCk7XG4gICAgICAgIGxvY2F0aW9uLmFjdGl2ZSh0cnVlKTtcbiAgICAgICAgc2VsZi5hY3RpdmVDb2xvcihtYXJrZXIpO1xuICAgICAgICBzZWxmLkJvdW5jZShtYXJrZXIpO1xuICAgICAgICBpbmZvV2luZG93Lm9wZW4oc2VsZi5teU1hcCwgbWFya2VyKTtcbiAgICB9O1xuXG4gICAgc2VsZi5maW5kQ2xpY2tlZE1hcmtlciA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xuICAgIH1cblxuICAgIHNlbGYuQm91bmNlID0gZnVuY3Rpb24oY3VycmVudE1hcmtlcil7XG4gICAgICAgIC8vIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgaWYgKGN1cnJlbnRNYXJrZXIuZ2V0QW5pbWF0aW9uKCkgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGN1cnJlbnRNYXJrZXIuc2V0QW5pbWF0aW9uKG51bGwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3VycmVudE1hcmtlci5zZXRBbmltYXRpb24oZ29vZ2xlLm1hcHMuQW5pbWF0aW9uLkJPVU5DRSk7XG4gICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIGN1cnJlbnRNYXJrZXIuc2V0QW5pbWF0aW9uKG51bGwpO1xuICAgICAgICAgICAgfSw3MDApO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYuYWN0aXZlQ29sb3IgPSBmdW5jdGlvbihjdXJyZW50TWFya2VyKXtcbiAgICAgICAgY3VycmVudE1hcmtlci5zZXRJY29uKHBpbnMuYWN0aXZlLnBpbkltYWdlKTtcbiAgICB9O1xuXG4gICAgc2VsZi5kZWZhdWx0Q29sb3IgPSBmdW5jdGlvbihjdXJyZW50TWFya2VyKXtcbiAgICAgICAgY3VycmVudE1hcmtlci5zZXRJY29uKHBpbnMuZGVmYXVsdC5waW5JbWFnZSk7XG4gICAgfTtcblxuICAgIHNlbGYuaW5hY3RpdmVBbGwgPSBmdW5jdGlvbigpe1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpPCBzZWxmLmxvY2F0aW9uc0xpc3QoKS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgIGN1cnJlbnRJdGVtLmFjdGl2ZShmYWxzZSk7XG4gICAgICAgICAgICBzZWxmLmRlZmF1bHRDb2xvcihjdXJyZW50SXRlbS5tYXJrZXIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYuZGVmYXVsdENvbG9yQWxsID0gZnVuY3Rpb24oKXtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaTwgc2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRJdGVtID0gc2VsZi5sb2NhdGlvbnNMaXN0KClbaV07XG4gICAgICAgICAgICBzZWxmLmRlZmF1bHRDb2xvcihjdXJyZW50SXRlbS5tYXJrZXIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYuaW5pdCgpO1xufTtcblxuXG4gICAga28uYXBwbHlCaW5kaW5ncyhuZXcgbXlWaWV3TW9kZWwpO1xufTtcblxuZnVuY3Rpb24gZ29vZ2xlU3VjY2Vzcygpe1xuICAgIGluaXRpYXRlVmlldygpO1xufTtcblxuZnVuY3Rpb24gZ29vZ2xlRXJyb3IoKXtcbiAgICAkKCdib2R5JykuaHRtbCgnJyk7XG4gICAgJCgnYm9keScpLmFwcGVuZChcIjxoMT5UaGVyZSB3YXMgYW4gZXJyb3IgbG9hZGluZyBHb29nbGUgTWFwcy4gUGxlYXNlIHRyeSBhZ2FpbiBpbiAxMCBob3Vycy48L2gxPlwiKTtcbn07XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
