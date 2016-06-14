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
            currentItem.marker.addListener('click', function(){
                self.inactiveAll();
                var currentMarker = this;
                currentItem.active(true);
                self.activeColor(currentMarker);
                self.Bounce(currentMarker);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhbGwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgbG9jYXRpb25zID0gW1xuICAgIHtcbiAgICAgICAgJ25hbWUnOiAnR3JvY2VyeSAyJyxcbiAgICAgICAgJ2xvY2F0aW9uJzoge1xuICAgICAgICAgICAgJ2xhdCc6ICc0My4yNjgyMjQnLFxuICAgICAgICAgICAgJ2xuZyc6ICctMi45MzgwMDMnXG4gICAgICAgIH0sXG4gICAgICAgICdkaXNwbGF5JzogJ3RydWUnXG4gICAgfSxcbiAgICB7XG4gICAgICAgICduYW1lJzogJ3BhbmFkZXJpYSAzNCcsXG4gICAgICAgICdsb2NhdGlvbic6IHtcbiAgICAgICAgICAgICdsYXQnOiAnNDMuMjY5MjI0JyxcbiAgICAgICAgICAgICdsbmcnOiAnLTIuOTM1MDAzJ1xuICAgICAgICB9LFxuICAgICAgICAnZGlzcGxheSc6ICd0cnVlJ1xuICAgIH0sXG4gICAge1xuICAgICAgICAnbmFtZSc6ICdjb3Bpc3RlcmlhJyxcbiAgICAgICAgJ2xvY2F0aW9uJzoge1xuICAgICAgICAgICAgJ2xhdCc6ICc0My4yNjMyMjQnLFxuICAgICAgICAgICAgJ2xuZyc6ICctMi45MzcwMDMnXG4gICAgICAgIH0sXG4gICAgICAgICdkaXNwbGF5JzogJ3RydWUnXG4gICAgfSxcbiAgICB7XG4gICAgICAgICduYW1lJzogJ0FscGFyZ2F0YXMgSmF2aWVyJyxcbiAgICAgICAgJ2xvY2F0aW9uJzoge1xuICAgICAgICAgICAgJ2xhdCc6ICc0My4yNjEyMjQnLFxuICAgICAgICAgICAgJ2xuZyc6ICctMi45MzUwMDMnXG4gICAgICAgIH0sXG4gICAgICAgICdkaXNwbGF5JzogJ3RydWUnXG4gICAgfSxcbiAgICB7XG4gICAgICAgICduYW1lJzogJ0NvY2luYXMgbWVsb24nLFxuICAgICAgICAnbG9jYXRpb24nOiB7XG4gICAgICAgICAgICAnbGF0JzogJzQzLjI2MjIyNCcsXG4gICAgICAgICAgICAnbG5nJzogJy0yLjkzMjAwMydcbiAgICAgICAgfSxcbiAgICAgICAgJ2Rpc3BsYXknOiAndHJ1ZSdcbiAgICB9XG5dO1xuXG5cbnZhciBwaW5zID0ge1xuICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgcGluSW1hZ2UgOiBuZXcgZ29vZ2xlLm1hcHMuTWFya2VySW1hZ2UoXCJodHRwOi8vY2hhcnQuYXBpcy5nb29nbGUuY29tL2NoYXJ0P2Noc3Q9ZF9tYXBfcGluX2xldHRlciZjaGxkPSVFMiU4MCVBMnxcIiArXG4gICAgICAgICdERDg4ODgnLFxuICAgICAgICBuZXcgZ29vZ2xlLm1hcHMuU2l6ZSgyMSwgMzQpLFxuICAgICAgICBuZXcgZ29vZ2xlLm1hcHMuUG9pbnQoMCwwKSxcbiAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlBvaW50KDEwLCAzNCkpXG4gICAgfSxcbiAgICBhY3RpdmU6IHtcbiAgICAgICAgcGluSW1hZ2UgOiBuZXcgZ29vZ2xlLm1hcHMuTWFya2VySW1hZ2UoXCJodHRwOi8vY2hhcnQuYXBpcy5nb29nbGUuY29tL2NoYXJ0P2Noc3Q9ZF9tYXBfcGluX2xldHRlciZjaGxkPSVFMiU4MCVBMnxcIiArXG4gICAgICAgICdBQUREREQnLFxuICAgICAgICBuZXcgZ29vZ2xlLm1hcHMuU2l6ZSgyMSwgMzQpLFxuICAgICAgICBuZXcgZ29vZ2xlLm1hcHMuUG9pbnQoMCwwKSxcbiAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlBvaW50KDEwLCAzNCkpXG5cbiAgICB9XG59O1xuXG52YXIgbmVpZ2hib3Job29kTWFwID0gZnVuY3Rpb24oKXtcbiAgICB0aGlzLm1hcERpdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXAnKTtcbiAgICB0aGlzLmNlbnRlck1hcCA9IHtsYXQ6IDQzLjI2MzIyNCwgbG5nOiAtMi45MzUwMDN9O1xuICAgIHRoaXMuem9vbSA9IDE1O1xuICAgIHRoaXMubWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcCh0aGlzLm1hcERpdiwge1xuICAgICAgICB6b29tOiB0aGlzLnpvb20sXG4gICAgICAgIGNlbnRlcjogdGhpcy5jZW50ZXJNYXBcbiAgICB9KTtcbn07XG5cbnZhciBMb2NhdGlvbiA9IGZ1bmN0aW9uKGRhdGEpe1xuICAgIHRoaXMubmFtZSA9IGRhdGFbJ25hbWUnXTtcbiAgICB0aGlzLmxhdCA9IHBhcnNlRmxvYXQoZGF0YVsnbG9jYXRpb24nXVsnbGF0J10pO1xuICAgIHRoaXMubG5nID0gcGFyc2VGbG9hdChkYXRhWydsb2NhdGlvbiddWydsbmcnXSk7XG4gICAgdGhpcy5kaXNwbGF5ID0ga28ub2JzZXJ2YWJsZShkYXRhWydkaXNwbGF5J10gPT09ICd0cnVlJyk7XG4gICAgdGhpcy5tYXJrZXIgPSBudWxsO1xuICAgIHRoaXMuYWN0aXZlID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG59O1xuXG52YXIgbXlWaWV3TW9kZWwgPSBmdW5jdGlvbigpe1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBzZWxmLmxvY2F0aW9uc0xpc3QgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xuICAgIHNlbGYubXlNYXAgPSBuZXcgbmVpZ2hib3Job29kTWFwKCk7XG4gICAgc2VsZi5jdXJyZW50RmlsdGVyID0ga28ub2JzZXJ2YWJsZSgnJyk7XG5cbiAgICB2YXIgc3Vic2NyaXB0aW9uID0gc2VsZi5jdXJyZW50RmlsdGVyLnN1YnNjcmliZShmdW5jdGlvbihuZXdWYWx1ZSl7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpPHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIHZhciBsb2NhdGlvbk5hbWUgPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXS5uYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB0YXJnZXRTdHJpbmcgPSBuZXdWYWx1ZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgaWYgKGxvY2F0aW9uTmFtZS5pbmRleE9mKHRhcmdldFN0cmluZykgPT09IC0xKXtcbiAgICAgICAgICAgICAgICBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXS5kaXNwbGF5KGZhbHNlKTtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIHNlbGYubG9jYXRpb25zTGlzdCgpW2ldLmRpc3BsYXkodHJ1ZSk7ICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHNlbGYucmVkcmF3TWFya2VycygpO1xuICAgIH0pO1xuXG4gICAgc2VsZi5pbml0ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgbG9jYXRpb25zLmZvckVhY2goZnVuY3Rpb24obG9jYXRpb25JdGVtKXtcbiAgICAgICAgICAgIHNlbGYubG9jYXRpb25zTGlzdC5wdXNoKG5ldyBMb2NhdGlvbihsb2NhdGlvbkl0ZW0pKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHNlbGYuZHJhd01hcmtlcnMoKTtcbiAgICB9O1xuXG4gICAgc2VsZi5kcmF3TWFya2VycyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGk8IHNlbGYubG9jYXRpb25zTGlzdCgpLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIHZhciBjdXJyZW50SXRlbSA9IHNlbGYubG9jYXRpb25zTGlzdCgpW2ldO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRJdGVtLmRpc3BsYXkoKSA9PT0gdHJ1ZSl7XG4gICAgICAgICAgICAgICAgc2VsZi5hZGRNYXJrZXJXaXRoQW5pbWF0aW9uKGN1cnJlbnRJdGVtLCBpKjIwMCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYoY3VycmVudEl0ZW0ubWFya2VyICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudEl0ZW0ubWFya2VyLnNldE1hcChudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBzZWxmLnJlZHJhd01hcmtlcnMgPSBmdW5jdGlvbigpe1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpPCBzZWxmLmxvY2F0aW9uc0xpc3QoKS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50SXRlbS5kaXNwbGF5KCkgPT09IHRydWUpe1xuICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlci5zZXRNYXAoc2VsZi5teU1hcC5tYXApO1xuICAgICAgICAgICAgfSBlbHNlIGlmKGN1cnJlbnRJdGVtLm1hcmtlciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlci5zZXRNYXAobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VsZi5jbGVhck1hcmtlcnMgPSBmdW5jdGlvbigpe1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpPCBzZWxmLmxvY2F0aW9uc0xpc3QoKS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlci5zZXRNYXAobnVsbCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VsZi5hZGRNYXJrZXJXaXRoQW5pbWF0aW9uID0gZnVuY3Rpb24oY3VycmVudEl0ZW0sIHRpbWVvdXQpe1xuICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgY3VycmVudEl0ZW0ubWFya2VyID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcih7XG4gICAgICAgICAgICAgICAgcG9zaXRpb246IHtsYXQ6IGN1cnJlbnRJdGVtLmxhdCwgbG5nOiBjdXJyZW50SXRlbS5sbmd9LFxuICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogZ29vZ2xlLm1hcHMuQW5pbWF0aW9uLkRST1AsXG4gICAgICAgICAgICAgICAgaWNvbjogcGlucy5kZWZhdWx0LnBpbkltYWdlLFxuICAgICAgICAgICAgICAgIG1hcDogc2VsZi5teU1hcC5tYXBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY3VycmVudEl0ZW0ubWFya2VyLmFkZExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgc2VsZi5pbmFjdGl2ZUFsbCgpO1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50TWFya2VyID0gdGhpcztcbiAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5hY3RpdmUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgc2VsZi5hY3RpdmVDb2xvcihjdXJyZW50TWFya2VyKTtcbiAgICAgICAgICAgICAgICBzZWxmLkJvdW5jZShjdXJyZW50TWFya2VyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICB9O1xuXG4gICAgc2VsZi5hY3RpdmF0ZU1hcmtlciA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBtYXJrZXIgPSB0aGlzLm1hcmtlcjtcbiAgICAgICAgdmFyIGxvY2F0aW9uID0gdGhpcztcbiAgICAgICAgc2VsZi5pbmFjdGl2ZUFsbCgpO1xuICAgICAgICBsb2NhdGlvbi5hY3RpdmUodHJ1ZSk7XG4gICAgICAgIHNlbGYuYWN0aXZlQ29sb3IobWFya2VyKTtcbiAgICAgICAgc2VsZi5Cb3VuY2UobWFya2VyKTtcbiAgICB9O1xuXG4gICAgc2VsZi5maW5kQ2xpY2tlZE1hcmtlciA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xuICAgIH1cblxuICAgIHNlbGYuQm91bmNlID0gZnVuY3Rpb24oY3VycmVudE1hcmtlcil7XG4gICAgICAgIC8vIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgaWYgKGN1cnJlbnRNYXJrZXIuZ2V0QW5pbWF0aW9uKCkgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGN1cnJlbnRNYXJrZXIuc2V0QW5pbWF0aW9uKG51bGwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3VycmVudE1hcmtlci5zZXRBbmltYXRpb24oZ29vZ2xlLm1hcHMuQW5pbWF0aW9uLkJPVU5DRSk7XG4gICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIGN1cnJlbnRNYXJrZXIuc2V0QW5pbWF0aW9uKG51bGwpO1xuICAgICAgICAgICAgfSw3MDApO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYuYWN0aXZlQ29sb3IgPSBmdW5jdGlvbihjdXJyZW50TWFya2VyKXtcbiAgICAgICAgY3VycmVudE1hcmtlci5zZXRJY29uKHBpbnMuYWN0aXZlLnBpbkltYWdlKTtcbiAgICB9O1xuXG4gICAgc2VsZi5kZWZhdWx0Q29sb3IgPSBmdW5jdGlvbihjdXJyZW50TWFya2VyKXtcbiAgICAgICAgY3VycmVudE1hcmtlci5zZXRJY29uKHBpbnMuZGVmYXVsdC5waW5JbWFnZSk7XG4gICAgfTtcblxuICAgIHNlbGYuaW5hY3RpdmVBbGwgPSBmdW5jdGlvbigpe1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpPCBzZWxmLmxvY2F0aW9uc0xpc3QoKS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgIGN1cnJlbnRJdGVtLmFjdGl2ZShmYWxzZSk7XG4gICAgICAgICAgICBzZWxmLmRlZmF1bHRDb2xvcihjdXJyZW50SXRlbS5tYXJrZXIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYuZGVmYXVsdENvbG9yQWxsID0gZnVuY3Rpb24oKXtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaTwgc2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRJdGVtID0gc2VsZi5sb2NhdGlvbnNMaXN0KClbaV07XG4gICAgICAgICAgICBzZWxmLmRlZmF1bHRDb2xvcihjdXJyZW50SXRlbS5tYXJrZXIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYuaW5pdCgpO1xufTtcblxuXG5rby5hcHBseUJpbmRpbmdzKG5ldyBteVZpZXdNb2RlbCk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
