ParkingLocations = new Mongo.Collection(null);
Meteor.subscribe("directory");

Tracker.autorun(function() {
  var myPosition = Session.get("myPosition");
  if (myPosition) {
    Meteor.subscribe("parkings", myPosition.lat, myPosition.lng);
  } else {
    Meteor.subscribe("parkings", 45.4627338, 9.1777323);
  }
});

Tracker.autorun(function() {
  var map = Session.get("map");
  if (map) {
    var selected = Session.get("selected");
    var myPosition = Session.get("myPosition");
    if (selected && myPosition) {
      var park = Parkings.findOne(selected);
      if (park && park.active) {
        gmaps.calcRoute(park.lat, park.lon);

        Tracker.autorun(function() {
          var directions = Session.get("directions");
          if (directions)
            gmaps.setDirections(directions);
        });
      }
      else Router.go('/');
    } else {
      gmaps.clearDirections();
    }
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
    Router.go('/parking/' + this._id);
  }
});

Template.page.rendered = function() {
  var initialized = false;
  gmaps.initialize();

  var firstAccess = localStorage.getItem('firstAccess');
  if (!firstAccess) $('#welcome').modal('show');

  var throttledGeocode = rateLimit(
    function(id, fields) {
    gmaps.reverseGeocode(id, fields);
  }, 250);
  Parkings.find().observeChanges({
    added: function(id, fields) {
      gmaps.placeMarker(id, fields);
      if (!fields.location)
        throttledGeocode(id, fields);
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
    Meteor.call('pickParking', Session.get("selected"));
    Router.go('/');
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
  parkingLocation: function() {
    if (_.isUndefined(this) || _.isNull(this)) return;
    if (!this.location) return this.lat + ', ' + this.lon;
    return this.location;
  },
  eta: function() {
    if (_.isUndefined(this) || _.isNull(this)) return;
    var loc = ParkingLocations.findOne({
      'parkingId': this._id
    });
    if (!loc || !loc.transitInfo) return null;
    return Math.round(loc.transitInfo.duration / 60);
  },
  sharer: function() {
    if (_.isUndefined(this) || _.isNull(this)) return;
    var sharer = Meteor.users.findOne(this.userId);
    if (!sharer) return null;
    if (sharer.profile) return sharer.profile.name;
    return sharer.emails[0].address;
  },
  status: function() {
    if (_.isUndefined(this) || _.isNull(this)) return;
    var status = this.active;
    if (status) return "Available";
    return "Gone";
  }
});

Template.profile.helpers({
  profileSchema: function() {
    return Schema.profile;
  }
});

AutoForm.hooks({
  'profile-form': {
    onSuccess: function() {
      Router.go('/');
    }
  }
});

Template.welcome.events({
  'click .close, touchend .close': function() {
    LocalStore.set('firstAccess', true);
  }
});
