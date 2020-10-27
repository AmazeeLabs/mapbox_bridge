(function ($) {

  Drupal.Mapbox = {};
  Drupal.Mapbox.defaultIcon = '';
  Drupal.Mapbox.icons = {};
  Drupal.Mapbox.layers = {};
  Drupal.Mapbox.filters = {};
  Drupal.Mapbox.geojson = [];
  Drupal.Mapbox.sourceData;
  Drupal.Mapbox.layerData;

  /**
   * Mapbox with very basic setup
   */
  Drupal.behaviors.mapboxBridge = {
    attach: function(context, setting) {
      if (typeof mapboxgl != 'undefined' && $('#map', context).length) {
        $('#map', context).once('mapbox-bridge', function(){

          // access token for mapbox
          mapboxgl.accessToken = setting.mapboxBridge.publicToken;
          Drupal.Mapbox.defaultIcon = "https://api.mapbox.com/v4/marker/pin-m.png?access_token=" + mapboxgl.accessToken;
          
          var mapboxObj = {
            container: 'map', // container id
            style: setting.mapboxBridge.style,
            maxZoom: setting.mapboxBridge.maxZoom,
          }
          if(setting.mapboxBridge.center){
            mapboxObj['center'] = setting.mapboxBridge.center.split(',');
          }
          // Load Mapbox with supplied ID
          Drupal.Mapbox.map = new mapboxgl.Map(mapboxObj);

          // disable some scroll/touch/drag features
          Drupal.Mapbox.map.scrollZoom.disable();
          Drupal.Mapbox.map.dragRotate.disable();
          Drupal.Mapbox.map.touchZoomRotate.disableRotation();

          // add in zoom controls
          var nav = new mapboxgl.NavigationControl({
            showCompass: false,
            showZoom: true
          });
          Drupal.Mapbox.map.addControl(nav, "top-left");

          // Wait until Mapbox is loaded
          Drupal.Mapbox.map.on('load', function() {
            if (typeof setting.mapboxBridge.data != 'undefined' && setting.mapboxBridge.data) {
              $.when(Drupal.behaviors.mapboxBridge.init($.parseJSON(setting.mapboxBridge.data), context, setting)).done(function(){
                Drupal.behaviors.mapboxBridge.alter();
              });
            }
          });
        });
      }
    },
    // end Drupal.behaviors.attach

    /**
     * Initialize base settings
     * */
    init: function(data, context, setting) {
      // // refresh any current data
      Drupal.behaviors.mapboxBridge.refresh();

      // // add markers
      $.each(data, function(index, markerData){
        Drupal.behaviors.mapboxBridge.addMarker(markerData, setting.mapboxBridge);
      });

      // Use the created geojson to load to create a new source data
      // this is all the data of the markers generated in the loop above.
      Drupal.Mapbox.map.addSource('marker-data', {
        type: 'geojson', // specify the kind of data being added
        cluster: setting.mapboxBridge.cluster ? true : false,// have to force a boolean as get invalid number otherwise
        clusterMaxZoom: setting.mapboxBridge.clusterMaxZoom, // Max zoom to cluster points on
        clusterRadius: setting.mapboxBridge.clusterRadius, // Radius of each cluster when clustering points (defaults to 50)
        data: {
          type: 'FeatureCollection',
          features: Drupal.Mapbox.geojson
        }
      });
      Drupal.Mapbox.sourceData = Drupal.Mapbox.map.getSource('marker-data');

      if(setting.mapboxBridge.cluster) {

        var cluster = {
          id: 'cluster', // the layer's ID
          source: 'marker-data',
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
        Drupal.Mapbox.map.addLayer(cluster);

        // clustered layer number text
        Drupal.Mapbox.map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'marker-data',
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
      }

      // unclustered style with custom icons images
      var imageURL = Drupal.Mapbox.defaultIcon // default
      if(typeof data[0] !== 'undefined' && data[0].icon){
        imageURL = data[0].icon;
      }
      Drupal.Mapbox.map.loadImage(imageURL, function(error, image) { //this is where we load the image file
        if (error) throw error;
        Drupal.Mapbox.map.addImage("marker-image", image); //this is where we name the image file we are loading
        Drupal.Mapbox.map.addLayer({
          id: 'unclustered-point',
          type: 'symbol',
          source: 'marker-data',
          // filter: ['!', ['has', 'point_count']],
          'layout': {
            "icon-image": "marker-image", // the name of image file we used above
            "icon-allow-overlap": true,
            "icon-size": setting.mapboxBridge.iconMultiplier //this is a multiplier applied to the standard size. So if you want it half the size put ".5"
          }
        });
        Drupal.Mapbox.layerData = Drupal.Mapbox.map.getLayer('unclustered-point');
      });


      // set the pan & zoom of them map
      if (setting.mapboxBridge.center) {
        Drupal.Mapbox.map.flyTo({
          center: setting.mapboxBridge.center.split(','),
          zoom: setting.mapboxBridge.maxZoom
        });
      } else {
        var bounds = new mapboxgl.LngLatBounds();
        Drupal.Mapbox.geojson.forEach(function(marker, index){
          bounds.extend(marker.geometry.coordinates);
        })
        Drupal.Mapbox.map.fitBounds(bounds, { maxZoom: setting.mapboxBridge.maxZoom, padding: 70 });
      }

      // add the legend if necessary
      // TODO: This will not work in the current version
      if (setting.mapboxBridge.legend) {
        Drupal.behaviors.mapboxBridge.addLegend(setting, data);
      }

      // create the popups
      if (setting.mapboxBridge.popup.enabled) {
        Drupal.MapboxPopup.load(Drupal.Mapbox.map, 'unclustered-point', setting.mapboxBridge);
      }

      // create filters
      // TODO: This will not work in the current version
      if (setting.mapboxBridge.filter.enabled) {
        Drupal.MapboxFilter.filter(Drupal.Mapbox.featureLayer, setting.mapboxBridge.cluster, context, setting);
      }

      // create menu
      // TODO: This will not work in the current version
      if (setting.mapboxBridge.marker_menu.enabled) {
        Drupal.MapboxMenu.setup(Drupal.Mapbox.featureLayer, context, setting);
      }

      // check for touch devices and disable pan and zoom
      if ('ontouchstart' in document.documentElement) {
        Drupal.behaviors.mapboxBridge.panAndZoom(false);
      }

      // enable proximity search
      // TODO: This will not work in the current version
      if (setting.mapboxBridge.proximity.enabled) {
        // See: https://docs.mapbox.com/mapbox-gl-js/example/mapbox-gl-geocoder/
        Drupal.Mapbox.map.addControl(L.mapbox.geocoderControl('mapbox.places', {
          autocomplete: true
        }));

        // place the proximity wrapper at the top
        $('<div id="mapbox-proximity" class="mapbox-proximity"><h3>' + setting.mapboxBridge.proximity.label + '</h3></div>').prependTo($('#map').parent());

        // move the proximity search from inside the mapbox to the top
        $('.leaflet-control-mapbox-geocoder').appendTo('#mapbox-proximity');

        // change the behaviour of the proximity search
        var $resultsContainer = $('.leaflet-control-mapbox-geocoder-results');
        $resultsContainer.bind("DOMSubtreeModified propertychange",function(){
          $resultsContainer.find('a').once(function(){
            $(this).on('click', function(){
              $resultsContainer.hide();
            });
          });
        });

        $('.leaflet-control-mapbox-geocoder-form input[type=text]').attr('placeholder', Drupal.t('Search')).on('focus', function(){
          $resultsContainer.show();
        });
      }
    },

    /**
    * Build marker geojson
    * */
    addMarker: function(markerData, setting) {
      if (markerData.lat && markerData.lon) {
        var iconURL = Drupal.Mapbox.defaultIcon // default
        if (markerData.icon) {
          iconURL = markerData.icon;
        }
        Drupal.Mapbox.icons[markerData.name] = {
          name: markerData.name,
          iconUrl: iconURL,
        };

        // setup the filter properties
        if (setting.filter.enabled) {

          var filter = {};
          $.each(setting.filter.filter_fields, function(i, filter_field){
            // filter_field are entered with a type definition ":type", we need to cut this off here.
            var words = filter_field.split(':');
            filter_field = words[0];
            if (typeof markerData[filter_field] != 'undefined') {
              var filter_type = words[1];
              // The translated label, if we have it, should be on the third
              // position.
              var translated_label = words[0];
              if (typeof words[2] != 'undefined') {
                translated_label = words[2];
              }

              // used for geojson
              if (typeof filter[filter_field] == 'undefined') {
                filter[filter_field] = [];
              }

              // values might be separated by a comma
              markerData[filter_field] = markerData[filter_field].split(', ');

              filter[filter_field] = filter[filter_field].concat(markerData[filter_field]);

              if (typeof Drupal.Mapbox.filters[filter_field] == 'undefined') {
                Drupal.Mapbox.filters[filter_field] = {};
                Drupal.Mapbox.filters[filter_field]['options'] = {};
                Drupal.Mapbox.filters[filter_field]['type'] = filter_type;
                Drupal.Mapbox.filters[filter_field]['translated_label'] = translated_label;
              }

              if (typeof Drupal.Mapbox.filters[filter_field][markerData[filter_field]] == 'undefined' && markerData[filter_field]) {
                $.each(filter[filter_field], function (index, value) {
                  Drupal.Mapbox.filters[filter_field]['options'][value] = true;
                });
              }
            }
          });
        }

        // create geojson object with the provided attributes
        Drupal.Mapbox.geojson.push({
          'type': 'Feature',
          'geometry': {
            'type': 'Point',
            'coordinates': [markerData.lon, markerData.lat]
          },
          'properties': {
            'popup_entity_id': markerData.popup_entity_id,
            'nid': markerData.nid,
            'type': markerData.type,
            'filter': setting.filter.enabled ? filter : false
          }
        });
      }
    },
    // end Drupal.behaviors.mapboxBridge.addMarker

    /*
    * Add a legend container with all the used markers
    * */
    addLegend: function(setting) {

      // add legend container
      $('<div id="mapbox-legend" class="mapbox-legend"><ul class="legends"></ul></div>').insertAfter('#map');

      // loop through the stored icons
      $.each(Drupal.Mapbox.icons, function(i, legend){
        if (legend.iconUrl && legend.name) {
          $('<li class="legend">' +
            '<div class="legend-icon"><img src="' + legend.iconUrl + '"></div>' +
            '<div class="legend-name">' + legend.name + '</div>' +
          '</li>').appendTo('.mapbox-legend .legends');
        }
      });
    },
    // end Drupal.behaviors.mapboxBridge.addLegend

    /*
    * This disables the pan and zoom controls via input devices (mouse, touch, ect.)
    * and replaces it with controls layed over the map.
    * */
    panAndZoom: function(enable) {
      if (!enable) {
        // Disable drag and zoom handlers.
        Drupal.Mapbox.map.dragging.disable();
        Drupal.Mapbox.map.touchZoom.disable();
        Drupal.Mapbox.map.doubleClickZoom.disable();

        // Disable tap handler, if present.
        if (Drupal.Mapbox.map.tap) Drupal.Mapbox.map.tap.disable();

        // Enable pan controls
        Drupal.MapboxPan.controls(true);
      } else {
        // Enable drag and zoom handlers.
        Drupal.Mapbox.map.dragging.enable();
        Drupal.Mapbox.map.touchZoom.enable();
        Drupal.Mapbox.map.doubleClickZoom.enable();

        // Enable tap handler, if present.
        if (Drupal.Mapbox.map.tap) Drupal.Mapbox.map.tap.enable();

        // Disable pan controls
        Drupal.MapboxPan.controls(false);
      }
    },
    // end Drupal.behaviors.mapboxBridge.panAndZoom

    /**
     * Calculate marker's anchor position
     *
     * @param iconWidth
     *  Icon image width
     * @param iconHeight
     *  Icon image height
     * @param iconAnchor
     *  String describing position. E.g.: center_center, bottom_left etc
     *
     * @returns Array
     *  Array with anchor position
     */
    getIconAnchor: function(iconWidth, iconHeight, iconAnchor) {
      // separate offset description and make sure we always have to elements
      var offsets = iconAnchor.split('_').concat(['center']);

      // Calculate Y offset
      switch(offsets[0]) {
        case 'top': offsetY = 0; break;
        case 'bottom': offsetY = iconHeight; break;
        default: offsetY = iconHeight / 2;
      }

      // Calculate X offset
      switch(offsets[1]) {
        case 'left': offsetX = 0; break;
        case 'right': offsetX = iconWidth; break;
        default: offsetX = Math.ceil(iconWidth / 2);
      }

      return [offsetX, offsetY];
    },

    /**
     * refresh the map
     */
    refresh: function(){
      Drupal.Mapbox.icons = {};
      Drupal.Mapbox.layers = {};
      Drupal.Mapbox.filters = {};
      Drupal.Mapbox.geojson = [];
    },

    /**
     * Alter function, copy this (Drupal.behaviors.mapboxBridge.alter()) into your own .js file to execute code after the map has finished loading.
     */
    alter: function(data) {

    }
  };
  // end Drupal.behaviors.mapboxBridge.getIconAnchor

})(jQuery);
