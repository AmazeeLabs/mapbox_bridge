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
          minWidth: 150,
          className: 'popup-nid-' + layer.feature.properties.nid
        });

        Drupal.Mapbox.map.on('popupopen', function(e) {
          Drupal.MapboxPopup.activePopup = e;

          $('#custom-popup-id-' + layer._leaflet_id).once(function(){

            // get the marker
            if (typeof e.popup._source != 'undefined') {
              marker = e.popup._source;
            }

            Drupal.MapboxContent.load('#custom-popup-id-' + marker._leaflet_id, marker, viewmode, settings, function($this){
              // check if we are handling a popup
              var $content = $('> div:first-child', $this);

              // gracefully slide in the content
              $content
                .css({
                  width: $this.width() + 'px', // to fix jQuery's jumpy sliding effect
                  opacity: 0
                })
                .slideDown('fast').after(function(){
                  $content.animate({
                    opacity: 1
                  }, 'normal');
                });

              // center the newly clicked marker
              var px = Drupal.Mapbox.map.project(marker._latlng); // find the pixel location on the map where the popup anchor is
              px.y -= marker._popup._container.clientHeight / 2; // find the height of the popup container, divide by 2, subtract from the Y axis of marker location

              // panTo
              if (settings.popup.panTo) {
                Drupal.Mapbox.map.panTo( marker.getLatLng() );
              } else {
                Drupal.Mapbox.map.panTo( Drupal.Mapbox.map.unproject(px) );
              }
            });
          });
        });
      });
    }
  };
})(jQuery);