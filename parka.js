if (Meteor.isClient) {

  Meteor.subscribe("parkings");


  Template.page.helpers({
    error: function() {
      return Session.get("error");
    }
  });

  Template.page.rendered = function() {
    if (!Session.get('map'))
      gmaps.initialize();

    google.maps.event.addListener(gmaps.map, 'click', function(event) {
      Meteor.call('addParking', {lat: event.latLng.lat(), lon: event.latLng.lng()});
      gmaps.placeMarker(event.latLng);
    });

    var self = this;

    if (!self.handle) {
      self.handle = Tracker.autorun(function() {
        var parks = Parkings.find().fetch();
        _.each(parks, function(park) {
          gmaps.placeMarker(new google.maps.LatLng(park.lat,park.lon));
        });
      });
    }
  }

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });

  Meteor.publish("parkings", function () {
    return Parkings.find();
  });
}
