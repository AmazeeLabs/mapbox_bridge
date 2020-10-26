(function ($) {

  /**
   * Mapbox Content Ajax Loader
   */
  Drupal.MapboxContent = {
    load: function(target, entity_id, settings) {
      var contentId = "popup-loaded-content";
      var path = this.createPath(settings, entity_id);
      // load the node with the supplied viewmode

      return new Promise(function(resolve, reject) {
        $('<div id="' + contentId + '" />').load(path, {limit:25}, function (responseText, textStatus, req) {
          if (textStatus === "error") {
            reject(textStatus);
          }

          resolve({html: responseText, element: $(target)});

          // general complete function, can be overwritten
          Drupal.MapboxContent.onComplete($(target));
        });
      });
      },

    onComplete: function (e) {
      // copy this to your own .js file to overwrite it
    },
    createPath: function (settings, entity_id){
      var path = '';
      if (settings.path_settings.domain_variant) {
        path += '/' + settings.path_settings.domain_variant;
      }

      if (settings.path_settings.language) {
        path += '/' + settings.path_settings.language;
      }

      path += '/mapbox_bridge_ajax_content';

      var entity_type = settings.popup.popup_entity_type;
      if(typeof entity_type !== "undefined"){
        path += '/' + entity_type;
      }else{
        path += '/node';
      }

      var viewmode = settings.popup.popup_viewmode;
      if(typeof viewmode !== "undefined"){
        path += '/' + viewmode;
      }

      path += '/' + entity_id;

      return path;
    }
  };
})(jQuery);
