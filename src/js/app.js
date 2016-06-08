var locations = [
    {
        'name': 'place 1',
        'location': {
            'lat': '43.268224',
            'lng': '-2.938003'
        },
        'display': 'true'
    },
    {
        'name': 'place 2',
        'location': {
            'lat': '43.269224',
            'lng': '-2.935003'
        },
        'display': 'true'
    },
    {
        'name': 'place 3',
        'location': {
            'lat': '43.263224',
            'lng': '-2.937003'
        },
        'display': 'true'
    },
    {
        'name': 'place 4',
        'location': {
            'lat': '43.261224',
            'lng': '-2.939003'
        },
        'display': 'true'
    },
    {
        'name': 'place 5',
        'location': {
            'lat': '43.262224',
            'lng': '-2.932003'
        },
        'display': 'true'
    }
];

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
};

var myViewModel = function(){
    var self = this;
    self.locationsList = ko.observableArray([]);
    self.myMap = new neighborhoodMap();
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
                currentItem.marker = new google.maps.Marker({
                    position: {lat: currentItem.lat, lng: currentItem.lng},
                    map: self.myMap.map
                });
            } else if(currentItem.marker != null) {
                currentItem.marker.setMap(null);
            }
        }
    };
    self.init();
};


ko.applyBindings(new myViewModel);
