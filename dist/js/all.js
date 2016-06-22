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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFsbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIGluaXRpYXRlVmlldygpe1xudmFyIGxvY2F0aW9ucyA9IFtcbiAgICB7XG4gICAgICAgICduYW1lJzogJ0VsIEdsb2JvJyxcbiAgICAgICAgJ2xvY2F0aW9uJzoge1xuICAgICAgICAgICAgJ2xhdCc6ICc0My4yNjE4NDM2OTI2MDAzJyxcbiAgICAgICAgICAgICdsbmcnOiAnLTIuOTMyNjIxMzg5MTYzMTYnXG4gICAgICAgIH0sXG4gICAgICAgICdkaXNwbGF5JzogJ3RydWUnXG4gICAgfSxcbiAgICB7XG4gICAgICAgICduYW1lJzogJ0V0eGFub2JlJyxcbiAgICAgICAgJ2xvY2F0aW9uJzoge1xuICAgICAgICAgICAgJ2xhdCc6ICc0My4yNjg1NTA5JyxcbiAgICAgICAgICAgICdsbmcnOiAnLTIuOTM1MzQ4NydcbiAgICAgICAgfSxcbiAgICAgICAgJ2Rpc3BsYXknOiAndHJ1ZSdcbiAgICB9LFxuICAgIHtcbiAgICAgICAgJ25hbWUnOiAnQ2FmZSBJcnXDsWEnLFxuICAgICAgICAnbG9jYXRpb24nOiB7XG4gICAgICAgICAgICAnbGF0JzogJzQzLjI2MjM3MTEnLFxuICAgICAgICAgICAgJ2xuZyc6ICctMi45MjgwMydcbiAgICAgICAgfSxcbiAgICAgICAgJ2Rpc3BsYXknOiAndHJ1ZSdcbiAgICB9LFxuICAgIHtcbiAgICAgICAgJ25hbWUnOiAnR3VyZSBUb2tpJyxcbiAgICAgICAgJ2xvY2F0aW9uJzoge1xuICAgICAgICAgICAgJ2xhdCc6ICc0My4yNTkzODU4ODY5OTI1JyxcbiAgICAgICAgICAgICdsbmcnOiAnLTIuOTIyMzg0Nzc5NDU4MDcnXG4gICAgICAgIH0sXG4gICAgICAgICdkaXNwbGF5JzogJ3RydWUnXG4gICAgfSxcbiAgICB7XG4gICAgICAgICduYW1lJzogJ1N1bW8gQmlsYmFvJyxcbiAgICAgICAgJ2xvY2F0aW9uJzoge1xuICAgICAgICAgICAgJ2xhdCc6ICc0My4yNjIwNDEnLFxuICAgICAgICAgICAgJ2xuZyc6ICctMi45Mjc5MDMnXG4gICAgICAgIH0sXG4gICAgICAgICdkaXNwbGF5JzogJ3RydWUnXG4gICAgfVxuXTtcblxuLy8gVE8gRE86IElOVEVHUkFURSBXSVRIIFlFTFAgQVBJXG4vKipcbiAqIEdlbmVyYXRlcyBhIHJhbmRvbSBudW1iZXIgYW5kIHJldHVybnMgaXQgYXMgYSBzdHJpbmcgZm9yIE9BdXRoZW50aWNhdGlvblxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBub25jZV9nZW5lcmF0ZSgpIHtcbiAgICByZXR1cm4gKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDFlMTIpLnRvU3RyaW5nKCkpO1xufVxuXG52YXIgWUVMUF9CQVNFX1VSTCA9ICdodHRwczovL2FwaS55ZWxwLmNvbS92Mi9zZWFyY2g/JztcblxuXG52YXIgeWVscF91cmwgPSBZRUxQX0JBU0VfVVJMO1xuXG52YXIgcGFyYW1ldGVycyA9IHtcbiAgICBvYXV0aF9jb25zdW1lcl9rZXk6ICdTOC04VGlhUFNjbVZ3U3R1UjFHQV9RJyxcbiAgICBvYXV0aF90b2tlbjogJ1VvQTdtMTg1MXlhT3NGenNiQmdRT2xpTURHU2VyX0dzJyxcbiAgICBvYXV0aF9ub25jZTogbm9uY2VfZ2VuZXJhdGUoKSxcbiAgICBvYXV0aF90aW1lc3RhbXA6IE1hdGguZmxvb3IoRGF0ZS5ub3coKS8xMDAwKSxcbiAgICBvYXV0aF9zaWduYXR1cmVfbWV0aG9kOiAnSE1BQy1TSEExJyxcbiAgICBvYXV0aF92ZXJzaW9uIDogJzEuMCcsXG4gICAgY2FsbGJhY2s6ICdjYicsIC8vIFRoaXMgaXMgY3J1Y2lhbCB0byBpbmNsdWRlIGZvciBqc29ucCBpbXBsZW1lbnRhdGlvbiBpbiBBSkFYIG9yIGVsc2UgdGhlIG9hdXRoLXNpZ25hdHVyZSB3aWxsIGJlIHdyb25nLlxuICAgIGxvY2F0aW9uOiAnQmlsYmFvK1NwYWluJyxcbiAgICB0ZXJtOiAnY2FmZSBpcnVuYScsXG4gICAgY2xsOiAnNDMuMjYzMjI0LEMtMi45MzUwMDMnXG59O1xuXG52YXIgZW5jb2RlZFNpZ25hdHVyZSA9IG9hdXRoU2lnbmF0dXJlLmdlbmVyYXRlKCdHRVQnLHllbHBfdXJsLCBwYXJhbWV0ZXJzLCAnUFVhZGNURHBfOWMxRGhSRDdwa2ZwRTdSRE1rJywgJ290UEd6WkQtQnhvd05tN1l5bFZ6R1ZCMUNpUScpO1xucGFyYW1ldGVycy5vYXV0aF9zaWduYXR1cmUgPSBlbmNvZGVkU2lnbmF0dXJlO1xuXG52YXIgc2V0dGluZ3MgPSB7XG4gICAgdXJsOiB5ZWxwX3VybCxcbiAgICBkYXRhOiBwYXJhbWV0ZXJzLFxuICAgIGNhY2hlOiB0cnVlLCAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGNydWNpYWwgdG8gaW5jbHVkZSBhcyB3ZWxsIHRvIHByZXZlbnQgalF1ZXJ5IGZyb20gYWRkaW5nIG9uIGEgY2FjaGUtYnVzdGVyIHBhcmFtZXRlciBcIl89MjM0ODk0ODk3NDk4MzdcIiwgaW52YWxpZGF0aW5nIG91ciBvYXV0aC1zaWduYXR1cmVcbiAgICBkYXRhVHlwZTogJ2pzb25wJyxcbiAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXN1bHRzKSB7XG4gICAgICBjb25zb2xlLmxvZyhyZXN1bHRzKTtcbiAgICB9LFxuICAgIGZhaWw6IGZ1bmN0aW9uKCkge1xuICAgICAgY29uc29sZS5sb2coJ2ZhaWxlZCEhJyk7XG4gICAgfVxufTtcblxuLy8gU2VuZCBBSkFYIHF1ZXJ5IHZpYSBqUXVlcnkgbGlicmFyeS5cbiQuYWpheChzZXR0aW5ncyk7XG5cbi8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcblxuXG52YXIgcGlucyA9IHtcbiAgICBkZWZhdWx0OiB7XG4gICAgICAgIHBpbkltYWdlIDogbmV3IGdvb2dsZS5tYXBzLk1hcmtlckltYWdlKFwiaHR0cDovL2NoYXJ0LmFwaXMuZ29vZ2xlLmNvbS9jaGFydD9jaHN0PWRfbWFwX3Bpbl9sZXR0ZXImY2hsZD0lRTIlODAlQTJ8XCIgK1xuICAgICAgICAnREQ4ODg4JyxcbiAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlNpemUoMjEsIDM0KSxcbiAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlBvaW50KDAsMCksXG4gICAgICAgIG5ldyBnb29nbGUubWFwcy5Qb2ludCgxMCwgMzQpKVxuICAgIH0sXG4gICAgYWN0aXZlOiB7XG4gICAgICAgIHBpbkltYWdlIDogbmV3IGdvb2dsZS5tYXBzLk1hcmtlckltYWdlKFwiaHR0cDovL2NoYXJ0LmFwaXMuZ29vZ2xlLmNvbS9jaGFydD9jaHN0PWRfbWFwX3Bpbl9sZXR0ZXImY2hsZD0lRTIlODAlQTJ8XCIgK1xuICAgICAgICAnQUFEREREJyxcbiAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlNpemUoMjEsIDM0KSxcbiAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlBvaW50KDAsMCksXG4gICAgICAgIG5ldyBnb29nbGUubWFwcy5Qb2ludCgxMCwgMzQpKVxuXG4gICAgfVxufTtcblxudmFyIG5laWdoYm9yaG9vZE1hcCA9IGZ1bmN0aW9uKCl7XG4gICAgdGhpcy5tYXBEaXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwJyk7XG4gICAgdGhpcy5jZW50ZXJNYXAgPSB7bGF0OiA0My4yNjMyMjQsIGxuZzogLTIuOTM1MDAzfTtcbiAgICB0aGlzLnpvb20gPSAxNTtcbiAgICB0aGlzLm1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAodGhpcy5tYXBEaXYsIHtcbiAgICAgICAgem9vbTogdGhpcy56b29tLFxuICAgICAgICBjZW50ZXI6IHRoaXMuY2VudGVyTWFwXG4gICAgfSk7XG59O1xuXG5cbnZhciBMb2NhdGlvbiA9IGZ1bmN0aW9uKGRhdGEpe1xuICAgIHRoaXMubmFtZSA9IGRhdGFbJ25hbWUnXTtcbiAgICB0aGlzLmxhdCA9IHBhcnNlRmxvYXQoZGF0YVsnbG9jYXRpb24nXVsnbGF0J10pO1xuICAgIHRoaXMubG5nID0gcGFyc2VGbG9hdChkYXRhWydsb2NhdGlvbiddWydsbmcnXSk7XG4gICAgdGhpcy5kaXNwbGF5ID0ga28ub2JzZXJ2YWJsZShkYXRhWydkaXNwbGF5J10gPT09ICd0cnVlJyk7XG4gICAgdGhpcy5tYXJrZXIgPSBudWxsO1xuICAgIHRoaXMuYWN0aXZlID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG59O1xuXG52YXIgbXlWaWV3TW9kZWwgPSBmdW5jdGlvbigpe1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBzZWxmLmxvY2F0aW9uc0xpc3QgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xuICAgIHNlbGYubXlNYXAgPSBuZXcgbmVpZ2hib3Job29kTWFwKCk7XG4gICAgc2VsZi5jdXJyZW50RmlsdGVyID0ga28ub2JzZXJ2YWJsZSgnJyk7XG5cbiAgICB2YXIgaW5mb1dpbmRvdyA9IG5ldyBnb29nbGUubWFwcy5JbmZvV2luZG93KHtcbiAgICAgICAgY29udGVudDogXCJKb3NlcFwiXG4gICAgfSk7XG5cbiAgICB2YXIgc3Vic2NyaXB0aW9uID0gc2VsZi5jdXJyZW50RmlsdGVyLnN1YnNjcmliZShmdW5jdGlvbihuZXdWYWx1ZSl7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpPHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIHZhciBsb2NhdGlvbk5hbWUgPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXS5uYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB0YXJnZXRTdHJpbmcgPSBuZXdWYWx1ZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgaWYgKGxvY2F0aW9uTmFtZS5pbmRleE9mKHRhcmdldFN0cmluZykgPT09IC0xKXtcbiAgICAgICAgICAgICAgICBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXS5kaXNwbGF5KGZhbHNlKTtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIHNlbGYubG9jYXRpb25zTGlzdCgpW2ldLmRpc3BsYXkodHJ1ZSk7ICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHNlbGYucmVkcmF3TWFya2VycygpO1xuICAgIH0pO1xuXG4gICAgc2VsZi5pbml0ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgbG9jYXRpb25zLmZvckVhY2goZnVuY3Rpb24obG9jYXRpb25JdGVtKXtcbiAgICAgICAgICAgIHNlbGYubG9jYXRpb25zTGlzdC5wdXNoKG5ldyBMb2NhdGlvbihsb2NhdGlvbkl0ZW0pKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHNlbGYuZHJhd01hcmtlcnMoKTtcbiAgICB9O1xuXG4gICAgc2VsZi5kcmF3TWFya2VycyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGk8IHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIHZhciBjdXJyZW50SXRlbSA9IHNlbGYubG9jYXRpb25zTGlzdCgpW2ldO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRJdGVtLmRpc3BsYXkoKSA9PT0gdHJ1ZSl7XG4gICAgICAgICAgICAgICAgc2VsZi5hZGRNYXJrZXJXaXRoQW5pbWF0aW9uKGN1cnJlbnRJdGVtLCBpKjIwMCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYoY3VycmVudEl0ZW0ubWFya2VyICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudEl0ZW0ubWFya2VyLnNldE1hcChudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBzZWxmLnJlZHJhd01hcmtlcnMgPSBmdW5jdGlvbigpe1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpPCBzZWxmLmxvY2F0aW9uc0xpc3QoKS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50SXRlbS5kaXNwbGF5KCkgPT09IHRydWUpe1xuICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlci5zZXRNYXAoc2VsZi5teU1hcC5tYXApO1xuICAgICAgICAgICAgfSBlbHNlIGlmKGN1cnJlbnRJdGVtLm1hcmtlciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlci5zZXRNYXAobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VsZi5jbGVhck1hcmtlcnMgPSBmdW5jdGlvbigpe1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpPCBzZWxmLmxvY2F0aW9uc0xpc3QoKS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlci5zZXRNYXAobnVsbCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VsZi5hZGRNYXJrZXJXaXRoQW5pbWF0aW9uID0gZnVuY3Rpb24oY3VycmVudEl0ZW0sIHRpbWVvdXQpe1xuICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgY3VycmVudEl0ZW0ubWFya2VyID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcih7XG4gICAgICAgICAgICAgICAgcG9zaXRpb246IHtsYXQ6IGN1cnJlbnRJdGVtLmxhdCwgbG5nOiBjdXJyZW50SXRlbS5sbmd9LFxuICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogZ29vZ2xlLm1hcHMuQW5pbWF0aW9uLkRST1AsXG4gICAgICAgICAgICAgICAgaWNvbjogcGlucy5kZWZhdWx0LnBpbkltYWdlLFxuICAgICAgICAgICAgICAgIG1hcDogc2VsZi5teU1hcC5tYXBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY3VycmVudEl0ZW0ubWFya2VyLmFkZExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgc2VsZi5pbmFjdGl2ZUFsbCgpO1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50TWFya2VyID0gdGhpcztcbiAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5hY3RpdmUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgc2VsZi5hY3RpdmVDb2xvcihjdXJyZW50TWFya2VyKTtcbiAgICAgICAgICAgICAgICBzZWxmLkJvdW5jZShjdXJyZW50TWFya2VyKTtcbiAgICAgICAgICAgICAgICBpbmZvV2luZG93Lm9wZW4oc2VsZi5teU1hcCwgY3VycmVudE1hcmtlcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgdGltZW91dCk7XG4gICAgfTtcblxuICAgIHNlbGYuYWN0aXZhdGVNYXJrZXIgPSBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgbWFya2VyID0gdGhpcy5tYXJrZXI7XG4gICAgICAgIHZhciBsb2NhdGlvbiA9IHRoaXM7XG4gICAgICAgIHNlbGYuaW5hY3RpdmVBbGwoKTtcbiAgICAgICAgbG9jYXRpb24uYWN0aXZlKHRydWUpO1xuICAgICAgICBzZWxmLmFjdGl2ZUNvbG9yKG1hcmtlcik7XG4gICAgICAgIHNlbGYuQm91bmNlKG1hcmtlcik7XG4gICAgICAgIGluZm9XaW5kb3cub3BlbihzZWxmLm15TWFwLCBtYXJrZXIpO1xuICAgIH07XG5cbiAgICBzZWxmLmZpbmRDbGlja2VkTWFya2VyID0gZnVuY3Rpb24oKXtcbiAgICAgICAgY29uc29sZS5sb2codGhpcyk7XG4gICAgfVxuXG4gICAgc2VsZi5Cb3VuY2UgPSBmdW5jdGlvbihjdXJyZW50TWFya2VyKXtcbiAgICAgICAgLy8gdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBpZiAoY3VycmVudE1hcmtlci5nZXRBbmltYXRpb24oKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgY3VycmVudE1hcmtlci5zZXRBbmltYXRpb24obnVsbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdXJyZW50TWFya2VyLnNldEFuaW1hdGlvbihnb29nbGUubWFwcy5BbmltYXRpb24uQk9VTkNFKTtcbiAgICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgY3VycmVudE1hcmtlci5zZXRBbmltYXRpb24obnVsbCk7XG4gICAgICAgICAgICB9LDcwMCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VsZi5hY3RpdmVDb2xvciA9IGZ1bmN0aW9uKGN1cnJlbnRNYXJrZXIpe1xuICAgICAgICBjdXJyZW50TWFya2VyLnNldEljb24ocGlucy5hY3RpdmUucGluSW1hZ2UpO1xuICAgIH07XG5cbiAgICBzZWxmLmRlZmF1bHRDb2xvciA9IGZ1bmN0aW9uKGN1cnJlbnRNYXJrZXIpe1xuICAgICAgICBjdXJyZW50TWFya2VyLnNldEljb24ocGlucy5kZWZhdWx0LnBpbkltYWdlKTtcbiAgICB9O1xuXG4gICAgc2VsZi5pbmFjdGl2ZUFsbCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGk8IHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIHZhciBjdXJyZW50SXRlbSA9IHNlbGYubG9jYXRpb25zTGlzdCgpW2ldO1xuICAgICAgICAgICAgY3VycmVudEl0ZW0uYWN0aXZlKGZhbHNlKTtcbiAgICAgICAgICAgIHNlbGYuZGVmYXVsdENvbG9yKGN1cnJlbnRJdGVtLm1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VsZi5kZWZhdWx0Q29sb3JBbGwgPSBmdW5jdGlvbigpe1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpPCBzZWxmLmxvY2F0aW9uc0xpc3QoKS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgIHNlbGYuZGVmYXVsdENvbG9yKGN1cnJlbnRJdGVtLm1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICBzZWxmLmluaXQoKTtcbn07XG5cblxuICAgIGtvLmFwcGx5QmluZGluZ3MobmV3IG15Vmlld01vZGVsKTtcbn07XG5cbmZ1bmN0aW9uIGdvb2dsZVN1Y2Nlc3MoKXtcbiAgICBpbml0aWF0ZVZpZXcoKTtcbn07XG5cbmZ1bmN0aW9uIGdvb2dsZUVycm9yKCl7XG4gICAgJCgnYm9keScpLmh0bWwoJycpO1xuICAgICQoJ2JvZHknKS5hcHBlbmQoXCI8aDE+VGhlcmUgd2FzIGFuIGVycm9yIGxvYWRpbmcgR29vZ2xlIE1hcHMuIFBsZWFzZSB0cnkgYWdhaW4gaW4gMTAgaG91cnMuPC9oMT5cIik7XG59O1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
