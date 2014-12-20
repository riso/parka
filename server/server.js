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
  return Parkings.find({ $and: [{
    loc: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lon, lat]
        }
      }
    }
  }, {
    active: true
  }]}, {
    limit: 5
  });
});

Meteor.publish('parking', function(id) {
  return Parkings.find(id);
});

Meteor.publish("directory", function () {
  return Meteor.users.find({}, {fields: {emails: 1, profile: 1}});
});
