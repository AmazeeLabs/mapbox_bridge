(function ($) {

  /**
   * Mapbox / Leaflet popups
   *
   * @see http://leafletjs.com/reference.html#popup
   */
  Drupal.MapboxPopup = {
    popups: function (groups, viewmode, settings) {
      var eventType = settings.popup.popup_event || 'click';

      // go through each group, then through each layer
      $.each(groups, function(id, layers){
        layers.eachLayer(function(layer) {

          // This is an empty container that we will replace via ajax
          var content = '<div class="custom-popup-content loading" id="custom-popup-id-' + layer._leaflet_id + '"><\/div>';

          // setup a minimum with for the popup, see http://leafletjs.com/reference.html#popup for other options
          layer.bindPopup(content, {
            minWidth: 150
          })
            // Bind popups to an event
            .on(eventType, function(e) {

              // If it's a hover event, we have to open the popup manually.
              if (e.type == 'mouseover') {
                layer.openPopup();
              }

              // load the node with the supplied viewmode
              $( '#custom-popup-id-' + e.target._leaflet_id ).load('/' + settings.path_settings.language + '/mapbox_bridge_ajax_content/' + viewmode + '/' + e.target.options.nid, function(content){
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
                if (e.type == 'click') {
                  var px = Drupal.Mapbox.map.project(e.target._latlng); // find the pixel location on the map where the popup anchor is
                  px.y -= e.target._popup._container.clientHeight / 2; // find the height of the popup container, divide by 2, subtract from the Y axis of marker location

                  Drupal.Mapbox.map.panTo( Drupal.Mapbox.map.unproject(px), { animate: true }); // pan to new center
                }
              });
            });
        });
      });
    }
  };
})(jQuery);