gmaps = {
  map: null,
  geocoder: null,
  me: null,
  markers: [],
  browserSupport: true,

  placeMarker: function(id, location) {
    var marker = new google.maps.Marker({
      position: location,
      map: this.map
    });
    marker.parkingId = id;
    gmaps.markers.push(marker);
    google.maps.event.addListener(marker, 'click', function() {
      Session.set("selected", id);
    });
  },

  reverseGeocode: function(parkingId, location) {
    gmaps.geocoder.geocode({'latLng': location}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (results[1]) {
          ParkingLocations.insert({
            parkingId: parkingId, 
            location: results[1].formatted_address
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

  grabMyPosition: function() {
    if (navigator.geolocation) {
      gmaps.browserSupport = true;
      navigator.geolocation.getCurrentPosition(this.centerMe, this.noGeoLoc);
    } else {
      gmaps.browserSupport = false;
      this.noGeoLoc()
    }
  },

  noGeoLoc: function() {
    if (gmaps.browserSupport) {
      Session.set("error", "Your Parka was not able to locate you, please share your position.");
    } else {
      Session.set("error", "Upgrade browser please");
    }
    this.map.setCenter(milan);
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

  centerMe: function(position) {
    var coords = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    var image = '/car.png'
    this.me = new google.maps.Marker({position: coords, map: gmaps.map, icon: image});
    gmaps.map.setCenter(coords);
    Session.set("myPosition", {lat: position.coords.latitude, lon: position.coords.longitude});
  },


  initialize: function() {

    var mapOptions = {
      zoom: 17,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    gmaps.geocoder = new google.maps.Geocoder();

    this.map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions); 

    var milan = new google.maps.LatLng(45.4627338,9.1777323);
    this.grabMyPosition();
    Session.set("map", true);
  }

}

