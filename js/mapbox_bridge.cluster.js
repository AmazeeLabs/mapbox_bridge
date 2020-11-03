(function ($) {

  /**
   * Mapbox / Leaflet popups
   *
   * @see http://leafletjs.com/reference.html#popup
   */
  Drupal.MapboxCluster = {
    setup: function (map, dataLayer, setting){
      var cluster = {
        id: 'cluster', // the layer's ID
        source: dataLayer,
        type: 'circle', // the layer type,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count']
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
          ]
        }
      };

      var currentClusterSize = 20;
      var clusterIncrement = 1;
      $.each(setting.mapboxBridge.clusterStyles, function (index, style) {
        var isNumber = false;
        var value = style;

        // check for a number
        if (!isNaN(value)) {
          value = parseInt(value);
          isNumber = true;
        }

        // fill in the values for the colours
        cluster.paint['circle-color'].push(value);

        // generate the radius values
        if (isNumber) {
          cluster.paint['circle-radius'].push(currentClusterSize);
          cluster.paint['circle-radius'].push(value);
          currentClusterSize += clusterIncrement;
        }
      });

      // add the final radius value
      if (cluster.paint['circle-radius'].length > 2 && cluster.paint['circle-radius'].length < (setting.mapboxBridge.clusterStyles.length + 2)) {
        cluster.paint['circle-radius'].push(currentClusterSize);
      }

      // clustered layer styles
      map.addLayer(cluster);

      // clustered layer number text
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: dataLayer,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: {
          "text-color": setting.mapboxBridge.cluster_text,
        }
      });

      // inspect a cluster on click
      map.on('click', 'cluster', function (e) {
        var features = map.queryRenderedFeatures(e.point, {
          layers: ['cluster']
        });
        var clusterId = features[0].properties.cluster_id;
        map.getSource(dataLayer).getClusterExpansionZoom(
          clusterId,
          function (err, zoom) {
            if (err) return;

            map.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom
            });
          }
        );
      });

      map.on('mouseenter', 'cluster', function () {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'cluster', function () {
        map.getCanvas().style.cursor = '';
      });
    }
  };
})(jQuery);
