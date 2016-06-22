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
