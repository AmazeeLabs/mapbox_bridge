(function ($) {

  /**
   * Mapbox / Leaflet popups
   *
   * @see http://leafletjs.com/reference.html#popup
   */
  Drupal.MapboxPopup = {
    popups: function (layers, viewmode, settings) {
      // go through each group, then through each layer
      layers.eachLayer(function(layer) {

        // This is an empty container that we will replace via ajax
        var content = '<div class="custom-popup-content loading" id="custom-popup-id-' + layer._leaflet_id + '"><\/div>';

        // setup a minimum with for the popup, see http://leafletjs.com/reference.html#popup for other options
        layer.bindPopup(content, {
          minWidth: 150
        })
          // Bind popups to a click event
          .on('click', function(marker) {
            if (typeof marker.target != 'undefined') {
              marker = marker.target;
            }

            Drupal.MapboxPopup.load('#custom-popup-id-' + marker._leaflet_id, marker, viewmode, settings);
          });
      });
    },

    load: function (target, marker, viewmode, settings) {
      var path = '';
      if (settings.path_settings.domain_variant) {
        path += '/' + settings.path_settings.domain_variant;
      }

      if (settings.path_settings.language) {
        path += '/' + settings.path_settings.language;
      }

      path += '/mapbox_bridge_ajax_content/' + viewmode + '/' + marker.feature.properties.nid;

      // load the node with the supplied viewmode
      $(target).load(path, function(content){
        var $this = $(this),
          $content = $('> div:first-child', $this);

        // gracefully slide in the content
        $content
          .css({
            width: $this.width() + 'px', // to fix jQuery's jumpy sliding effect
            opacity: 0
          })
          .slideDown('normal').after(function(){
            $content.animate({
              opacity: 1
            }, 'fast');
          });

        // remove loading indicator
        $this.removeClass('loading');

        // center the newly clicked marker
        var px = Drupal.Mapbox.map.project(marker._latlng); // find the pixel location on the map where the popup anchor is
        px.y -= marker._popup._container.clientHeight / 2; // find the height of the popup container, divide by 2, subtract from the Y axis of marker location

        Drupal.Mapbox.map.panTo( Drupal.Mapbox.map.unproject(px), { animate: true }); // pan to new center
      });
    }
  };
})(jQuery);