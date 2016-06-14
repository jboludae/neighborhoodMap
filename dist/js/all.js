var locations = [
    {
        'name': 'Grocery 2',
        'location': {
            'lat': '43.268224',
            'lng': '-2.938003'
        },
        'display': 'true'
    },
    {
        'name': 'panaderia 34',
        'location': {
            'lat': '43.269224',
            'lng': '-2.935003'
        },
        'display': 'true'
    },
    {
        'name': 'copisteria',
        'location': {
            'lat': '43.263224',
            'lng': '-2.937003'
        },
        'display': 'true'
    },
    {
        'name': 'Alpargatas Javier',
        'location': {
            'lat': '43.261224',
            'lng': '-2.935003'
        },
        'display': 'true'
    },
    {
        'name': 'Cocinas melon',
        'location': {
            'lat': '43.262224',
            'lng': '-2.932003'
        },
        'display': 'true'
    }
];


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
            currentItem.marker.addListener('click', self.animateMarker);
        }, timeout);
    };

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

    self.animateMarker = function(){
        var currentMarker = this;
        self.defaultColorAll();
        self.activeColor(currentMarker);
        self.Bounce(currentMarker);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFsbC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBsb2NhdGlvbnMgPSBbXG4gICAge1xuICAgICAgICAnbmFtZSc6ICdHcm9jZXJ5IDInLFxuICAgICAgICAnbG9jYXRpb24nOiB7XG4gICAgICAgICAgICAnbGF0JzogJzQzLjI2ODIyNCcsXG4gICAgICAgICAgICAnbG5nJzogJy0yLjkzODAwMydcbiAgICAgICAgfSxcbiAgICAgICAgJ2Rpc3BsYXknOiAndHJ1ZSdcbiAgICB9LFxuICAgIHtcbiAgICAgICAgJ25hbWUnOiAncGFuYWRlcmlhIDM0JyxcbiAgICAgICAgJ2xvY2F0aW9uJzoge1xuICAgICAgICAgICAgJ2xhdCc6ICc0My4yNjkyMjQnLFxuICAgICAgICAgICAgJ2xuZyc6ICctMi45MzUwMDMnXG4gICAgICAgIH0sXG4gICAgICAgICdkaXNwbGF5JzogJ3RydWUnXG4gICAgfSxcbiAgICB7XG4gICAgICAgICduYW1lJzogJ2NvcGlzdGVyaWEnLFxuICAgICAgICAnbG9jYXRpb24nOiB7XG4gICAgICAgICAgICAnbGF0JzogJzQzLjI2MzIyNCcsXG4gICAgICAgICAgICAnbG5nJzogJy0yLjkzNzAwMydcbiAgICAgICAgfSxcbiAgICAgICAgJ2Rpc3BsYXknOiAndHJ1ZSdcbiAgICB9LFxuICAgIHtcbiAgICAgICAgJ25hbWUnOiAnQWxwYXJnYXRhcyBKYXZpZXInLFxuICAgICAgICAnbG9jYXRpb24nOiB7XG4gICAgICAgICAgICAnbGF0JzogJzQzLjI2MTIyNCcsXG4gICAgICAgICAgICAnbG5nJzogJy0yLjkzNTAwMydcbiAgICAgICAgfSxcbiAgICAgICAgJ2Rpc3BsYXknOiAndHJ1ZSdcbiAgICB9LFxuICAgIHtcbiAgICAgICAgJ25hbWUnOiAnQ29jaW5hcyBtZWxvbicsXG4gICAgICAgICdsb2NhdGlvbic6IHtcbiAgICAgICAgICAgICdsYXQnOiAnNDMuMjYyMjI0JyxcbiAgICAgICAgICAgICdsbmcnOiAnLTIuOTMyMDAzJ1xuICAgICAgICB9LFxuICAgICAgICAnZGlzcGxheSc6ICd0cnVlJ1xuICAgIH1cbl07XG5cblxudmFyIHBpbnMgPSB7XG4gICAgZGVmYXVsdDoge1xuICAgICAgICBwaW5JbWFnZSA6IG5ldyBnb29nbGUubWFwcy5NYXJrZXJJbWFnZShcImh0dHA6Ly9jaGFydC5hcGlzLmdvb2dsZS5jb20vY2hhcnQ/Y2hzdD1kX21hcF9waW5fbGV0dGVyJmNobGQ9JUUyJTgwJUEyfFwiICtcbiAgICAgICAgJ0REODg4OCcsXG4gICAgICAgIG5ldyBnb29nbGUubWFwcy5TaXplKDIxLCAzNCksXG4gICAgICAgIG5ldyBnb29nbGUubWFwcy5Qb2ludCgwLDApLFxuICAgICAgICBuZXcgZ29vZ2xlLm1hcHMuUG9pbnQoMTAsIDM0KSlcbiAgICB9LFxuICAgIGFjdGl2ZToge1xuICAgICAgICBwaW5JbWFnZSA6IG5ldyBnb29nbGUubWFwcy5NYXJrZXJJbWFnZShcImh0dHA6Ly9jaGFydC5hcGlzLmdvb2dsZS5jb20vY2hhcnQ/Y2hzdD1kX21hcF9waW5fbGV0dGVyJmNobGQ9JUUyJTgwJUEyfFwiICtcbiAgICAgICAgJ0FBRERERCcsXG4gICAgICAgIG5ldyBnb29nbGUubWFwcy5TaXplKDIxLCAzNCksXG4gICAgICAgIG5ldyBnb29nbGUubWFwcy5Qb2ludCgwLDApLFxuICAgICAgICBuZXcgZ29vZ2xlLm1hcHMuUG9pbnQoMTAsIDM0KSlcblxuICAgIH1cbn07XG5cbnZhciBuZWlnaGJvcmhvb2RNYXAgPSBmdW5jdGlvbigpe1xuICAgIHRoaXMubWFwRGl2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hcCcpO1xuICAgIHRoaXMuY2VudGVyTWFwID0ge2xhdDogNDMuMjYzMjI0LCBsbmc6IC0yLjkzNTAwM307XG4gICAgdGhpcy56b29tID0gMTU7XG4gICAgdGhpcy5tYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwKHRoaXMubWFwRGl2LCB7XG4gICAgICAgIHpvb206IHRoaXMuem9vbSxcbiAgICAgICAgY2VudGVyOiB0aGlzLmNlbnRlck1hcFxuICAgIH0pO1xufTtcblxudmFyIExvY2F0aW9uID0gZnVuY3Rpb24oZGF0YSl7XG4gICAgdGhpcy5uYW1lID0gZGF0YVsnbmFtZSddO1xuICAgIHRoaXMubGF0ID0gcGFyc2VGbG9hdChkYXRhWydsb2NhdGlvbiddWydsYXQnXSk7XG4gICAgdGhpcy5sbmcgPSBwYXJzZUZsb2F0KGRhdGFbJ2xvY2F0aW9uJ11bJ2xuZyddKTtcbiAgICB0aGlzLmRpc3BsYXkgPSBrby5vYnNlcnZhYmxlKGRhdGFbJ2Rpc3BsYXknXSA9PT0gJ3RydWUnKTtcbiAgICB0aGlzLm1hcmtlciA9IG51bGw7XG4gICAgdGhpcy5hY3RpdmUgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcbn07XG5cbnZhciBteVZpZXdNb2RlbCA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHNlbGYubG9jYXRpb25zTGlzdCA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XG4gICAgc2VsZi5teU1hcCA9IG5ldyBuZWlnaGJvcmhvb2RNYXAoKTtcbiAgICBzZWxmLmN1cnJlbnRGaWx0ZXIgPSBrby5vYnNlcnZhYmxlKCcnKTtcblxuICAgIHZhciBzdWJzY3JpcHRpb24gPSBzZWxmLmN1cnJlbnRGaWx0ZXIuc3Vic2NyaWJlKGZ1bmN0aW9uKG5ld1ZhbHVlKXtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGk8c2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIGxvY2F0aW9uTmFtZSA9IHNlbGYubG9jYXRpb25zTGlzdCgpW2ldLm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIHRhcmdldFN0cmluZyA9IG5ld1ZhbHVlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICBpZiAobG9jYXRpb25OYW1lLmluZGV4T2YodGFyZ2V0U3RyaW5nKSA9PT0gLTEpe1xuICAgICAgICAgICAgICAgIHNlbGYubG9jYXRpb25zTGlzdCgpW2ldLmRpc3BsYXkoZmFsc2UpO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgc2VsZi5sb2NhdGlvbnNMaXN0KClbaV0uZGlzcGxheSh0cnVlKTsgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc2VsZi5yZWRyYXdNYXJrZXJzKCk7XG4gICAgfSk7XG5cbiAgICBzZWxmLmluaXQgPSBmdW5jdGlvbigpe1xuICAgICAgICBsb2NhdGlvbnMuZm9yRWFjaChmdW5jdGlvbihsb2NhdGlvbkl0ZW0pe1xuICAgICAgICAgICAgc2VsZi5sb2NhdGlvbnNMaXN0LnB1c2gobmV3IExvY2F0aW9uKGxvY2F0aW9uSXRlbSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgc2VsZi5kcmF3TWFya2VycygpO1xuICAgIH07XG5cbiAgICBzZWxmLmRyYXdNYXJrZXJzID0gZnVuY3Rpb24oKXtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaTwgc2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRJdGVtID0gc2VsZi5sb2NhdGlvbnNMaXN0KClbaV07XG4gICAgICAgICAgICBpZiAoY3VycmVudEl0ZW0uZGlzcGxheSgpID09PSB0cnVlKXtcbiAgICAgICAgICAgICAgICBzZWxmLmFkZE1hcmtlcldpdGhBbmltYXRpb24oY3VycmVudEl0ZW0sIGkqMjAwKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZihjdXJyZW50SXRlbS5tYXJrZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIuc2V0TWFwKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYucmVkcmF3TWFya2VycyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGk8IHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIHZhciBjdXJyZW50SXRlbSA9IHNlbGYubG9jYXRpb25zTGlzdCgpW2ldO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRJdGVtLmRpc3BsYXkoKSA9PT0gdHJ1ZSl7XG4gICAgICAgICAgICAgICAgY3VycmVudEl0ZW0ubWFya2VyLnNldE1hcChzZWxmLm15TWFwLm1hcCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYoY3VycmVudEl0ZW0ubWFya2VyICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudEl0ZW0ubWFya2VyLnNldE1hcChudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBzZWxmLmNsZWFyTWFya2VycyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGk8IHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIHZhciBjdXJyZW50SXRlbSA9IHNlbGYubG9jYXRpb25zTGlzdCgpW2ldO1xuICAgICAgICAgICAgY3VycmVudEl0ZW0ubWFya2VyLnNldE1hcChudWxsKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBzZWxmLmFkZE1hcmtlcldpdGhBbmltYXRpb24gPSBmdW5jdGlvbihjdXJyZW50SXRlbSwgdGltZW91dCl7XG4gICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKHtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjoge2xhdDogY3VycmVudEl0ZW0ubGF0LCBsbmc6IGN1cnJlbnRJdGVtLmxuZ30sXG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uOiBnb29nbGUubWFwcy5BbmltYXRpb24uRFJPUCxcbiAgICAgICAgICAgICAgICBpY29uOiBwaW5zLmRlZmF1bHQucGluSW1hZ2UsXG4gICAgICAgICAgICAgICAgbWFwOiBzZWxmLm15TWFwLm1hcFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIuYWRkTGlzdGVuZXIoJ2NsaWNrJywgc2VsZi5hbmltYXRlTWFya2VyKTtcbiAgICAgICAgfSwgdGltZW91dCk7XG4gICAgfTtcblxuICAgIHNlbGYuQm91bmNlID0gZnVuY3Rpb24oY3VycmVudE1hcmtlcil7XG4gICAgICAgIC8vIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgaWYgKGN1cnJlbnRNYXJrZXIuZ2V0QW5pbWF0aW9uKCkgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGN1cnJlbnRNYXJrZXIuc2V0QW5pbWF0aW9uKG51bGwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3VycmVudE1hcmtlci5zZXRBbmltYXRpb24oZ29vZ2xlLm1hcHMuQW5pbWF0aW9uLkJPVU5DRSk7XG4gICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIGN1cnJlbnRNYXJrZXIuc2V0QW5pbWF0aW9uKG51bGwpO1xuICAgICAgICAgICAgfSw3MDApO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYuYWN0aXZlQ29sb3IgPSBmdW5jdGlvbihjdXJyZW50TWFya2VyKXtcbiAgICAgICAgY3VycmVudE1hcmtlci5zZXRJY29uKHBpbnMuYWN0aXZlLnBpbkltYWdlKTtcbiAgICB9O1xuXG4gICAgc2VsZi5kZWZhdWx0Q29sb3IgPSBmdW5jdGlvbihjdXJyZW50TWFya2VyKXtcbiAgICAgICAgY3VycmVudE1hcmtlci5zZXRJY29uKHBpbnMuZGVmYXVsdC5waW5JbWFnZSk7XG4gICAgfTtcblxuICAgIHNlbGYuYW5pbWF0ZU1hcmtlciA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBjdXJyZW50TWFya2VyID0gdGhpcztcbiAgICAgICAgc2VsZi5kZWZhdWx0Q29sb3JBbGwoKTtcbiAgICAgICAgc2VsZi5hY3RpdmVDb2xvcihjdXJyZW50TWFya2VyKTtcbiAgICAgICAgc2VsZi5Cb3VuY2UoY3VycmVudE1hcmtlcik7XG4gICAgfTtcblxuICAgIHNlbGYuZGVmYXVsdENvbG9yQWxsID0gZnVuY3Rpb24oKXtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaTwgc2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRJdGVtID0gc2VsZi5sb2NhdGlvbnNMaXN0KClbaV07XG4gICAgICAgICAgICBzZWxmLmRlZmF1bHRDb2xvcihjdXJyZW50SXRlbS5tYXJrZXIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYuaW5pdCgpO1xufTtcblxuXG5rby5hcHBseUJpbmRpbmdzKG5ldyBteVZpZXdNb2RlbCk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
