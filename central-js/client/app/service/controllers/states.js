angular.module('app').controller('ServiceFormController', function($scope, service, regions, AdminService, ServiceService) {
  $scope.service = service;
  $scope.regions = regions;
  // console.log('ServiceFormController,  ServiceService.oService =', ServiceService.oService, ', regions =', regions.length );
  $scope.bAdmin = AdminService.isAdmin();
});

angular.module('app').controller('ServiceGeneralController', function($state, $scope, ServiceService, PlacesService ) {
  var oAvail = PlacesService.getServiceAvailability();
  // console.log('ServiceGeneralController');
  // FIXME Перевірити, чи немає тут дублювання з processPlaceChange
  // if (oAvail.isRegion || oAvail.isCity) {
  //   return $state.go('index.service.general.place', {id: ServiceService.oService.nID}, {location: false});
  // }
  return $state.go('index.service.general.place', {id: ServiceService.oService.nID}, {location: false});
});

angular.module('app').controller('ServiceInstructionController', function($state, $rootScope, $scope) {
});

angular.module('app').controller('ServiceLegislationController', function($state, $rootScope, $scope) {
});

angular.module('app').controller('ServiceQuestionsController', function($state, $rootScope, $scope) {
});

angular.module('app').controller('ServiceDiscussionController', function($state, $rootScope, $scope) {
  var HC_LOAD_INIT = false;
  window._hcwp = window._hcwp || [];
  window._hcwp.push({widget: 'Stream', widget_id: 60115});
  if ('HC_LOAD_INIT' in window) {
    return;
  }
  HC_LOAD_INIT = true;
  var lang = (navigator.language || navigator.systemLanguage || navigator.userLanguage || 'en').substr(0, 2).toLowerCase();
  var hcc = document.createElement('script');
  hcc.type = 'text/javascript';
  hcc.async = true;
  hcc.src = ('https:' === document.location.protocol ? 'https' : 'http') + '://w.hypercomments.com/widget/hc/60115/' + lang + '/widget.js';
  angular.element(document.querySelector('#hypercomments_widget')).append(hcc);
});

angular.module('app').controller('ServiceStatisticsController', function($scope, ServiceService) {
  $scope.loaded = false;
  $scope.arrow = '\u2191';
  $scope.reverse = false;

  $scope.changeSort = function() {
    $scope.reverse = !$scope.reverse;
    $scope.arrow = $scope.reverse ? '\u2191' : '\u2193';
  };

  ServiceService.getStatisticsForService(ServiceService.oService.nID).then(function(response) {
    $scope.stats = response.data;
  }, function(response) { console.log(response.status + ' ' + response.statusText + '\n' + response.data); })
    .finally(function() {$scope.loaded = true;});
});
