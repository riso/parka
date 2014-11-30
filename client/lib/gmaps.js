gmaps = {
  map: null,
  geocoder: null,
  directionsService: null,
  directionsDisplay: null,
  me: null,
  markers: [],
  route: null,
  browserSupport: true,

  // gmaps js api and cordova plugin wrapper

  getMapType: function() {
    if (!Meteor.isCordova)
      return google.maps.MapTypeId.ROADMAP;
    return plugin.google.maps.MapTypeId.ROADMAP;
  },
  getAddEvent: function() {
    if (!Meteor.isCordova)
      return 'dblclick';
    return plugin.google.maps.event.MAP_LONG_CLICK;
  },
  getSelectEvent: function() {
    if (!Meteor.isCordova)
      return 'click';
    return plugin.google.maps.event.MAP_CLICK;
  },
  getFormattedAddress: function(result) {
    if (!Meteor.isCordova) {
      var comp = _.find(result.address_components, function(component) {
        return component.types[0] === 'route';
      });
      return comp.short_name;
    }
    return _.compact([
      result.subThoroughfare || "",
      result.thoroughfare || "",
      result.locality || "",
      result.adminArea || "",
      result.postalCode || "",
      result.country || ""
    ]).join(", ");
  },
  // map(domnode, mapOptions)
  getMap: function(node, options) {
    if (!Meteor.isCordova)
      return new google.maps.Map(node, options);
    var zoom = options.zoom;
    var map = plugin.google.maps.Map.getMap({
      'mapType': options.mapTypeId,
      'controls': {
        'compass': false,
        'zoom': false
      }
    });
    map.setDiv(node);
    map.setZoom(zoom);
    return map;
  },
  // map.setCenter(latLng) ~ not needed, same API
  // latLng(lat, lng)
  getLatLng: function(lat, lng) {
    if (!Meteor.isCordova)
      return new google.maps.LatLng(lat, lng);
    return new plugin.google.maps.LatLng(lat, lng);
  },
  // lat = latlng.lat()
  getLat: function(latLng) {
    if (!Meteor.isCordova)
      return latLng.lat();
    return latLng.lat;
  },
  // lng = latlng.lng()
  getLng: function(latLng) {
    if (!Meteor.isCordova)
      return latLng.lng();
    return latLng.lng;
  },
  // marker(latLng, map, icon)
  getMarker: function(latLng, map, icon, callback) {
    if (!Meteor.isCordova)
      return callback(new google.maps.Marker({
        position: latLng,
        map: map,
        icon: icon
      }));
    map.addMarker({
      position: latLng,
      icon: icon
    }, callback);
  },
  // latlng = marker.getPosition()
  getMarkerPosition: function(marker, callback) {
    if (!Meteor.isCordova)
      return callback(marker.getPosition());
    return marker.getPosition(callback);
  },
  // marker.setIcon(icon)
  // marker.setPosition(lagLng) ~ not needed, same API
  // marker.setMap(map)
  removeMarker: function(marker) {
    if (!Meteor.isCordova)
      return marker.setMap(null);
    return marker.remove();
  },
  // event.addListener(object, event, callback)
  addListener: function(map, event, callback) {
    if (!Meteor.isCordova) {
      return google.maps.event.addListener(map, event, function(evt) {
        callback(evt.latLng);
      });
    }
    return map.on(event, callback);
  },
  addMarkerListener: function(marker, event, callback) {
    if (!Meteor.isCordova)
      return google.maps.event.addListener(marker, event, callback);
    return marker.addEventListener(event, callback);
  },
  // geocoder
  getGeocoder: function() {
    if (!Meteor.isCordova)
      return new google.maps.Geocoder();
    return plugin.google.maps.Geocoder;
  },
  // geocoder.geocode(latlng, callback)
  geocode: function(latLng, callback) {
    if (!Meteor.isCordova)
      return gmaps.geocoder.geocode({
        'latLng': latLng
      }, function(results, status) {
        if (status !== google.maps.GeocoderStatus.OK) return callback([]);
        callback(results);
      });
    return gmaps.geocoder.geocode({
      'position': latLng
    }, callback);
  },
  // v2: latlngbounds
  // v2: latlngbounds(latlng, latlng)
  // v2: latlngbounds.extend(latlng)
  // v2: latlng = latlngbounds.getNorthWest()
  // v2: latlng = latlngbounds.getNorthWest()
  // v2: map.fitBounds(latlngbounds)
  // v3: directionsService.route(request, callback(response, status))
  // v3: directionsDisplay.setDirections(response)
  setDirections: function(response) {
    if (!Meteor.isCordova)
      return gmaps.directionsDisplay.setDirections(response);
    var route = response.routes[0];
    var points = _.map(route.overview_path, function(latLng) {
      return new plugin.google.maps.LatLng(latLng.lat(), latLng.lng());
    });
    if (gmaps.route) gmaps.route.remove();
    return gmaps.map.addPolyline({
        points: points,
        'color': '#000',
        'width': 2,
        'geodesic': false
      },
      function(route) {
        gmaps.route = route;
      });
  },
  // v3: directionsResponse
  // v3: directionsStatus
  // v3: directionsRenderer(directionOptions)
  getDirectionsRenderer: function(options) {
    if (!Meteor.isCordova)
      return new google.maps.DirectionsRenderer(options);
    return null;
  },
  // v3: directionsDisplay.setMap(map)
  setDirectionsRendererMap: function(map) {
    if (!Meteor.isCordova)
      return gmaps.directionsDisplay.setMap(map);
    return;
  },
  // v3: directionsService
  getDirectionsService: function() {
    return new google.maps.DirectionsService();
  },

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
    var latlng = gmaps.getLatLng(fields.lat, fields.lon);
    var icon = gmaps.getIcon(fields.freshness);
    gmaps.getMarker(latlng, gmaps.map, icon, function(marker) {
      marker.parkingId = id;
      gmaps.markers.push(marker);
      gmaps.addMarkerListener(marker, gmaps.getSelectEvent(), function() {
        Session.set("selected", id);
      });
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
    var latlng = gmaps.getLatLng(fields.lat, fields.lon);
    gmaps.geocode(latlng, function(results) {
      if (results.length) {
        if (results[0]) {
          ParkingLocations.insert({
            parkingId: parkingId,
            location: gmaps.getFormattedAddress(results[0])
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
    var image = Meteor.isCordova ? 'www/application/car.png' : '/car.png';
    var position = gmaps.getLatLng(latLng.lat, latLng.lng);
    if (gmaps.me) {
      gmaps.me.setPosition(position);
    } else {
      gmaps.getMarker(position, gmaps.map, image, function(marker) {
        gmaps.me = marker;
      });
    }
    gmaps.map.setCenter(position);
  },

  noGeoLoc: function() {
    if (gmaps.browserSupport) {
      Session.set("error", "Your Parka was not able to locate you, please share your position.");
    } else {
      Session.set("error", "Upgrade browser please");
    }
    var milan = new google.maps.LatLng(45.4627338, 9.1777323);
    gmaps.map.setCenter(milan);
  },

  deleteMarker: function(id) {
    gmaps.markers = _.reject(gmaps.markers, function(marker) {
      if (marker.parkingId === id) {
        gmaps.removeMarker(marker);
        return marker;
      }
    });
  },

  deleteMarkers: function() {
    _.each(gmaps.markers, function(marker) {
      gmaps.deleteMarker(marker);
    });
    gmaps.markers = [];
  },

  zoomMap: function() {
    var markerPositions = _.map(gmaps.markers, function(marker) {
      return marker.getPosition();
    });

    var bounds = new google.maps.LatLngBounds();
    _.each(markerPositions, function(markerPosition) {
      bounds.extend(markerPosition);
    });

    if (gmaps.me) {
      var myPos = gmaps.me.getPosition();
      bounds.extend(myPos);
      var ne = bounds.getNorthEast();
      var sw = bounds.getSouthWest();
      var newSWLat, newSWLon, newNELat, newSWLon;
      if (Math.abs(myPos.lat() - ne.lat()) > Math.abs(myPos.lat() - sw.lat())) {
        newNELat = ne.lat();
        newSWLat = myPos.lat() - Math.abs(myPos.lat() - ne.lat());
      } else {
        newSWLat = sw.lat();
        newNELat = myPos.lat() + Math.abs(myPos.lat() - sw.lat());
      }

      if (Math.abs(myPos.lng() - ne.lng()) > Math.abs(myPos.lng() - sw.lng())) {
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
    var origin;
    gmaps.getMarkerPosition(gmaps.me, function(latlng) {
      var request = {
        origin: new google.maps.LatLng(gmaps.getLat(latlng), gmaps.getLng(latlng)),
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING
      };
      gmaps.directionsService.route(request, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          gmaps.setDirections(response);
          var route = response.routes[0];
          var transitInfo = _.reduce(route.legs, function(acc, leg) {
            return {
              distance: acc.distance + leg.distance.value,
              duration: acc.distance + leg.duration.value
            };
          }, {
            distance: 0,
            duration: 0
          });
          ParkingLocations.update({
            parkingId: Session.get("selected")
          }, {
            $set: {
              'transitInfo': transitInfo
            }
          });
        }
      });
    });
  },

  initialize: function() {

    var mapOptions = {
      zoom: 17,
      mapTypeId: gmaps.getMapType()
    };

    gmaps.map = gmaps.getMap(document.getElementById("map-canvas"), mapOptions);

    gmaps.geocoder = gmaps.getGeocoder();

    var milan = gmaps.getLatLng(45.4627338, 9.1777323);
    gmaps.map.setCenter(milan);

    var directionOptions = {
      suppressMarkers: true,
      preserveViewport: true
    }

    gmaps.directionsService = gmaps.getDirectionsService();
    gmaps.directionsDisplay = gmaps.getDirectionsRenderer(directionOptions);
    gmaps.setDirectionsRendererMap(gmaps.map);

    gmaps.addListener(gmaps.map, gmaps.getAddEvent(), function(latLng) {
      Meteor.call('addParking', {
        lat: gmaps.getLat(latLng),
        lon: gmaps.getLng(latLng)
      });
    });

    Session.set("map", true);
  }

}
