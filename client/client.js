ParkingLocations = new Mongo.Collection(null);

Tracker.autorun(function() {
  var myPosition = Session.get("myPosition");
  if (myPosition) {
    Meteor.subscribe("parkings", myPosition.lat, myPosition.lng);
  }
});

Tracker.autorun(function() {
  var selected = Session.get("selected");
  if (selected) {
    var park = Parkings.findOne(selected);
    if (park) gmaps.calcRoute(park.lat, park.lon);
  }
});


Template.registerHelper('isCordova', function() {
  return Meteor.isCordova;
});

Template.page.helpers({
  error: function() {
    return Session.get("error");
  },
  parkings: function() {
    return Parkings.find();
  },
  selected: function() {
    if (this._id === Session.get("selected")) return "active";
    return "";
  }
});

Template.page.events({
  'click .list-group-item': function() {
    Session.set("selected", this._id);
  }
});

Template.page.rendered = function() {
  var initialized = false;
  gmaps.initialize();

  Parkings.find().observeChanges({
    added: function(id, fields) {
      gmaps.placeMarker(id, fields);
      gmaps.reverseGeocode(id, fields);
      // TODO readd gmaps.zoomMap();
    },
    removed: function(id) {
      gmaps.deleteMarker(id);
      // TODO readd gmaps.zoomMap();
    },
    changed: function(id, fields) {
      gmaps.updateMarker(id, fields.freshness);
    }
  });

  Tracker.autorun(function() {
    var latLng = Geolocation.latLng();
    if (latLng) {
      gmaps.centerMe(latLng);
      if (!initialized) {
        gmaps.map.setCenter(latLng);
        initialized = true;
      }
      Session.set("myPosition", {
        lat: latLng.lat,
        lng: latLng.lng
      });
    }
  });
  Tracker.autorun(function() {
    var error = Geolocation.error();
    if (error && !Session.get("myPosition")) {
      Session.set("myPosition", {
        lat: 45.4627338,
        lng: 9.1777323
      });
    }
  });
};

Template.details.helpers({
  parking: function() {
    return Parkings.findOne(Session.get("selected"));
  }
});

Template.details.events({
  'click .pick, touchend .pick': function() {
    var park = Parkings.findOne(Session.get("selected"));
    Parkings.remove(Session.get("selected"));
    if (Meteor.isCordova) {
      var myPosition = Session.get("myPosition");
      plugin.google.maps.external.launchNavigation({
        'from': gmaps.getLatLng(myPosition.lat, myPosition.lng),
        'to': gmaps.getLatLng(park.lat, park.lon),
        'travelMode': 'driving'
      });
    }
  }
});

Template.parkingInfo.helpers({
  parkingLocation: function(parking) {
    var loc = ParkingLocations.findOne({
      'parkingId': parking._id
    });
    if (!loc) return parking.lat + ', ' + parking.lon;
    return loc.location;
  },
  eta: function(parking) {
    var loc = ParkingLocations.findOne({
      'parkingId': parking._id
    });
    if (!loc || !loc.transitInfo) return null;
    return Math.round(loc.transitInfo.duration / 60);
  },
  sharer: function(parking) {
    var sharer = Meteor.users.findOne(parking.userId);
    if (!sharer) return null;
    return sharer.profile.name;
  }
});
