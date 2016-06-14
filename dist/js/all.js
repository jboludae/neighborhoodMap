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
    this.active = false;
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
        self.drawMarkers();
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
                console.log(currentItem.marker.map);
            }
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

    self.toggleColor = function(currentMarker){
        currentMarker.setIcon(pins.active.pinImage);
    };

    self.animateMarker = function(){
        var currentMarker = this;
        self.toggleColor(currentMarker);
        self.Bounce(currentMarker);
    };

    self.init();
};


ko.applyBindings(new myViewModel);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYWxsLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGxvY2F0aW9ucyA9IFtcbiAgICB7XG4gICAgICAgICduYW1lJzogJ0dyb2NlcnkgMicsXG4gICAgICAgICdsb2NhdGlvbic6IHtcbiAgICAgICAgICAgICdsYXQnOiAnNDMuMjY4MjI0JyxcbiAgICAgICAgICAgICdsbmcnOiAnLTIuOTM4MDAzJ1xuICAgICAgICB9LFxuICAgICAgICAnZGlzcGxheSc6ICd0cnVlJ1xuICAgIH0sXG4gICAge1xuICAgICAgICAnbmFtZSc6ICdwYW5hZGVyaWEgMzQnLFxuICAgICAgICAnbG9jYXRpb24nOiB7XG4gICAgICAgICAgICAnbGF0JzogJzQzLjI2OTIyNCcsXG4gICAgICAgICAgICAnbG5nJzogJy0yLjkzNTAwMydcbiAgICAgICAgfSxcbiAgICAgICAgJ2Rpc3BsYXknOiAndHJ1ZSdcbiAgICB9LFxuICAgIHtcbiAgICAgICAgJ25hbWUnOiAnY29waXN0ZXJpYScsXG4gICAgICAgICdsb2NhdGlvbic6IHtcbiAgICAgICAgICAgICdsYXQnOiAnNDMuMjYzMjI0JyxcbiAgICAgICAgICAgICdsbmcnOiAnLTIuOTM3MDAzJ1xuICAgICAgICB9LFxuICAgICAgICAnZGlzcGxheSc6ICd0cnVlJ1xuICAgIH0sXG4gICAge1xuICAgICAgICAnbmFtZSc6ICdBbHBhcmdhdGFzIEphdmllcicsXG4gICAgICAgICdsb2NhdGlvbic6IHtcbiAgICAgICAgICAgICdsYXQnOiAnNDMuMjYxMjI0JyxcbiAgICAgICAgICAgICdsbmcnOiAnLTIuOTM1MDAzJ1xuICAgICAgICB9LFxuICAgICAgICAnZGlzcGxheSc6ICd0cnVlJ1xuICAgIH0sXG4gICAge1xuICAgICAgICAnbmFtZSc6ICdDb2NpbmFzIG1lbG9uJyxcbiAgICAgICAgJ2xvY2F0aW9uJzoge1xuICAgICAgICAgICAgJ2xhdCc6ICc0My4yNjIyMjQnLFxuICAgICAgICAgICAgJ2xuZyc6ICctMi45MzIwMDMnXG4gICAgICAgIH0sXG4gICAgICAgICdkaXNwbGF5JzogJ3RydWUnXG4gICAgfVxuXTtcblxuXG52YXIgcGlucyA9IHtcbiAgICBkZWZhdWx0OiB7XG4gICAgICAgIHBpbkltYWdlIDogbmV3IGdvb2dsZS5tYXBzLk1hcmtlckltYWdlKFwiaHR0cDovL2NoYXJ0LmFwaXMuZ29vZ2xlLmNvbS9jaGFydD9jaHN0PWRfbWFwX3Bpbl9sZXR0ZXImY2hsZD0lRTIlODAlQTJ8XCIgK1xuICAgICAgICAnREQ4ODg4JyxcbiAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlNpemUoMjEsIDM0KSxcbiAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlBvaW50KDAsMCksXG4gICAgICAgIG5ldyBnb29nbGUubWFwcy5Qb2ludCgxMCwgMzQpKVxuICAgIH0sXG4gICAgYWN0aXZlOiB7XG4gICAgICAgIHBpbkltYWdlIDogbmV3IGdvb2dsZS5tYXBzLk1hcmtlckltYWdlKFwiaHR0cDovL2NoYXJ0LmFwaXMuZ29vZ2xlLmNvbS9jaGFydD9jaHN0PWRfbWFwX3Bpbl9sZXR0ZXImY2hsZD0lRTIlODAlQTJ8XCIgK1xuICAgICAgICAnQUFEREREJyxcbiAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlNpemUoMjEsIDM0KSxcbiAgICAgICAgbmV3IGdvb2dsZS5tYXBzLlBvaW50KDAsMCksXG4gICAgICAgIG5ldyBnb29nbGUubWFwcy5Qb2ludCgxMCwgMzQpKVxuXG4gICAgfVxufTtcblxudmFyIG5laWdoYm9yaG9vZE1hcCA9IGZ1bmN0aW9uKCl7XG4gICAgdGhpcy5tYXBEaXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwJyk7XG4gICAgdGhpcy5jZW50ZXJNYXAgPSB7bGF0OiA0My4yNjMyMjQsIGxuZzogLTIuOTM1MDAzfTtcbiAgICB0aGlzLnpvb20gPSAxNTtcbiAgICB0aGlzLm1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAodGhpcy5tYXBEaXYsIHtcbiAgICAgICAgem9vbTogdGhpcy56b29tLFxuICAgICAgICBjZW50ZXI6IHRoaXMuY2VudGVyTWFwXG4gICAgfSk7XG59O1xuXG52YXIgTG9jYXRpb24gPSBmdW5jdGlvbihkYXRhKXtcbiAgICB0aGlzLm5hbWUgPSBkYXRhWyduYW1lJ107XG4gICAgdGhpcy5sYXQgPSBwYXJzZUZsb2F0KGRhdGFbJ2xvY2F0aW9uJ11bJ2xhdCddKTtcbiAgICB0aGlzLmxuZyA9IHBhcnNlRmxvYXQoZGF0YVsnbG9jYXRpb24nXVsnbG5nJ10pO1xuICAgIHRoaXMuZGlzcGxheSA9IGtvLm9ic2VydmFibGUoZGF0YVsnZGlzcGxheSddID09PSAndHJ1ZScpO1xuICAgIHRoaXMubWFya2VyID0gbnVsbDtcbiAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xufTtcblxudmFyIG15Vmlld01vZGVsID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgc2VsZi5sb2NhdGlvbnNMaXN0ID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcbiAgICBzZWxmLm15TWFwID0gbmV3IG5laWdoYm9yaG9vZE1hcCgpO1xuICAgIHNlbGYuY3VycmVudEZpbHRlciA9IGtvLm9ic2VydmFibGUoJycpO1xuXG4gICAgdmFyIHN1YnNjcmlwdGlvbiA9IHNlbGYuY3VycmVudEZpbHRlci5zdWJzY3JpYmUoZnVuY3Rpb24obmV3VmFsdWUpe1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaTxzZWxmLmxvY2F0aW9uc0xpc3QoKS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB2YXIgbG9jYXRpb25OYW1lID0gc2VsZi5sb2NhdGlvbnNMaXN0KClbaV0ubmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgdGFyZ2V0U3RyaW5nID0gbmV3VmFsdWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIGlmIChsb2NhdGlvbk5hbWUuaW5kZXhPZih0YXJnZXRTdHJpbmcpID09PSAtMSl7XG4gICAgICAgICAgICAgICAgc2VsZi5sb2NhdGlvbnNMaXN0KClbaV0uZGlzcGxheShmYWxzZSk7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICBzZWxmLmxvY2F0aW9uc0xpc3QoKVtpXS5kaXNwbGF5KHRydWUpOyAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzZWxmLmRyYXdNYXJrZXJzKCk7XG4gICAgfSk7XG5cbiAgICBzZWxmLmluaXQgPSBmdW5jdGlvbigpe1xuICAgICAgICBsb2NhdGlvbnMuZm9yRWFjaChmdW5jdGlvbihsb2NhdGlvbkl0ZW0pe1xuICAgICAgICAgICAgc2VsZi5sb2NhdGlvbnNMaXN0LnB1c2gobmV3IExvY2F0aW9uKGxvY2F0aW9uSXRlbSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgc2VsZi5kcmF3TWFya2VycygpO1xuICAgIH07XG5cbiAgICBzZWxmLmRyYXdNYXJrZXJzID0gZnVuY3Rpb24oKXtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaTwgc2VsZi5sb2NhdGlvbnNMaXN0KCkubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRJdGVtID0gc2VsZi5sb2NhdGlvbnNMaXN0KClbaV07XG4gICAgICAgICAgICBpZiAoY3VycmVudEl0ZW0uZGlzcGxheSgpID09PSB0cnVlKXtcbiAgICAgICAgICAgICAgICBzZWxmLmFkZE1hcmtlcldpdGhBbmltYXRpb24oY3VycmVudEl0ZW0sIGkqMjAwKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZihjdXJyZW50SXRlbS5tYXJrZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50SXRlbS5tYXJrZXIuc2V0TWFwKG51bGwpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGN1cnJlbnRJdGVtLm1hcmtlci5tYXApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYuYWRkTWFya2VyV2l0aEFuaW1hdGlvbiA9IGZ1bmN0aW9uKGN1cnJlbnRJdGVtLCB0aW1lb3V0KXtcbiAgICAgICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7bGF0OiBjdXJyZW50SXRlbS5sYXQsIGxuZzogY3VycmVudEl0ZW0ubG5nfSxcbiAgICAgICAgICAgICAgICBhbmltYXRpb246IGdvb2dsZS5tYXBzLkFuaW1hdGlvbi5EUk9QLFxuICAgICAgICAgICAgICAgIGljb246IHBpbnMuZGVmYXVsdC5waW5JbWFnZSxcbiAgICAgICAgICAgICAgICBtYXA6IHNlbGYubXlNYXAubWFwXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGN1cnJlbnRJdGVtLm1hcmtlci5hZGRMaXN0ZW5lcignY2xpY2snLCBzZWxmLmFuaW1hdGVNYXJrZXIpO1xuICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICB9O1xuXG4gICAgc2VsZi5Cb3VuY2UgPSBmdW5jdGlvbihjdXJyZW50TWFya2VyKXtcbiAgICAgICAgLy8gdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBpZiAoY3VycmVudE1hcmtlci5nZXRBbmltYXRpb24oKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgY3VycmVudE1hcmtlci5zZXRBbmltYXRpb24obnVsbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdXJyZW50TWFya2VyLnNldEFuaW1hdGlvbihnb29nbGUubWFwcy5BbmltYXRpb24uQk9VTkNFKTtcbiAgICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgY3VycmVudE1hcmtlci5zZXRBbmltYXRpb24obnVsbCk7XG4gICAgICAgICAgICB9LDcwMCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VsZi50b2dnbGVDb2xvciA9IGZ1bmN0aW9uKGN1cnJlbnRNYXJrZXIpe1xuICAgICAgICBjdXJyZW50TWFya2VyLnNldEljb24ocGlucy5hY3RpdmUucGluSW1hZ2UpO1xuICAgIH07XG5cbiAgICBzZWxmLmFuaW1hdGVNYXJrZXIgPSBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgY3VycmVudE1hcmtlciA9IHRoaXM7XG4gICAgICAgIHNlbGYudG9nZ2xlQ29sb3IoY3VycmVudE1hcmtlcik7XG4gICAgICAgIHNlbGYuQm91bmNlKGN1cnJlbnRNYXJrZXIpO1xuICAgIH07XG5cbiAgICBzZWxmLmluaXQoKTtcbn07XG5cblxua28uYXBwbHlCaW5kaW5ncyhuZXcgbXlWaWV3TW9kZWwpO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
