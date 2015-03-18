angular.module('formForDocumentation').directive('prism',
  function($compile, $http) {
    return {
      restrict: 'EA',
      link: function($scope, $element, $attributes) {
        var parser = $attributes.hasOwnProperty('parser') ? $attributes['parser'] : 'markup';

        var highlight = function(text) {
          var html = Prism.highlight(text, Prism.languages[parser]);

          $element.html('<pre class="language-' + parser + '"><code>' + html + '</code></pre>');
        };

        var showError = function() {
          $element.html('<p class="alert alert-danger"><i class="fa fa-times"></i> The specified template could not be loaded.</p>');
        };

        if ($attributes.source) {
          $element.html('<i class="fa fa-spin fa-spinner"></i> Loading...');

          $http({method: 'GET', url: $attributes.source}).
            success(
              function(data) {
                if (data) {
                  highlight(data);
                } else {
                  showError();
                }
              }).
            error(showError);
        } else {
          highlight($element.html());
        }
      }
    };
});

angular.module('formForDocumentation').directive('disableFieldButton', function() {
  return {
    restrict: 'E',
    templateUrl: 'app/templates/disable-field-button.html',
    scope: {
      isDisabled: '='
    }
  };
});

angular.module('formForDocumentation').directive('validateFieldButton', function() {
  return {
    restrict: 'E',
    templateUrl: 'app/templates/validate-field-button.html',
    scope: {
      fieldName: '@',
      formController: '='
    },
    controller: function($scope) {
      $scope.validateField = function() {
        $scope.formController.validateField($scope.fieldName, true);
      };
    }
  };
});

angular.module('formForDocumentation').directive('resetFieldButton', function() {
  return {
    restrict: 'E',
    templateUrl: 'app/templates/reset-field-button.html',
    scope: {
      fieldName: '@',
      formController: '='
    },
    controller: function($scope) {
      $scope.resetField = function() {
        $scope.formController.resetField($scope.fieldName);
      };
    }
  };
});

angular.module('formForDocumentation').value('currentTemplates', {
  key: 'bootstrap'
});

angular.module('formForDocumentation').directive('templateToggler', function($ocLazyLoad, $state, $stateParams, currentTemplates) {
  var map = {};
  map['default'] = ['formFor.defaultTemplates', '/offline/form-for.default-templates.js'];
  map['bootstrap'] = ['formFor.bootstrapTemplates', '/offline/form-for.bootstrap-templates.js'];

  return {
    restrict: 'E',
    templateUrl: 'app/templates/template-toggler.html',
    scope: {
    },
    link: function($scope) {
      $scope.current = currentTemplates.key;

      $scope.load = function(key) {
        $scope.current = currentTemplates.key = key;

        var module = map[key][0];
        var url = map[key][1];

        var modules = $ocLazyLoad.getModules();
        var index = modules.indexOf(module);

        if (index >= 0) {
          modules.splice(index, 1);
        }

        $ocLazyLoad.load({
          name: module,
          cache: false,
          files: [url]
        }).then(function() {
          $state.go($state.current, $stateParams, {reload: true});
        });

        return false;
      }
    }
  };
});

/**
 * Renders a link to documentation for the specified class.
 */
angular.module('formForDocumentation').directive('doclink',
  function() {
    return {
      restrict: 'EA',
      scope: {
        name: '@'
      },
      templateUrl: 'app/templates/doclink.html'
    };
  });

/**
 * Renders a link to documentation for the specified class.
 */
angular.module('formForDocumentation').directive('navdoclink',
  function() {
    return {
      restrict: 'EA',
      scope: {
        name: '@'
      },
      templateUrl: 'app/templates/navdoclink.html'
    };
  });

/**
 * Renders example usage code snippets using the Prism JS library for syntax highlighting.
 */
angular.module('formForDocumentation').directive('usage',
  function() {
    return {
      restrict: 'EA',
      scope: {
        source: '@'
      },
      templateUrl: 'app/templates/usage.html',
      link: function($scope, $element, $attributes) {
        $scope.parser = $attributes['parser'] || 'javascript';
        $scope.heading = $attributes['heading'] || 'Usage';
      }
    };
  });

/**
 * Renders a method signature doc including (optional) typed parameters and (optional) return type information.
 */
angular.module('formForDocumentation').directive('signature',
  function($sce) {
    return {
      restrict: 'EA',
      scope: {
        params: '=?',
        returnType: '@'
      },
      link: function($scope, $element, $attributes) {
        $scope.heading = $attributes['heading'] || 'Params';

        $scope.trust = function(value) {
          return $sce.trustAsHtml(value);
        }
        
        if ($attributes.return) {
          if ($attributes.return.indexOf('{') >= 0) {
            var parsed = $scope.$eval($attributes.return);

            $scope.returnDescription = $sce.trustAsHtml(parsed.description);
            $scope.returnType = parsed.type;
          } else {
            $scope.returnType = $sce.trustAsHtml($attributes.return);
          }
        }
      },
      templateUrl: 'app/templates/signature.html'
    };
  });

/**
 * Renders a template displaying the various errors a method may throw.
 */
angular.module('formForDocumentation').directive('throws',
  function() {
    return {
      restrict: 'EA',
      scope: {
        errors: '='
      },
      templateUrl: 'app/templates/throws.html'
    };
  });

/**
 * Renders a class type with a link to the source code and a docs issue button.
 */
angular.module('formForDocumentation').directive('classname',
  function() {
    return {
      restrict: 'EA',
      scope: {
        name: '@',
        source: '@',
        super: '@?'
      },
      templateUrl: 'app/templates/classname.html'
    };
  });