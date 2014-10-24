gmaps = {
  map: null,
  me: null,
  browserSupport: true,

  placeMarker: function(location) {
    var marker = new google.maps.Marker({
      position: location,
    map: this.map
    })
  },
  grabMyPosition: function() {
    if (navigator.geolocation) {
      gmaps.browserSupport = true;
      navigator.geolocation.getCurrentPosition(this.centerMe, this.noGeoLoc);
    } else {
      gmaps.browserSupport = false;
      this.noGeoLoc()
    }
  },

  noGeoLoc: function() {
    if (gmaps.browserSupport) {
      Session.set("error", "Your Parka was not able to locate you, please share your position.");
    } else {
      Session.set("error", "Upgrade browser please");
    }
    this.map.setCenter(milan);
  },


  centerMe: function(position) {
    var coords = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    this.me = new google.maps.Marker({position: coords, map: gmaps.map});
    gmaps.map.setCenter(coords);
  },


  initialize: function() {

    var mapOptions = {
      zoom: 17,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    this.map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions); 

    var milan = new google.maps.LatLng(45.4627338,9.1777323);
    this.grabMyPosition();
    Session.set("map", true);
  }

}

