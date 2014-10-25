if (Meteor.isClient) {

  ParkingLocations = new Mongo.Collection(null);

  Tracker.autorun(function() {
    var myPosition = Session.get("myPosition");
    if (myPosition) {
      Meteor.subscribe("parkings", myPosition.lat, myPosition.lon);
    }
  });

  Template.registerHelper('parkingLocation', function(parking) {
    var loc = ParkingLocations.findOne({'parkingId': parking._id});
    if (!loc) return parking.lat + ', ' + parking.lon;
    return loc.location;
  });

  Template.page.helpers({
    error: function() {
      return Session.get("error");
    },
    parkings: function() {
      return Parkings.find();
    },
  });

  Template.page.rendered = function() {
    if (!Session.get('map'))
      gmaps.initialize();


    google.maps.event.addListener(gmaps.map, 'click', function(event) {
      Meteor.call('addParking', {lat: event.latLng.lat(), lon: event.latLng.lng()},
                  function(error, id) {
                    gmaps.placeMarker(id, event.latLng);
                  });
    });

    var self = this;

    if (!self.handle) {
      self.handle = Tracker.autorun(function() {
        var parks = Parkings.find().observeChanges({
          added: function(id, fields) {
            var latlng = new google.maps.LatLng(fields.lat, fields.lon);
            gmaps.placeMarker(id, latlng);
            gmaps.reverseGeocode(id, latlng);
          },
          removed: function(id) {
            gmaps.deleteMarker(id);
          }
        });
      });
    }
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

}

if (Meteor.isServer) {
  Meteor.startup(function () {
  });

  Meteor.publish("parkings", function (lat, lon) {
    return Parkings.find({loc: {$near: { $geometry: {type: "Point", coordinates: [lon, lat]}}}}, {limit: 5});
  });
}
