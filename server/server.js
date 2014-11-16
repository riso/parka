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
