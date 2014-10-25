if (Meteor.isClient) {

  Tracker.autorun(function() {
    var myPosition = Session.get("myPosition");
    if (myPosition) {
      Meteor.subscribe("parkings", myPosition.lat, myPosition.lon);
    }
  });

  Template.page.helpers({
    error: function() {
      return Session.get("error");
    },
    parkings: function() {
      return Parkings.find();
    }
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
        var parks = Parkings.find().fetch();
        gmaps.deleteMarkers();
        _.each(parks, function(park) {
          gmaps.placeMarker(park._id, new google.maps.LatLng(park.lat,park.lon));
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
