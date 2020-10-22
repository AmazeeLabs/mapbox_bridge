<?php
/**
 * @file
 * Implements views_plugin_style for views_mapbox
 */

/**
 * Implements views_plugin_style
 */
class views_plugin_style_mapbox extends views_plugin_style {
  /**
   * Implements views_plugin_style::option_definition
   */
  function option_definition() {
    $options = parent::option_definition();
    $options['location_field'] = array(
      'default' => NULL,
      'translatable' => FALSE
    );
    $options['mapbox_id'] = array(
      'default' => NULL,
      'translatable' => FALSE
    );
    $options['max_zoom_level'] = array(
      'default' => 12,
      'translatable' => FALSE
    );
    $options['center'] = array(
      'default' => '',
      'translatable' => FALSE
    );
    $options['marker_popup'] = array(
      'default' => FALSE,
      'translatable' => FALSE
    );
    $options['marker_field'] = array(
      'default' => '',
      'translatable' => FALSE
    );
    $options['marker_view_mode'] = array(
      'default' => NULL,
      'translatable' => FALSE
    );
    $options['marker_legend'] = array(
      'default' => FALSE,
      'translatable' => FALSE
    );
    $options['marker_cluster'] = array(
      'default' => FALSE,
      'translatable' => FALSE
    );
    $options['marker_proximity_search'] = array(
      'default' => FALSE,
      'translatable' => FALSE
    );
    $options['marker_anchor'] = array(
      'default' => 'center_center',
      'translatable' => FALSE
    );
    $options['marker_filter'] = array(
      'default' => FALSE,
      'translatable' => FALSE
    );
    $options['marker_filter_fields'] = array(
      'default' => '',
      'translatable' => FALSE
    );
    $options['marker_icon_src'] = array(
      'default' => '',
      'translatable' => FALSE
    );
    $options['marker_icon_width'] = array(
      'default' => 0,
      'translatable' => FALSE
    );
    $options['marker_icon_height'] = array(
      'default' => 0,
      'translatable' => FALSE
    );
    return $options;
  }

