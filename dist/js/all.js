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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYWxsLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGxvY2F0aW9ucyA9IFtcbiAgICB7XG4gICAgICAgICduYW1lJzogJ3BsYWNlIDEnLFxuICAgICAgICAnbG9jYXRpb24nOiB7XG4gICAgICAgICAgICAnbGF0JzogJzQzLjI2ODIyNCcsXG4gICAgICAgICAgICAnbG5nJzogJy0yLjkzODAwMydcbiAgICAgICAgfSxcbiAgICAgICAgJ2Rpc3BsYXknOiAndHJ1ZSdcbiAgICB9LFxuICAgIHtcbiAgICAgICAgJ25hbWUnOiAncGxhY2UgMicsXG4gICAgICAgICdsb2NhdGlvbic6IHtcbiAgICAgICAgICAgICdsYXQnOiAnNDMuMjY5MjI0JyxcbiAgICAgICAgICAgICdsbmcnOiAnLTIuOTM1MDAzJ1xuICAgICAgICB9LFxuICAgICAgICAnZGlzcGxheSc6ICd0cnVlJ1xuICAgIH0sXG4gICAge1xuICAgICAgICAnbmFtZSc6ICdwbGFjZSAzJyxcbiAgICAgICAgJ2xvY2F0aW9uJzoge1xuICAgICAgICAgICAgJ2xhdCc6ICc0My4yNjMyMjQnLFxuICAgICAgICAgICAgJ2xuZyc6ICctMi45MzcwMDMnXG4gICAgICAgIH0sXG4gICAgICAgICdkaXNwbGF5JzogJ3RydWUnXG4gICAgfSxcbiAgICB7XG4gICAgICAgICduYW1lJzogJ3BsYWNlIDQnLFxuICAgICAgICAnbG9jYXRpb24nOiB7XG4gICAgICAgICAgICAnbGF0JzogJzQzLjI2MTIyNCcsXG4gICAgICAgICAgICAnbG5nJzogJy0yLjkzOTAwMydcbiAgICAgICAgfSxcbiAgICAgICAgJ2Rpc3BsYXknOiAndHJ1ZSdcbiAgICB9LFxuICAgIHtcbiAgICAgICAgJ25hbWUnOiAncGxhY2UgNScsXG4gICAgICAgICdsb2NhdGlvbic6IHtcbiAgICAgICAgICAgICdsYXQnOiAnNDMuMjYyMjI0JyxcbiAgICAgICAgICAgICdsbmcnOiAnLTIuOTMyMDAzJ1xuICAgICAgICB9LFxuICAgICAgICAnZGlzcGxheSc6ICd0cnVlJ1xuICAgIH1cbl07XG5cbnZhciBuZWlnaGJvcmhvb2RNYXAgPSBmdW5jdGlvbigpe1xuICAgIHRoaXMubWFwRGl2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hcCcpO1xuICAgIHRoaXMuY2VudGVyTWFwID0ge2xhdDogNDMuMjYzMjI0LCBsbmc6IC0yLjkzNTAwM307XG4gICAgdGhpcy56b29tID0gMTU7XG4gICAgdGhpcy5tYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwKHRoaXMubWFwRGl2LCB7XG4gICAgICAgIHpvb206IHRoaXMuem9vbSxcbiAgICAgICAgY2VudGVyOiB0aGlzLmNlbnRlck1hcFxuICAgIH0pO1xufTtcblxudmFyIExvY2F0aW9uID0gZnVuY3Rpb24oZGF0YSl7XG4gICAgdGhpcy5uYW1lID0gZGF0YVsnbmFtZSddO1xuICAgIHRoaXMubGF0ID0gcGFyc2VGbG9hdChkYXRhWydsb2NhdGlvbiddWydsYXQnXSk7XG4gICAgdGhpcy5sbmcgPSBwYXJzZUZsb2F0KGRhdGFbJ2xvY2F0aW9uJ11bJ2xuZyddKTtcbiAgICB0aGlzLmRpc3BsYXkgPSBrby5vYnNlcnZhYmxlKGRhdGFbJ2Rpc3BsYXknXSA9PT0gJ3RydWUnKTtcbiAgICB0aGlzLm1hcmtlciA9IG51bGw7XG59O1xuXG52YXIgbXlWaWV3TW9kZWwgPSBmdW5jdGlvbigpe1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBzZWxmLmxvY2F0aW9uc0xpc3QgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xuICAgIHNlbGYubXlNYXAgPSBuZXcgbmVpZ2hib3Job29kTWFwKCk7XG4gICAgc2VsZi5pbml0ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgbG9jYXRpb25zLmZvckVhY2goZnVuY3Rpb24obG9jYXRpb25JdGVtKXtcbiAgICAgICAgICAgIHNlbGYubG9jYXRpb25zTGlzdC5wdXNoKG5ldyBMb2NhdGlvbihsb2NhdGlvbkl0ZW0pKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHNlbGYuZHJhd01hcmtlcnMoKTtcbiAgICB9O1xuICAgIHNlbGYuZHJhd01hcmtlcnMgPSBmdW5jdGlvbigpe1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpPCBzZWxmLmxvY2F0aW9uc0xpc3QoKS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50SXRlbS5kaXNwbGF5KCkgPT09IHRydWUpe1xuICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjoge2xhdDogY3VycmVudEl0ZW0ubGF0LCBsbmc6IGN1cnJlbnRJdGVtLmxuZ30sXG4gICAgICAgICAgICAgICAgICAgIG1hcDogc2VsZi5teU1hcC5tYXBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZihjdXJyZW50SXRlbS5tYXJrZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlci5zZXRNYXAobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHNlbGYuaW5pdCgpO1xufTtcblxuXG5rby5hcHBseUJpbmRpbmdzKG5ldyBteVZpZXdNb2RlbCk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
