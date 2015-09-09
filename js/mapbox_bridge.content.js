(function ($) {

  /**
   * Mapbox Content Ajax Loader
   */
  Drupal.MapboxContent = {
    load: function(target, marker, viewmode, settings, onComplete) {

      var path = '';
      if (settings.path_settings.domain_variant) {
        path += '/' + settings.path_settings.domain_variant;
      }

      if (settings.path_settings.language) {
        path += '/' + settings.path_settings.language;
      }

      path += '/mapbox_bridge_ajax_content/' + viewmode + '/' + marker.feature.properties.nid;

      // load the node with the supplied viewmode
      $(target).load(path, function(content){
        var $this = $(this);

        // remove loading indicator
        $this.removeClass('loading');

        // execute complete function when available
        if (onComplete) {
          onComplete($this);
        }
      });
    }
  };
})(jQuery);