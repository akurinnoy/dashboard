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

/**
 * Controller for creating factory from a template.
 * @author Oleksii Orel
 */
class FactoryFromTemplateCtrl {

  /**
   * Default constructor that is using resource injection
   * @ngInject for Dependency injection
   */
  constructor($filter, codenvyAPI, codenvyNotification) {
    this.$filter = $filter;
    this.codenvyAPI = codenvyAPI;
    this.codenvyNotification = codenvyNotification;

    this.isImporting = false;
    this.factoryContent = null;
  }

  //Gets factory template.
  getFactoryTemplate(templateName) {

    let factoryContent = this.codenvyAPI.getFactoryTemplate().getFactoryTemplate(templateName);

    if (factoryContent) {
      this.factoryContent = this.$filter('json')(factoryContent, 2);
      return;
    }

    this.isImporting = true;
    // fetch it !
    let promise = this.codenvyAPI.getFactoryTemplate().fetchFactoryTemplate(templateName);

    promise.then((factoryContent) => {
      this.isImporting = false;
      this.factoryContent = this.$filter('json')(factoryContent, 2);
    }, (error) => {
      this.isImporting = false;
      this.codenvyNotification.showError(error.data.message ? error.data.message : 'Fail to get factory template.');
      console.log('error', error);
    });
  }

}

export default FactoryFromTemplateCtrl;
