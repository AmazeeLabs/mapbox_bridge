(function ($) {

  /**
   * Mapbox Marker Menu
   */
  Drupal.MapboxMenu = {
    setup: function(layers, context, setting) {

      // insert the "menu"
      $('<div id="info" class="info"></div>').insertAfter('#map');

      // Iterate through each feature layer item, build a
      // marker menu item and enable a click event that pans to + opens
      // a marker that's associated to the marker item.
      layers.eachLayer(function(marker) {

        var link = info.appendChild(document.createElement('a'));
        link.className = 'item';
        link.href = '#';

        // Populate content from each markers object.
        link.innerHTML = marker.feature.properties.nid;
        link.onclick = function() {
          if (/active/.test(this.className)) {
            this.className = this.className.replace(/active/, '').replace(/\s\s*$/, '');
          } else {
            var siblings = info.getElementsByTagName('a');
            for (var i = 0; i < siblings.length; i++) {
              siblings[i].className = siblings[i].className
                .replace(/active/, '').replace(/\s\s*$/, '');
            }

            this.className += ' active';

            // When a menu item is clicked, open its associated marker.
            marker.openPopup();

            // call the MapboxPopup to load the content
            Drupal.MapboxPopup.load('#custom-popup-id-' + marker._leaflet_id, marker, setting.mapboxBridge.popup.popup_viewmode, setting.mapboxBridge);
          }
          return false;
        };
      });
    }
  };
})(jQuery);