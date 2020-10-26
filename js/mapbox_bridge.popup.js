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

        var popup = new mapboxgl.Popup({
          className: 'custom-popup-content loading ' + className,
          anchor: 'bottom-left',
        }).setLngLat(coordinates)
          .setHTML('<p>Loading...</p>')
          .addTo(map);

        map.flyTo({
          center: e.features[0].geometry.coordinates
        });

        setTimeout(function (){
          Drupal.MapboxContent.load('.'+className, entityId, settings).then(function (data){
            popup.setHTML(data.html);
            data.element.removeClass('loading');
          }).catch(function (error){
            popup.setHTML(error.status);
            error.element.removeClass('loading');
            console.error(error);
          });
        },500);
      });
    }
  };
})(jQuery);
