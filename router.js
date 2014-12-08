Router.route('/', function() {
  this.render('details');
}, {
  layoutTemplate: 'page'
});

Router.route('/parking/:_id',  {
  name: 'parking',
  layoutTemplate: 'page',
  waitOn: function() {
    return Meteor.subscribe('parking', this.params._id);
  },
  action: function() {
    if (this.ready()) {
      this.render('details', {
        data: function() {
          var parking = Parkings.findOne({_id: this.params._id});
          if (parking)
            Session.set("selected", parking._id);
          return parking;
        }
      });
    }
  }
});
