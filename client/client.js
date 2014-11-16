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

Template.registerHelper('parkingLocation', function(parking) {
  var loc = ParkingLocations.findOne({
    'parkingId': parking._id
  });
  if (!loc) return parking.lat + ', ' + parking.lon;
  if (!loc.transitInfo) return loc.location;
  return loc.location +
    ', distance: ' + loc.transitInfo.distance +
    'm, ETA: ' + loc.transitInfo.duration + 's'
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
}

Template.details.helpers({
  parking: function() {
    return Parkings.findOne(Session.get("selected"));
  }
});

Template.details.events({
  'click .pick': function() {
    Parkings.remove(Session.get("selected"));
  }
});
