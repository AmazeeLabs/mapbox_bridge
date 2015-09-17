(function ($) {

  /**
   * Mapbox Marker Menu
   */
  Drupal.MapboxMenu = {
    setup: function(layers, context, setting) {

      // insert the "menu"
      $('<div id="mapbox-marker-menu" class="mapbox-marker-menu menu-wrapper"></div>').insertAfter('#map');

      // get the wrapper
      var menu = document.getElementById('mapbox-marker-menu');

      // Iterate through each feature layer item, build a
      // marker menu item and enable a click event that pans to + opens
      // a marker that's associated to the marker item.
      layers.eachLayer(function(marker) {

        var link = menu.appendChild(document.createElement('a'));
        link.className = 'menu-item loading menu-item-nid-' + marker.feature.properties.nid;
        link.href = '#';
        link.setAttribute('id', 'menu-item-id-' + marker._leaflet_id);

        // load the specified contents into the navigation
        Drupal.MapboxContent.load('#menu-item-id-' + marker._leaflet_id, marker, setting);

        // Populate content from each markers object.
        link.innerHTML = marker.feature.properties.nid;
        link.onclick = function() {
          if (/active/.test(this.className)) {
            this.className = this.className.replace(/active/, '').replace(/\s\s*$/, '');
          } else {
            var siblings = menu.getElementsByTagName('a');
            for (var i = 0; i < siblings.length; i++) {
              siblings[i].className = siblings[i].className
                .replace(/active/, '').replace(/\s\s*$/, '');
            }

            this.className += ' active';

            // When a menu item is clicked, open its associated marker.
            marker.openPopup();
          }
          return false;
        };
      });

      Drupal.Mapbox.map.on('popupopen', function(event) {
        var marker = event.popup._source;

        $('.menu-item-nid-' + marker.feature.properties.nid).addClass('active');
      }).on('popupclose', function(event) {
        var marker = event.popup._source;

        $('.menu-item-nid-' + marker.feature.properties.nid).removeClass('active');
      });
    }
  };
})(jQuery);