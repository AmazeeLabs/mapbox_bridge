(function ($) {

  /**
   * Mapbox / Leaflet popups
   *
   * @see http://leafletjs.com/reference.html#popup
   */
  Drupal.MapboxPopup = {
    load: function (map, layerName, settings){
      map.on('click', layerName, function (e) {
        var coordinates = e.features[0].geometry.coordinates.slice();
        var entityId = e.features[0].properties.popup_entity_id;
        if(e.features[0].properties.type === "custom"){
          entityId = e.features[0].properties.nid;
        }

        var className = 'custom-popup-id-' + entityId;

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        var height = 0;
        var topOffset = 70 / 2;
        var data = $.parseJSON(settings.data);
        if(typeof data[0] !== 'undefined' && data[0].iconHeight){
          height = data[0].iconHeight;
        }
        if(height > 0) {
          topOffset = (height * settings.iconMultiplier) / 2;
        }
        var popup = new mapboxgl.Popup({
          className: 'custom-popup-content loading ' + className,
          anchor: 'bottom-left',
          offset: [0, -topOffset],
        }).setLngLat(coordinates)
          .setHTML('<p>Loading...</p>')
          .addTo(map);

        map.flyTo({
          center: e.features[0].geometry.coordinates
        });

        setTimeout(function (){
          Drupal.MapboxContent.load('.'+className, entityId, settings).then(function (data){;
            popup.setHTML(data.html);
            data.element.removeClass('loading');
          }).catch(function (error){
            popup.setHTML(error.status);
            error.element.removeClass('loading');
            console.error(error);
          });
        },500);
      });

      // Change the cursor to a pointer when the mouse is over the places layer.
      map.on('mouseenter', layerName, function () {
        map.getCanvas().style.cursor = 'pointer';
      });

      // Change it back to a pointer when it leaves.
      map.on('mouseleave', layerName, function () {
        map.getCanvas().style.cursor = '';
      });
    }
  };
})(jQuery);
