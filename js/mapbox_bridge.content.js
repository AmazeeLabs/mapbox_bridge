(function ($) {

  /**
   * Mapbox Content Ajax Loader
   */
  Drupal.MapboxContent = {
    load: function(target, marker, settings, onComplete) {
      var path = '';
      if (settings.path_settings.domain_variant) {
        path += '/' + settings.path_settings.domain_variant;
      }

      if (settings.path_settings.language) {
        path += '/' + settings.path_settings.language;
      }

      path += '/mapbox_bridge_ajax_content/' + settings.popup.popup_entity_type + '/' + settings.popup.popup_viewmode + '/' + marker.feature.properties.popup_entity_id;

      // load the node with the supplied viewmode
      $(target).load(path, function(content){
        var $this = $(this);

        // remove loading indicator
        $this.removeClass('loading');

        // execute complete function when available
        if (onComplete) {
          onComplete($this);
        }

        // general complete function, can be overwritten
        Drupal.MapboxContent.onComplete($this);
      });
    },

    onComplete: function (e) {
      // copy this to your own .js file to overwrite it
    }
  };
})(jQuery);