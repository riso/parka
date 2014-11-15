if (Meteor.isClient) {

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
        var latlng = new google.maps.LatLng(fields.lat, fields.lon);
        gmaps.placeMarker(id, latlng, fields.freshness);
        gmaps.reverseGeocode(id, latlng);
        gmaps.zoomMap();
      },
      removed: function(id) {
        gmaps.deleteMarker(id);
        gmaps.zoomMap();
      },
      changed: function(id, fields) {
        gmaps.updateMarker(id, fields.freshness);
      }
    });

    Tracker.autorun(function() {
      var latLng = Geolocation.latLng();
      if (latLng) {
        var myPosition = new google.maps.LatLng(latLng.lat, latLng.lng);
        gmaps.centerMe(myPosition);
        Session.set("myPosition", {
          lat: myPosition.lat(),
          lng: myPosition.lng()
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
    google.maps.event.addListener(gmaps.map, 'dblclick', function(event) {
      Meteor.call('addParking', {
        lat: event.latLng.lat(),
        lon: event.latLng.lng()
      });
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

}

if (Meteor.isServer) {

  Meteor.startup(function() {
    Parkings._ensureIndex({
      'loc': '2dsphere'
    });
    Parkings.find().observeChanges({
      added: function(id, fields) {
        if (!fields.freshness) Parkings.update(id, {
          $set: {
            'freshness': 'old'
          }
        });
        if (fields.freshness === 'medium')
          Meteor.setTimeout(function() {
            Parkings.update(id, {
              $set: {
                'freshness': 'old'
              }
            });
          }, 4 * 60 * 1000);
        if (fields.freshness === 'fresh') {
          Meteor.setTimeout(function() {
            Parkings.update(id, {
              $set: {
                'freshness': 'medium'
              }
            });
          }, 60 * 1000);
          Meteor.setTimeout(function() {
            Parkings.update(id, {
              $set: {
                'freshness': 'old'
              }
            });
          }, 5 * 60 * 1000);
        }
      }
    });
  });

  Meteor.publish("parkings", function(lat, lon) {
    return Parkings.find({
      loc: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lon, lat]
          }
        }
      }
    }, {
      limit: 5
    });
  });
}
