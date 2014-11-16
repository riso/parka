gmaps = {
  map: null,
  geocoder: null,
  directionsService: null,
  directionsDisplay: null,
  me: null,
  markers: [],
  browserSupport: true,

  // gmaps js api and cordova plugin wrapper

  getMapType: function() {
    if (!Meteor.isCordova)
      return google.maps.MapTypeId.ROADMAP;
    return plugin.google.maps.MapTypeId.ROADMAP;
  },
  // map(domnode, mapOptions)
  buildMap: function(node, options) {
    if (!Meteor.isCordova) 
      return new google.maps.Map(node, options);  
    var zoom = options.zoom;
    var map = plugin.google.maps.Map.getMap({'mapType': gmaps.getMapType()});
    map.setDiv(node);
    map.setZoom(zoom);
    return map;
  },
  // map.setCenter(latLng)
  // latLng(lat, lng)
  // lat = latlng.lat()
  // lng = latlng.lng()
  // marker(latLng, map, icon)
  // marker.setIcon(icon)
  // marker.setPosition(lagLng)
  // marker.setMap(map)
  // latlng = marker.getPosition()
  // event.addListener(object, event, callback)
  // geocoder
  // geocoder.geocode(latlng, callback)
  // v2: latlngbounds
  // v2: latlngbounds(latlng, latlng)
  // v2: latlngbounds.extend(latlng)
  // v2: latlng = latlngbounds.getNorthWest()
  // v2: latlng = latlngbounds.getNorthWest()
  // v2: map.fitBounds(latlngbounds)
  // v3: directionsService.route(request, callback(response, status))
  // v3: directionsDisplay.setDirections(response)
  // v3: directionsResponse
  // v3: directionsStatus
  // v3: directionsRenderer(directionOptions)
  // v3: directionsService
  // v3: directionsDisplay.setMap(map)

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

  placeMarker: function(id, fields) {
    var latlng = new google.maps.LatLng(fields.lat, fields.lon);
    var icon = gmaps.getIcon(fields.freshness);
    var marker = new google.maps.Marker({
      position: latlng,
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

  reverseGeocode: function(parkingId, fields) {
    var latlng = new google.maps.LatLng(fields.lat, fields.lon);
    gmaps.geocoder.geocode({'latLng': latlng}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (results[0]) {
          ParkingLocations.insert({
            parkingId: parkingId, 
            location: results[0].formatted_address
          });
        } else {
          return;
        }
      } else {
        return;
      }
    });
  },

  centerMe: function(latLng) {
    var image = '/car.png'
    var position = new google.maps.LatLng(latLng.lat, latLng.lng);
    if (gmaps.me) gmaps.me.setPosition(position);
    else {
      gmaps.me = new google.maps.Marker({position: position, map: gmaps.map, icon: image});
    }
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

    gmaps.map = gmaps.buildMap(document.getElementById("map-canvas"), mapOptions); 

    gmaps.geocoder = new google.maps.Geocoder();
    var directionOptions = {
      suppressMarkers: true,
      preserveViewport: true
    }

    gmaps.directionsDisplay = new google.maps.DirectionsRenderer(directionOptions);
    gmaps.directionsService = new google.maps.DirectionsService();
    var milan = new google.maps.LatLng(45.4627338,9.1777323);
    gmaps.map.setCenter(milan);
    gmaps.directionsDisplay.setMap(gmaps.map);

    google.maps.event.addListener(gmaps.map, 'dblclick', function(event) {
      Meteor.call('addParking', {
        lat: event.latLng.lat(),
        lon: event.latLng.lng()
      });
    });

    Session.set("map", true);
  }

}

