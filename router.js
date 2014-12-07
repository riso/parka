Router.route('/', function() {
  Session.set("selected", null);
  this.render('details');
}, {
  layoutTemplate: 'page'
});

Router.route('/parking/:_id', function() {
  this.wait(Meteor.subscribe('parking', this.params._id));
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
}, {
  name: 'parking',
  layoutTemplate: 'page'
});
