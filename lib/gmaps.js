gmaps = {
  map: null,
  geocoder: null,
  directionsService: null,
  directionsDisplay: null,
  me: null,
  markers: [],
  browserSupport: true,

  getIcon: function(freshness) {
    var icon = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
    if (freshness === 'old') {
      icon = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
    }
    if (freshness === 'medium') {
      icon = 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
    }
    return icon;
  },

  placeMarker: function(id, location, freshness) {
    var icon = gmaps.getIcon(freshness);
    var marker = new google.maps.Marker({
      position: location,
      map: gmaps.map,
      icon: icon
    });
    marker.parkingId = id;
    gmaps.markers.push(marker);
    google.maps.event.addListener(marker, 'click', function() {
      Session.set("selected", id);
    });
  },

  updateMarker: function(id, freshness) {
    _.map(gmaps.markers, function(marker) {
      if (marker.parkingId === id) {
        marker.setIcon(gmaps.getIcon(freshness));
      }
    });
  },

  reverseGeocode: function(parkingId, location) {
    gmaps.geocoder.geocode({'latLng': location}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (results[0]) {
          ParkingLocations.insert({
            parkingId: parkingId, 
            location: results[0].formatted_address
          });
        } else {
          console.log('No results found');
          return;
        }
      } else {
        console.log('Geocoder failed due to: ' + status);
        return;
      }
    });
  },

  centerMe: function(position) {
    console.log("in center me");
    var image = '/car.png'
    gmaps.me = new google.maps.Marker({position: position, map: gmaps.map, icon: image});
    gmaps.map.setCenter(position);
  },

  noGeoLoc: function() {
    if (gmaps.browserSupport) {
      Session.set("error", "Your Parka was not able to locate you, please share your position.");
    } else {
      Session.set("error", "Upgrade browser please");
    }
    var milan = new google.maps.LatLng(45.4627338,9.1777323);
    gmaps.map.setCenter(milan);
  },

  deleteMarker: function(id) {
    gmaps.markers = _.reject(gmaps.markers, function(marker) {
      if (marker.parkingId === id) {
        marker.setMap(null);
        return marker;
      }
    });
  },

  deleteMarkers: function() {
    _.each(gmaps.markers, function(marker) {marker.setMap(null);});
    gmaps.markers = [];
  },

  zoomMap: function() {
    var markerPositions = _.map(gmaps.markers, function(marker) { return marker.getPosition(); });

    var bounds = new google.maps.LatLngBounds();
    _.each(markerPositions, function(markerPosition) {bounds.extend(markerPosition);});

    if (gmaps.me) {
      var myPos = gmaps.me.getPosition();
      bounds.extend(myPos);
      var ne = bounds.getNorthEast();
      var sw = bounds.getSouthWest();
      var newSWLat, newSWLon, newNELat, newSWLon;
      if (Math.abs(myPos.lat() - ne.lat()) > Math.abs(myPos.lat() - sw.lat())){
        newNELat = ne.lat();
        newSWLat = myPos.lat() - Math.abs(myPos.lat() - ne.lat());
      } else {
        newSWLat = sw.lat();
        newNELat = myPos.lat() + Math.abs(myPos.lat() - sw.lat());
      }

      if (Math.abs(myPos.lng() - ne.lng()) > Math.abs(myPos.lng() - sw.lng())){
        newNELon = ne.lng();
        newSWLon = myPos.lng() - Math.abs(myPos.lng() - ne.lng());
      } else {
        newSWLon = sw.lng();
        newNELon = myPos.lng() + Math.abs(myPos.lng() - sw.lng());
      }

      bounds = new google.maps.LatLngBounds(new google.maps.LatLng(newSWLat, newSWLon), new google.maps.LatLng(newNELat, newNELon));

    }

    gmaps.map.fitBounds(bounds);
  },

  calcRoute: function(lat, lon) {
    if (!gmaps.me) return;
    var destination = new google.maps.LatLng(lat, lon);
    var request = {
      origin: gmaps.me.getPosition(),
      destination: destination,
      travelMode: google.maps.TravelMode.DRIVING
    };
    gmaps.directionsService.route(request, function(response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        gmaps.directionsDisplay.setDirections(response);
        var route = response.routes[0];
        var transitInfo = _.reduce(route.legs, function(acc, leg) {
          return {
            distance: acc.distance + leg.distance.value, 
            duration: acc.distance + leg.duration.value
          };
        }, {distance: 0, duration: 0});
        ParkingLocations.update({parkingId: Session.get("selected")}, {$set: {'transitInfo': transitInfo}});
      }
    });
  },

  initialize: function() {

    var mapOptions = {
      zoom: 17,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    gmaps.geocoder = new google.maps.Geocoder();
    var directionOptions = {
      suppressMarkers: true,
      preserveViewport: true
    }

    gmaps.directionsDisplay = new google.maps.DirectionsRenderer(directionOptions);
    gmaps.directionsService = new google.maps.DirectionsService();
    gmaps.map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions); 
    var milan = new google.maps.LatLng(45.4627338,9.1777323);
    gmaps.map.setCenter(milan);
    gmaps.directionsDisplay.setMap(gmaps.map);
    Session.set("map", true);
  }

}

