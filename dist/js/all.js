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
                currentItem.active(true);
                var currentMarker = this;
                self.activeColor(currentMarker);
                self.Bounce(currentMarker);
            });
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYWxsLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGxvY2F0aW9ucyA9IFtcbiAgICB7XG4gICAgICAgICduYW1lJzogJ0dyb2NlcnkgMicsXG4gICAgICAgICdsb2NhdGlvbic6IHtcbiAgICAgICAgICAgICdsYXQnOiAnNDMuMjY4MjI0JyxcbiAgICAgICAgICAgICdsbmcnOiAnLTIuOTM4MDAzJ1xuICAgICAgICB9LFxuICAgICAgICAnZGlzcGxheSc6ICd0cnVlJ1xuICAgIH0sXG4gICAge1xuICAgICAgICAnbmFtZSc6ICdwYW5hZGVyaWEgMzQnLFxuICAgICAgICAnbG9jYXRpb24nOiB7XG4gICAgICAgICAgICAnbGF0JzogJzQzLjI2OTIyNCcsXG4gICAgICAgICAgICAnbG5nJzogJy0yLjkzNTAwMydcbiAgICAgICAgfSxcbiAgICAgICAgJ2Rpc3BsYXknOiAndHJ1ZSdcbiAgICB9LFxuICAgIHtcbiAgICAgICAgJ25hbWUnOiAnY29waXN0ZXJpYScsXG4gICAgICAgICdsb2NhdGlvbic6IHtcbiAgICAgICAgICAgICdsYXQnOiAnNDMuMjYzMjI0JyxcbiAgICAgICAgICAgICdsbmcnOiAnLTIuOTM3MDAzJ1xuICAgICAgICB9LFxuICAgICAgICAnZGlzcGxheSc6ICd0cnVlJ1xuICAgIH0sXG4gICAge1xuICAgICAgICAnbmFtZSc6ICdBbHBhcmdhdGFzIEphdmllcicsXG4gICAgICAgICdsb2NhdGlvbic6IHtcbiAgICAgICAgICAgICdsYXQnOiAnNDMuMjYxMjI0JyxcbiAgICAgICAgICAgICdsbmcnOiAnLTIuOTM1MDAzJ1xuICAgICAgICB9LFxuICAgICAgICAnZGlzcGxheSc6ICd0cnVlJ1xuICAgIH0sXG4gICAge1xuICAgICAgICAnbmFtZSc6ICdDb2NpbmFzIG1lbG9uJyxcbiAgICAgICAgJ2xvY2F0aW9uJzoge1xuICAgICAgICAgICAgJ2xhdCc6ICc0My4yNjIyMjQnLFxuICAgICAgICAgICAgJ2xuZyc6ICctMi45MzIwMDMnXG4gICAgICAgIH0sXG4gICAgICAgICdkaXNwbGF5JzogJ3RydWUnXG4gICAgfVxuXTtcblxuXG52YXIgcGlucyA9IHtcbiAgICBkZWZhdWx0OiB7XG4gICAgICAgIHBpbkltYWdlIDogbmV3IGdvb2dsZS5tYXBzLk1hcmtlckltYWdlKFwiaHR0cDovL2NoYXJ0LmFwaXMuZ29vZ2xlLmNvbS9jaGFydD9jaHN0PWRfbWFwX3Bpbl9sZXR0ZXImY2hsZD0lRTIlODAlQTJ8XCIgK1xuICAgICAgICAnREQ4ODg4JyxcbiAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlNpemUoMjEsIDM0KSxcbiAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlBvaW50KDAsMCksXG4gICAgICAgIG5ldyBnb29nbGUubWFwcy5Qb2ludCgxMCwgMzQpKVxuICAgIH0sXG4gICAgYWN0aXZlOiB7XG4gICAgICAgIHBpbkltYWdlIDogbmV3IGdvb2dsZS5tYXBzLk1hcmtlckltYWdlKFwiaHR0cDovL2NoYXJ0LmFwaXMuZ29vZ2xlLmNvbS9jaGFydD9jaHN0PWRfbWFwX3Bpbl9sZXR0ZXImY2hsZD0lRTIlODAlQTJ8XCIgK1xuICAgICAgICAnQUFEREREJyxcbiAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlNpemUoMjEsIDM0KSxcbiAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlBvaW50KDAsMCksXG4gICAgICAgIG5ldyBnb29nbGUubWFwcy5Qb2ludCgxMCwgMzQpKVxuXG4gICAgfVxufTtcblxudmFyIG5laWdoYm9yaG9vZE1hcCA9IGZ1bmN0aW9uKCl7XG4gICAgdGhpcy5tYXBEaXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwJyk7XG4gICAgdGhpcy5jZW50ZXJNYXAgPSB7bGF0OiA0My4yNjMyMjQsIGxuZzogLTIuOTM1MDAzfTtcbiAgICB0aGlzLnpvb20gPSAxNTtcbiAgICB0aGlzLm1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAodGhpcy5tYXBEaXYsIHtcbiAgICAgICAgem9vbTogdGhpcy56b29tLFxuICAgICAgICBjZW50ZXI6IHRoaXMuY2VudGVyTWFwXG4gICAgfSk7XG59O1xuXG52YXIgTG9jYXRpb24gPSBmdW5jdGlvbihkYXRhKXtcbiAgICB0aGlzLm5hbWUgPSBkYXRhWyduYW1lJ107XG4gICAgdGhpcy5sYXQgPSBwYXJzZUZsb2F0KGRhdGFbJ2xvY2F0aW9uJ11bJ2xhdCddKTtcbiAgICB0aGlzLmxuZyA9IHBhcnNlRmxvYXQoZGF0YVsnbG9jYXRpb24nXVsnbG5nJ10pO1xuICAgIHRoaXMuZGlzcGxheSA9IGtvLm9ic2VydmFibGUoZGF0YVsnZGlzcGxheSddID09PSAndHJ1ZScpO1xuICAgIHRoaXMubWFya2VyID0gbnVsbDtcbiAgICB0aGlzLmFjdGl2ZSA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xufTtcblxudmFyIG15Vmlld01vZGVsID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgc2VsZi5sb2NhdGlvbnNMaXN0ID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcbiAgICBzZWxmLm15TWFwID0gbmV3IG5laWdoYm9yaG9vZE1hcCgpO1xuICAgIHNlbGYuY3VycmVudEZpbHRlciA9IGtvLm9ic2VydmFibGUoJycpO1xuXG4gICAgdmFyIHN1YnNjcmlwdGlvbiA9IHNlbGYuY3VycmVudEZpbHRlci5zdWJzY3JpYmUoZnVuY3Rpb24obmV3VmFsdWUpe1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaTxzZWxmLmxvY2F0aW9uc0xpc3QoKS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgbG9jYXRpb25OYW1lID0gc2VsZi5sb2NhdGlvbnNMaXN0KClbaV0ubmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgdGFyZ2V0U3RyaW5nID0gbmV3VmFsdWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIGlmIChsb2NhdGlvbk5hbWUuaW5kZXhPZih0YXJnZXRTdHJpbmcpID09PSAtMSl7XG4gICAgICAgICAgICAgICAgc2VsZi5sb2NhdGlvbnNMaXN0KClbaV0uZGlzcGxheShmYWxzZSk7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXS5kaXNwbGF5KHRydWUpOyAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzZWxmLnJlZHJhd01hcmtlcnMoKTtcbiAgICB9KTtcblxuICAgIHNlbGYuaW5pdCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGxvY2F0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKGxvY2F0aW9uSXRlbSl7XG4gICAgICAgICAgICBzZWxmLmxvY2F0aW9uc0xpc3QucHVzaChuZXcgTG9jYXRpb24obG9jYXRpb25JdGVtKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBzZWxmLmRyYXdNYXJrZXJzKCk7XG4gICAgfTtcblxuICAgIHNlbGYuZHJhd01hcmtlcnMgPSBmdW5jdGlvbigpe1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpPCBzZWxmLmxvY2F0aW9uc0xpc3QoKS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50SXRlbS5kaXNwbGF5KCkgPT09IHRydWUpe1xuICAgICAgICAgICAgICAgIHNlbGYuYWRkTWFya2VyV2l0aEFuaW1hdGlvbihjdXJyZW50SXRlbSwgaSoyMDApO1xuICAgICAgICAgICAgfSBlbHNlIGlmKGN1cnJlbnRJdGVtLm1hcmtlciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlci5zZXRNYXAobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VsZi5yZWRyYXdNYXJrZXJzID0gZnVuY3Rpb24oKXtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaTwgc2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRJdGVtID0gc2VsZi5sb2NhdGlvbnNMaXN0KClbaV07XG4gICAgICAgICAgICBpZiAoY3VycmVudEl0ZW0uZGlzcGxheSgpID09PSB0cnVlKXtcbiAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIuc2V0TWFwKHNlbGYubXlNYXAubWFwKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZihjdXJyZW50SXRlbS5tYXJrZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIuc2V0TWFwKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYuY2xlYXJNYXJrZXJzID0gZnVuY3Rpb24oKXtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaTwgc2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRJdGVtID0gc2VsZi5sb2NhdGlvbnNMaXN0KClbaV07XG4gICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIuc2V0TWFwKG51bGwpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYuYWRkTWFya2VyV2l0aEFuaW1hdGlvbiA9IGZ1bmN0aW9uKGN1cnJlbnRJdGVtLCB0aW1lb3V0KXtcbiAgICAgICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7bGF0OiBjdXJyZW50SXRlbS5sYXQsIGxuZzogY3VycmVudEl0ZW0ubG5nfSxcbiAgICAgICAgICAgICAgICBhbmltYXRpb246IGdvb2dsZS5tYXBzLkFuaW1hdGlvbi5EUk9QLFxuICAgICAgICAgICAgICAgIGljb246IHBpbnMuZGVmYXVsdC5waW5JbWFnZSxcbiAgICAgICAgICAgICAgICBtYXA6IHNlbGYubXlNYXAubWFwXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlci5hZGRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHNlbGYuaW5hY3RpdmVBbGwoKTtcbiAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5hY3RpdmUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRNYXJrZXIgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHNlbGYuYWN0aXZlQ29sb3IoY3VycmVudE1hcmtlcik7XG4gICAgICAgICAgICAgICAgc2VsZi5Cb3VuY2UoY3VycmVudE1hcmtlcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgdGltZW91dCk7XG4gICAgfTtcblxuICAgIHNlbGYuQm91bmNlID0gZnVuY3Rpb24oY3VycmVudE1hcmtlcil7XG4gICAgICAgIC8vIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgaWYgKGN1cnJlbnRNYXJrZXIuZ2V0QW5pbWF0aW9uKCkgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGN1cnJlbnRNYXJrZXIuc2V0QW5pbWF0aW9uKG51bGwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3VycmVudE1hcmtlci5zZXRBbmltYXRpb24oZ29vZ2xlLm1hcHMuQW5pbWF0aW9uLkJPVU5DRSk7XG4gICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIGN1cnJlbnRNYXJrZXIuc2V0QW5pbWF0aW9uKG51bGwpO1xuICAgICAgICAgICAgfSw3MDApO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYuYWN0aXZlQ29sb3IgPSBmdW5jdGlvbihjdXJyZW50TWFya2VyKXtcbiAgICAgICAgY3VycmVudE1hcmtlci5zZXRJY29uKHBpbnMuYWN0aXZlLnBpbkltYWdlKTtcbiAgICB9O1xuXG4gICAgc2VsZi5kZWZhdWx0Q29sb3IgPSBmdW5jdGlvbihjdXJyZW50TWFya2VyKXtcbiAgICAgICAgY3VycmVudE1hcmtlci5zZXRJY29uKHBpbnMuZGVmYXVsdC5waW5JbWFnZSk7XG4gICAgfTtcblxuICAgIHNlbGYuaW5hY3RpdmVBbGwgPSBmdW5jdGlvbigpe1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpPCBzZWxmLmxvY2F0aW9uc0xpc3QoKS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgY3VycmVudEl0ZW0gPSBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXTtcbiAgICAgICAgICAgIGN1cnJlbnRJdGVtLmFjdGl2ZShmYWxzZSk7XG4gICAgICAgICAgICBzZWxmLmRlZmF1bHRDb2xvcihjdXJyZW50SXRlbS5tYXJrZXIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYuZGVmYXVsdENvbG9yQWxsID0gZnVuY3Rpb24oKXtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaTwgc2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRJdGVtID0gc2VsZi5sb2NhdGlvbnNMaXN0KClbaV07XG4gICAgICAgICAgICBzZWxmLmRlZmF1bHRDb2xvcihjdXJyZW50SXRlbS5tYXJrZXIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYuaW5pdCgpO1xufTtcblxuXG5rby5hcHBseUJpbmRpbmdzKG5ldyBteVZpZXdNb2RlbCk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