  /**
   * Provide a form for setting options.
   */
  function options_form(&$form, &$form_state) {
    parent::options_form($form, $form_state);
    $field_options = $this->display->handler->get_field_labels(TRUE);
    $form['location_field'] = array(
      '#type' => 'select',
      '#title' => t('Location field'),
      '#description' => t('Please select the field which will output the locations as WKT. The format is <em>POINT (longitude latitude)</em>. Example: <em>POINT (23.4456 121.123)</em>. Multiple locations can be specified separated by commans. Example: <em>POINT (103.856163 13.423935), POINT (23.2019265 45.8451246)</em>.'),
      '#default_value' => $this->options['location_field'],
      '#required' => TRUE,
      '#options' => $field_options,
    );

    // The mapbox id.
    $t_args = array('!mapbox' => l('www.mapbox.com/projects', 'https://www.mapbox.com/projects/', array('attributes' => array('target' => '_blank'))));
    $form['mapbox_id'] = array(
      '#type' => 'textfield',
      '#title' => t('Mapbox ID'),
      '#description' => t('ID of your Mapbox project: !mapbox', $t_args),
      '#default_value' => $this->options['mapbox_id'],
      '#required' => TRUE,
    );

    // The zoom level.
    $form['max_zoom_level'] = array(
      '#type' => 'select',
      '#title' => t('Max zoom level'),
      '#description' => t('The maximum level of zoom (the higher the level, the closer)'),
      '#default_value' => $this->options['max_zoom_level'],
      '#options' => drupal_map_assoc(range(1, 18)),
    );

    // Center around the coordinates.
    $form['center'] = array(
      '#type' => 'textfield',
      '#title' => t('Center coordinates'),
      '#description' => t('If entered, the map will center around the given coordinates. Provide latitude and longitude like: 13,37'),
      '#default_value' => $this->options['center'],
    );

    // The marker popup flag.
    $form['marker_popup'] = array(
      '#type' => 'checkbox',
      '#title' => t('Popup'),
      '#description' => t('Show a popup when clicking the marker'),
      '#default_value' => $this->options['marker_popup']
    );

    // The field and view mode of the marker popup.
    $form['marker_field'] = array(
      '#type' => 'select',
      '#title' => t('Popup field'),
      '#description' => t('Please select the field which will be used as the id of the entity to display in the popup.'),
      '#default_value' => $this->options['marker_field'],
      '#options' => $field_options,
      '#states' => array(
        'invisible' => array(
          'input[name="style_options[marker_popup]"]' => array('checked' => FALSE),
        ),
      ),
    );

    $view_modes = variable_get('entity_view_modes', array());
    $view_mode_options = array();

    foreach ($view_modes as $type => $view_mode) {
      foreach ($view_mode as $key => $mode) {
        $view_mode_options[$type][$type . '::' . $key] = $mode['label'];
      }
    }
    // add the drupal default Node "Teaser" and "Default" viewmodes.
    $view_mode_options['node']['node::default'] = t('Default');
    $view_mode_options['node']['node::teaser'] = t('Teaser');
    $form['marker_view_mode'] = array(
      '#type' => 'select',
      '#title' => t('View mode'),
      '#options' => $view_mode_options,
      '#description' => t('View mode to be used when displaying the popup.'),
      '#default_value' => $this->options['marker_view_mode'],
      '#states' => array(
        'invisible' => array(
          'input[name="style_options[marker_popup]"]' => array('checked' => FALSE),
        ),
      ),
    );

    // The legend.
    $form['marker_legend'] = array(
      '#type' => 'checkbox',
      '#title' => t('Mapbox Legend'),
      '#description' => t('Will show a legend below the map with all marker type'),
      '#default_value' => $this->options['marker_legend'],
    );

    // The cluster.
    $form['marker_cluster'] = array(
      '#type' => 'checkbox',
      '#title' => t('Cluster'),
      '#description' => t('Enable clustering, example: !link', array('!link' => l(t('here'), 'https://www.mapbox.com/mapbox.js/example/v1.0.0/leaflet-markercluster/', array('attributes' => array('target' => '_blank'))))),
      '#default_value' => $this->options['marker_cluster'],
    );

    // The proximity search.
    $form['marker_proximity_search'] = array(
      '#type' => 'checkbox',
      '#title' => t('Proximity Search'),
      '#description' => t('Enables the proximity search feature, example: !link', array('!link' => l(t('here'), 'https://www.mapbox.com/mapbox.js/example/v1.0.0/geocoding-auto/', array('attributes' => array('target' => '_blank'))))),
      '#default_value' => $this->options['marker_proximity_search'],
    );

    // The zoom level.
    $form['marker_anchor'] = array(
      '#type' => 'select',
      '#title' => t('Marker anchor'),
      '#description' => t('What is considered to be the "tip" of the marker icon.'),
      '#default_value' => $this->options['marker_anchor'],
      '#options' => mapbox_bridge_marker_anchor_options(),
    );

    // The filter.
    $form['marker_filter'] = array(
      '#type' => 'checkbox',
      '#title' => t('Mapbox Filter'),
      '#description' => t('Filter markers based on the "filter" attribute within the JSON'),
      '#default_value' => $this->options['marker_filter'],
    );

    $form['marker_filter_fields'] = array(
      '#type' => 'textfield',
      '#title' => t('Filter fields'),
      '#description' => t('Name of the field that acts as a filter from the json and how it should be displayed. E.g. country:select (allowed: select, checkbox, radio) will render a select list with all the values from the "country" attribute inside the JSON, separate multiple fields by a comma.'),
      '#default_value' => $this->options['marker_filter_fields'],
      '#states' => array(
        'invisible' => array(
          'input[name="style_options[marker_filter]"]' => array('checked' => FALSE),
        ),
      ),
    );

    // The marker icon: src, width and height.
    $form['marker_icon_src'] = array(
      '#type' => 'textfield',
      '#title' => t('Custom icon'),
      '#description' => t('Path to an image that will be used as a marker pin. E.g.: sites/all/themes/omega/pin') . "<br><strong>".t('Currently only supports PNG or JPEG.')."</strong>",
      '#default_value' => $this->options['marker_icon_src'],
      '#required' => TRUE,
    );

    $form['marker_icon_width'] = array(
      '#type' => 'textfield',
      '#title' => t('Icon width'),
      '#size' => 3,
      '#description' => t('Icon width in pixels (needed for positioning)'),
      '#default_value' => $this->options['marker_icon_width'],
      '#required' => TRUE,
    );

    $form['marker_icon_height'] = array(
      '#type' => 'textfield',
      '#title' => t('Icon height'),
      '#size' => 3,
      '#description' => t('Icon height in pixels (needed for positioning)'),
      '#default_value' => $this->options['marker_icon_height'],
      '#required' => TRUE,
    );
  }

