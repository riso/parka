Tracker.autorun(function() {
  Router.onBeforeAction(function() {
    var firstAccess = LocalStore.get('firstAccess');
    if (!firstAccess) this.render('welcome', {to: 'welcome'});
    else this.render(null, {to: 'welcome'});
    this.next();
  });
});

Router.route('/', function() {
  Session.set("selected", null);
  this.render('details');
}, {
  name: 'home',
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
          if (parking && !Session.equals("selected", parking._id)) {
            Session.set("selected", parking._id);
          }
          return parking;
        }
      });
    }
  }
});

Router.route('/profile', {
  name: 'profile',
  action: function() {
    this.render('profile', {
      data: function() {
        var user = Meteor.user();
        if (!user) return null;
        return user.profile;
      }
    });
  }
});
