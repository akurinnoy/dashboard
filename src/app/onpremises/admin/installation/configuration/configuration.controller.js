/*
 * Copyright (c) 2015 Codenvy, S.A.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *   Codenvy, S.A. - initial API and implementation
 */
'use strict';

class OnPremConfigurationCtrl {

  /**
   * Default constructor.
   * @ngInject for Dependency injection
   */
  constructor(imsConfigApi, $mdDialog, $rootScope, $timeout) {
    this.imsConfigApi = imsConfigApi;
    this.$mdDialog = $mdDialog;

    this.editorOptions = {
      lineWrapping: true,
      lineNumbers: true,
      mode: 'text/plain',
      lint: false,
      foldgutter: false,
      matchBrackets: true,
      autoCloseBrackets: true,
      styleActiveLine: true,
      theme: 'codenvy'
    };

    this.editorOptions.onLoad = (instance => this.codemirrorLoaded(instance, $rootScope, $timeout));

    this._enterSubmitState();
    this._retrieveConfig();
  }

  _retrieveConfig() {
    this.imsConfigApi.getIMConfig().$promise.then((response) => this._formatConfig(response))
                                            .then(() => this._exitSubmitState());
  }

  _formatConfig(response) {
    this.unmodifiedConfig = this._filterUnwanted(angular.fromJson(response.toJSON()));
    let props = [];
    for (let [key] of this.unmodifiedConfig) {
      props.push(key);
    }
    props.sort();

    let result = [];
    for (let propName of props) {
      result.push([propName, this.unmodifiedConfig.get(propName)]);
    }
    this.config = result;
  }

  /**
   * Filter out properties we know doen't hold real values
   * @param {config|object}
   * @return a Map
   */
  _filterUnwanted(config) {
    let result = new Map();
    for (let key of Object.getOwnPropertyNames(config)) {
      if (!key.match(/password$|_pass$|secret$/)) {
        result.set(key, config[key]);
      }
    }
    return result;
  }

  updateConfig() {
    let config = new Map();

    for (let property of this.config) {
      config.set(property[0], property[1]);
    }
    let filtered = this._filterUnchanged(config);
    if (filtered && filtered.size > 0) {
      this._enterSubmitState();
      this.imsConfigApi.setIMConfig(filtered).$promise.then(() => this._updateSuccess()).catch((error) => this._updateError(error));
    }
  }

  _filterUnchanged(config) {
    let result = new Map();
    for (let [key, value] of config) {
      if (this.unmodifiedConfig.get(key) !== value) {
        result.set(key, value);
      }
    }
    return result;
  }

  _updateSuccess() {
    // the config was changed, read it again
    this._retrieveConfig();
  }

  _updateError(error) {
    if (error.status === 404) {
      // there was an invalid property
      let payload = angular.fromJson(error.data);
      if (payload.properties && payload.properties.length > 0) {
        this._warnInvalidProperties(payload.properties);
        this._exitSubmitState();
      }
      // will not synchronize the content to let the user fix their changes
    } else {
      // synchronize content with actual values
      this._retrieveConfig();
    }
  }

  _warnInvalidProperties(properties) {
    console.log(`Codenvy configuration editor: the following properties are not accepted. Update cancelled.`, properties);
    let errorDialog = this.$mdDialog.alert()
      .title('Update Configuration Aborted')
      .ok('Close');
    if (properties.length === 1) {
      errorDialog.content(`The property ${properties[0]} is not a known configuration property name. The configuration was not updated.`);
    } else {
      errorDialog.content(`Some properties were not known configuration property names. The configuration was not updated. (properties: ${properties.join(', ')}).`);
    }
    this.$mdDialog.show(errorDialog);
  }

  _enterSubmitState() {
    this.editorOptions.readOnly = 'nocursor';
    this.submitState = true;
  }

  _exitSubmitState() {
    this.editorOptions.readOnly = false;
    this.submitState = false;
  }

  codemirrorLoaded(instance, $rootScope, $timeout) {
    $rootScope.$watch(() => $rootScope.waitingLoaded, (newValue) => {
      if (newValue) {
        $timeout(() => instance.refresh(), 500);
      }
    });
  }
}

export default OnPremConfigurationCtrl;
