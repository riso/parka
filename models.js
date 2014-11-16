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
      freshness: "fresh",
      loc: {
        type: "Point",
        coordinates: [options.lon, options.lat]
      }
    });

    return id;
  }
});
