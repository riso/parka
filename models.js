Parkings = new Mongo.Collection("parkings");

var NonEmptyString = Match.Where(function (x) {
  check(x, String);
  return x.length !== 0;
});

var Latitude = Match.Where(function (x) {
  check(x, Number);
  return x >= -90 && x <= 90;
});

var Longitude = Match.Where(function (x) {
  check(x, Number);
  return x >= -180 && x <= 180;
});

Meteor.methods({
  addParking: function(options) {
    check(options, {
      lat: Latitude,
      lon: Longitude,
      _id: Match.Optional(NonEmptyString)
    });

    var id = options._id || Random.id();

    Parkings.insert({
      _id: id,
      lat: options.lat,
      lon: options.lon,
      userId: Meteor.userId(),
      freshness: "fresh",
      active: true,
      loc: {
        type: "Point",
        coordinates: [options.lon, options.lat]
      }
    });

    return id;
  },
  pickParking: function(id) {
    check(id, NonEmptyString);

    Parkings.update(id, {$set: {'active': false}});
    return id;
  },
  updateProfile: function(profile) {
    // Important server-side check for security and data integrity
    check(profile, Schema.profile);
    Meteor.users.update(Meteor.userId(), {$set: {'profile': profile}});
    return Meteor.userId();
  }
});

Schema = {};
Schema.profile = new SimpleSchema({
  name: {
    type: String,
    label: "Your name",
    max: 50
  },
  email: {
    type: String,
    regEx: SimpleSchema.RegEx.Email,
    label: "E-mail address"
  }
});