  /**
   * No theme functions at the moment.
   */
  function theme_functions() {
    return NULL;
  }


  /**
   * Implementation of view_style_plugin::render()
   */
  function render() {
    // @todo: add some basic errors handling maybe?
    $display_fields = $this->display->handler->get_option('fields');
    $marker_points = array();
    foreach ($this->view->result as $key => $row) {
      $row_field_values = $this->get_field_value($key, $this->options['location_field']);
      if (empty($row_field_values)) {
        continue;
      }
      if (is_string($row_field_values)) {
        $row_field_values = array($row_field_values);
      }
      foreach($row_field_values as $row_field_value) {
        // The $field_value may be a geofield, in which case we check the 'geom'
        // attribute.
        if (is_array($row_field_value) && isset($row_field_value['geom'])) {
          $field_value = $row_field_value['geom'];
        }
        elseif (is_string($row_field_value)) {
          $field_value = $row_field_value;
        } else {
          // If the value is not a string and not a geofield, then we skip it.
          watchdog('mapbox_views', 'The "!location_field" value is not a string or a geofield, so it cannot be shown on the map.', array('!location_field' => $this->options['location_field']), WATCHDOG_ERROR);
          continue;
        }
        $matches = array();
        preg_match_all('/POINT\ \([0-9\.-]+\ [0-9\.-]+\)/', $field_value, $matches);
        if (!empty($matches[0])) {
          foreach ($matches[0] as $point) {
            $marker = new stdClass();
            list($marker->lon, $marker->lat) = $this->extract_point_coordinates($point);
            $marker_points[] = $marker;
            // Add the rest of the fields to the marker.
            foreach ($display_fields as $field_key => $value) {
              // Skip the fields which should be excluded from the display, or if it
              // is the location field.
              if (!empty($value['exclude']) || $field_key == $this->options['location_field']) {
                continue;
              }
              $marker->{$field_key} = $this->get_field_value($key, $field_key);
            }
            if (!empty($this->options['marker_field'])) {
              $marker->popup_entity_id = $marker->{$this->options['marker_field']};
            }
          }
        }
      }
    }
    $filter_fields = !empty($this->options['marker_filter_fields'])? explode(',', $this->options['marker_filter_fields']) : NULL;
    // In order to be able to have the filters translated, we need to do it
    // in php, not in javascript. The Drupal.t() function does not work on
    // variables, so something like: "Drupal.t(filter)" will not work.
    if (!empty($filter_fields)) {
      foreach ($filter_fields as $filter_field_key => $filter_field) {
        $words = explode(':', $filter_field);
        // We do this only if we have exactly 2 words, otherwise the string
        // is already considered to be translated.
        if (count($words) == 2) {
          $words[2] = t(trim($words[0]), array(), array('context' => 'mapbox_filter'));
          $filter_fields[$filter_field_key] = implode(':', $words);
        }
      }
    }

    $popup_words = !empty($this->options['marker_view_mode']) ? explode('::', $this->options['marker_view_mode']) : NULL;
    $mapBuilder = new MapboxAreaBuilder(
      $marker_points,
      $this->options['mapbox_id'],
      '', // We do not have any geofield here.
      NULL, // The marker type. We will use alwyas an image.
      $this->options['marker_legend'],
      '', // The symbol name.
      '', // The symbol icon
      $this->options['max_zoom_level'],
      array(
        'enabled' => $this->options['marker_popup'],
        'popup_viewmode' => !empty($popup_words) ? $popup_words[1]: NULL,
        'popup_entity_type' => !empty($popup_words) ? $popup_words[0]: NULL,
      ),
      array(
        'src' => $this->options['marker_icon_src'],
        'width' => $this->options['marker_icon_width'],
        'height' => $this->options['marker_icon_height'],
      ),
      $this->options['marker_anchor'],
      array(
        'enabled' => $this->options['marker_filter'],
        'filter_fields' => $filter_fields,
      ),
      $this->options['marker_cluster'],
      $this->options['marker_proximity_search'],
      $this->options['center']
    );

    return $mapBuilder->getMap();
  }

  /**
   * Given a $point as a string (like POINT(long lat)) it will return the
   * longitude and the latitude as a list.
   */
  protected function extract_point_coordinates($point) {
    $point = str_replace(array("POINT (", ')'), '', $point);
    return explode(' ', $point);
  }

}
