/**
 * ModelValidator service used by formFor to determine if each field in the form-data passes validation rules.
 * This service is not intended for use outside of the formFor module/library.
 */
angular.module('formFor').service('ModelValidator',
  function($interpolate, $parse, $q, FormForConfiguration, NestedObjectHelper) {

    /**
     * Validates the model against all rules in the validationRules.
     * This method returns a promise to be resolved on successful validation,
     * Or rejected with a map of field-name to error-message.
     *
     * @param model Model data to validate with any existing rules
     * @param validationRules Set of named validation rules
     */
    this.validateAll = function(model, validationRules) {
      var fields = NestedObjectHelper.flattenObjectKeys(validationRules);

      return this.validateFields(model, fields, validationRules);
    };

    /**
     * Validates the values in model with the rules defined in the current validationRules.
     * This method returns a promise to be resolved on successful validation,
     * Or rejected with a map of field-name to error-message.
     *
     * @param model Model data
     * @param fieldNames Whitelist set of fields to validate for the given model; values outside of this list will be ignored
     * @param validationRules Set of named validation rules
     */
    this.validateFields = function(model, fieldNames, validationRules) {
      var deferred = $q.defer();
      var promises = [];
      var errorMap = {};
      var that = this;

      _.each(fieldNames, function(fieldName) {
        var rules = NestedObjectHelper.readAttribute(validationRules, fieldName);

        if (rules) {
          var promise = that.validateField(model, fieldName, validationRules);

          promise.then(
            angular.noop,
            function(error) {
              $parse(fieldName).assign(errorMap, error);
            });

          promises.push(promise);
        }
      });

      $q.waitForAll(promises).then(
        deferred.resolve,
        function() {
          deferred.reject(errorMap);
        });

      return deferred.promise;
    };

    /**
     * Validates a value against the related rule-set (within validationRules).
     * This method returns a promise to be resolved on successful validation.
     * If validation fails the promise will be rejected with an error message.
     *
     * @param model Form-data object model is contained within
     * @param fieldName Name of field used to associate the rule-set map with a given value
     * @param validationRules Set of named validation rules
     */
    this.validateField = function(model, fieldName, validationRules) {
      var rules = NestedObjectHelper.readAttribute(validationRules, fieldName);
      var value = $parse(fieldName)(model);

      if (rules) {
        value = value || '';

        if (rules.required) {
          var required = _.isObject(rules.required) ? rules.required.rule : rules.required;

          if (!!value !== required) {
            return $q.reject(
              _.isObject(rules.required) ?
                rules.required.message :
                FormForConfiguration.validationFailedForRequiredMessage);
          }
        }

        if (rules.minlength) {
          var minlength = _.isObject(rules.minlength) ? rules.minlength.rule : rules.minlength;

          if (value.length < minlength) {
            return $q.reject(
              _.isObject(rules.minlength) ?
                rules.minlength.message :
                $interpolate(FormForConfiguration.validationFailedForMinLengthMessage)({num: minlength}));
          }
        }

        if (rules.maxlength) {
          var maxlength = _.isObject(rules.maxlength) ? rules.maxlength.rule : rules.maxlength;

          if (value.length > maxlength) {
            return $q.reject(
              _.isObject(rules.maxlength) ?
                rules.maxlength.message :
                $interpolate(FormForConfiguration.validationFailedForMaxLengthMessage)({num: maxlength}));
          }
        }

        if (rules.type) {
          var type = _.isObject(rules.type) ? rules.type.rule : rules.type;
          var invalid = false;
          var stringValue = value.toString();

          // TODO Better error messages

          if (type.indexOf('integer') >= 0 && !stringValue.match(/^\-*[0-9]+$/)) {
            invalid = true;
          }

          if (type.indexOf('number') >= 0 && !stringValue.match(/^\-*[0-9\.]+$/)) {
            invalid = true;
          }

          if (type.indexOf('negative') >= 0 && !stringValue.match(/^\-[0-9\.]+$/)) {
            invalid = true;
          }

          if (type.indexOf('positive') >= 0 && !stringValue.match(/^[0-9\.]+$/)) {
            invalid = true;
          }

          if (type.indexOf('email') >= 0 && !stringValue.match(/^[\w\.\+]+@\w+\.\w+$/)) {
            invalid = true;
          }

          if (invalid) {
            var errorMessage =
              _.isObject(rules.type) ?
                rules.type.message :
                FormForConfiguration.validationFailedForTypeMessage;

            return $q.reject(errorMessage);
          }
        }

        if (rules.pattern) {
          var pattern = _.isRegExp(rules.pattern) ? rules.pattern : rules.pattern.rule;

          if (!pattern.exec(value)) {
            return $q.reject(
              _.isRegExp(rules.pattern) ?
                FormForConfiguration.validationFailedForPatternMessage :
                rules.pattern.message);
          }
        }

        if (rules.custom && _.isFunction(rules.custom)) {
          return $q.when(
            rules.custom(value, model),
            function(reason) {
              return $q.resolve(reason);
            },
            function(reason) {
              return $q.reject(reason || FormForConfiguration.validationFailedForCustomMessage);
            });
        }
      }

      return $q.resolve();
    };

    return this;
  });
