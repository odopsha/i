/**
  Сервіс для вибору регіона та міста.

  Метод getPlaceData надає контроллерам інформацію про вибраний користувачем регіон та / або місто
  Метод setPlaceData дозволяє контроллерам змінювати цю інформацию в сервісі. 

  Може зберігати вибране міце у localStorage і читати його звідти ж.
  Сервіс ініціюється з даних URL, якщо там вказано область / місто (TODO: перевірити це). 
  
  Користувачами сервіса є директиви (див. place.js), які дозволяють вибирати область / місто та будь-які контроллери, які хочуть взнати про вибране місце.
  
  Обговорення: https://github.com/e-government-ua/i/issues/550#issuecomment-128641486

*/

angular.module('app').service('PlacesService', function($http, $state, ServiceService) {

  var self = this;

  self.rememberMyData = false;

  // Зберігаємо savedPlaceData у localStorage і потім відновлюємо, приклад формату даних:
  var placeDataExample = {
    region: {
      sID_UA: '1200000000',
      'nID': 1,
      'sName': 'Дніпропетровська',
      'aCity': [{
          'sID_UA': '1220310100',
          'nID': 260,
          'sName': 'Апостолове'
        },
        //
        {
          'sID_UA': '1210100000',
          'nID': 1,
          'sName': 'Дніпропетровськ'
        }
      ],
      'color': 'green',
      '$$hashKey': 'object:20'
    },
    'city': {
      'sID_UA': '1210100000',
      'nID': 1,
      'sName': 'Дніпропетровськ',
      'color': 'green',
      '$$hashKey': 'object:87'
    }
  };

  var savedPlaceData = {};

  self.getClassByState = function($state) {
    // TODO
    // var statesMap = {
    //   'index.service.general.place.built-in': {
    //     viewClass: 'state-disabled'
    //   },
    //   'index.service.general.place.built-in.bankid.submitted': {
    //     viewClass: 'state-collapsed'
    //   }
    // };
    // return statesMap[$state.current.name] && statesMap[$state.current.name].viewClass || '';
    return '';
  };

  self.saveLocal = function(oSavedPlaceData) {
    if (self.rememberMyData) {
      localStorage.setItem('igSavedPlaceData', JSON.stringify(oSavedPlaceData));
    }
  };

  self.setPlaceData = function(oSavedPlaceData) {
    savedPlaceData = oSavedPlaceData;
    self.saveLocal(savedPlaceData);
    // console.log('set place data:', JSON.stringify(savedPlaceData));
  };

  /**
   * returns saved place data
   */
  self.getPlaceData = function() {

    var localData = JSON.parse(localStorage.getItem('igSavedPlaceData'));

    if (self.rememberMyData && localData) {
      savedPlaceData = localData;
    }

    // console.log('get place data:', JSON.stringify(savedPlaceData));
    return savedPlaceData;
  };

  self.getRegionsForService = function(service) {
    return $http.get('./api/places/regions').then(function(response) {
      var regions = response.data;
      var aServiceData = service.aServiceData;

      angular.forEach(regions, function(region) {
        var color = 'red';
        angular.forEach(aServiceData, function(oServiceData) {
          if (oServiceData.hasOwnProperty('nID_City') === false) {
            return;
          }
          var oCity = oServiceData.nID_City;
          var oRegion = oCity.nID_Region;
          if (oRegion.nID === region.nID) {
            color = 'green';
          }
        });
        region.color = color;
      });
      return regions;
    });
  };

  self.getRegions = function() {
    return $http.get('./api/places/regions');
  };

  self.setRegion = function(region) {
    savedPlaceData.region = _.clone(region);
  };

  self.setCity = function(city) {
    savedPlaceData.city = _.clone(city);
  };

  self.getRegion = function(region) {
    return $http.get('./api/places/region/' + region);
  };

  self.getCities = function(region, search) {
    var data = {
      sFind: search
    };
    return $http.get('./api/places/region/' + region + '/cities', {
      params: data,
      data: data
    });
  };

  self.getCity = function(region, city) {
    return $http.get('./api/places/region/' + region + '/city/' + city);
  };

  self.regionIsChosen = function() {
    var bResult = savedPlaceData && (savedPlaceData.region ? true : false);
    return bResult;
  };

  // FIXME Перевірити, чи немає тут дублювання логіки з serviceIsAvailableInCity?
  self.cityIsAvailable = function() {
    var oAvail = self.getServiceAvailability();
    var bResult = oAvail.isCity;
    return bResult;
  };

  self.cityIsChosen = function() {
    var bResult = savedPlaceData && (savedPlaceData.city ? true : false);
    return bResult;
  };

  self.findServiceDataByCountry = function() {
    var aServiceData = ServiceService.oService.aServiceData;
    var result = null;
    angular.forEach(aServiceData, function(oService, key) {
      if (!oService.nID_Region && !oService.nID_City && oService.nID_ServiceType && oService.nID_ServiceType.nID) {
        result = oService;
      }
    });
    return result;
  };

  self.findServiceDataByRegion = function() {
    var aServiceData = ServiceService.oService.aServiceData;
    var result = null;
    angular.forEach(aServiceData, function(oService, key) {
      // if service is available in r
      if (oService.nID_Region && oService.nID_Region.nID === savedPlaceData.region.nID) {
        result = oService;
      }
    });
    return result;
  };

  self.findServiceDataByCity = function() {
    var aServiceData = ServiceService.oService.aServiceData;
    var result = null;
    angular.forEach(aServiceData, function(oService, key) {
      if (oService.nID_City && oService.nID_City.nID === (savedPlaceData.city && savedPlaceData.city.nID)) {
        result = oService;
      }
    });
    return result;
  };

  self.serviceIsAvailableInRegion = function() {
    return self.regionIsChosen() && self.findServiceDataByRegion() !== null;
  };

  // FIXME Перевірити, чи немає тут дублювання логіки з cityIsAvailable?
  self.serviceIsAvailableInCity = function() {
    return self.cityIsChosen() && self.findServiceDataByCity() !== null;
  };

  /**
   * Визначає доступність сервісу взагалі та у вибраному місці
   * Повертає об'єкт типу:
   * {
   *   isRegion: false,    // сервіс доступний у якомусь із регіонів
   *   isCity: false,      // сервіс доступний у якомусь із міст
   *   thisRegion: false,  // доступний у вибраному регіоні
   *   thisCity: false    // ...і доступний у вибраному місті
   * }
   */
  self.getServiceAvailability = function() {
    var result = {
      isRegion: false,
      isCity: false,
      thisRegion: false,
      thisCity: false
    };
    var oService = ServiceService.oService;
    var oPlace = self.getPlaceData();

    angular.forEach(oService.aServiceData, function(srv) {
      // сервіс доступний у якомусь із регіонів
      if (srv.hasOwnProperty('nID_Region') && srv.nID_Region.nID !== null) {
        result.isRegion = true;
        // сервіс доступний у вибраному регіоні
        if (oPlace && oPlace.region && oPlace.region.nID === srv.nID_Region.nID) {
          result.thisRegion = true;
        }
      }
      // сервіс доступний у якомусь із міст
      if (srv.hasOwnProperty('nID_City') && srv.nID_City.nID !== null) {
        result.isCity = true;
        // ...і доступний у вибраному місті
        if (oPlace && oPlace.city && oPlace.city.nID === srv.nID_City.nID) {
          result.thisCity = true;
        }
      }
    });
    return result;
  };

  self.getServiceStateForPlace = function() {

    var serviceType = {
      nID_ServiceType: {
        nID: 0
      }
    };

    serviceType = self.findServiceDataByCountry() || serviceType;

    if (self.serviceIsAvailableInRegion()) {
      serviceType = self.findServiceDataByRegion();
    }
    if (self.serviceIsAvailableInCity()) {
      serviceType = self.findServiceDataByCity();
    }

    var stateByServiceType = {
      // Сервіс за посиланням
      1: 'index.service.general.place.link',
      // Вбудований сервіс
      4: 'index.service.general.place.built-in',
      // Помилка - сервіс відсутній
      0: 'index.service.general.place.error'
    };

    return stateByServiceType[serviceType.nID_ServiceType.nID];
  };

  self.getPlaceData();

});

/**

  TODO: броадкаст повідомлення про зміну свого стану, щоб підписані контроллери та директиви могли отримати актуальні дані.

  Послуги для тестування розробником, тест-кейси:

    159 > Дніпропетровська > Апостолове > має видати "сервіс недоступний".

    1) Послуга, де є тільки міста - дозволяє вибрати область, потім дає вибрати місто і переходить на крок 2
    2) Послуга, де є тільки області - дозволяє вибрати область, і переходить на крок 2
    3) Послуга, де є міста, що йдуть на початку і області - дозволяє вибрати область, потім, якщо по данній області є ще й міста, дає вибрати місто і переходить на крок 2, якщо міста по області немає - одразу переходить на крок 2
    4) Послуга, де є області, що йдуть на початку і міста - дозволяє вибрати область, потім, якщо по данній області є ще й міста, дає вибрати місто і переходить на крок 2, якщо міста по області немає - одразу переходить на крок 2
    5) Послуга, де немає ні областей ні міст (рівень країни) - одразу переходить на крок 2

  (п.1, п.3 и п.4. - city, п.2 - region, а п.5. - country -> place

    Файл ServiceData.csv - wf-central\src\main\resources\data\ServiceData.csv - визначає, де є послуга.

    В колонках nID_City і nID_Region — прив'язка до області / міста / країни ( якщо обидва значення === null ).
    В колонці nID_Service - ИД послуги

  Приклад багу: ("Тернопільска область" і "місто Кривий ріг" одночасно): https://test.igov.org.ua/wf-central/service/services/getService?nID=628  

  ok region no city
  no region no city
  no region ok city
  ! ok region ok city
  
  region only, built-in:

  655 NULL  1 4 {sPath:service/form/form-data,oParams:{processDefinitionId:dnepr_spravka_o_doxodax:1:1}}  https://test.region.igov.org.ua/wf-region/  FALSE 1 FALSE   BankID,EDS                            
  Отримання довідки про доходи фізичних осіб (тільки регіон - Дніпро, 1)
  https://test.igov.org.ua/service/655/general
  
  country only, external: 

  101 NULL  NULL  1 {}  http://map.land.gov.ua/kadastrova-karta FALSE 1 FALSE Ви можете отримати послугу на сайті Публічної кадастрової карти України BankID,EDS                              Надання відомостей з Державного земельного кадастру у формі витягу з Державного земельного кадастру про земельну ділянку
  https://test.igov.org.ua/service/101/general

  city:
  
  159 2 NULL  1 {}  https://dniprorada.igov.org.ua  FALSE 1 TRUE    BankID,EDS
  159 1 NULL  4 {   sPath:service/form/form-data,oParams:{processDefinitionId:dnepr_mreo_1:1:58}}  https://test.region.igov.org.ua/wf-region/  FALSE 1 FALSE   BankID,EDS                              
  702 3 NULL  1 {}  https://egov.city-adm.lviv.ua/  FALSE 1 FALSE Скористатися послугою можна на сайті порталу міста Львів. Для користування послугою треба будет увійти в систему через BankID або електронно-цифровий підпис  BankID,EDS                            
  159 6 NULL  1 {}  FALSE 1 FALSE Будь ласка, оберіть адресу МРЄВ,за якою Ви бажаєте отримати послугу: <br> <a href=/service/726/general?sID_UA_Region=8000000000&sID_UA_City=8000000000> Петропавлівська Борщагівка, вул.Кільцева 4</a> <br> <a href=/service/727/general?sID_UA_Region=8000000000&sID_UA_City=8000000000> вул. Туполєва, 19</a> <br /><a href=/service/728/general?sID_UA_Region=8000000000&sID_UA_City=8000000000> вул. Велика кільцева дорога. 22-А</a> <br /><a href=/service/729/general?sID_UA_Region=8000000000&sID_UA_City=8000000000> вул. Братиславська, 52</a> <br /><a href=/service/730/general?sID_UA_Region=8000000000&sID_UA_City=8000000000> вул. Столичне шосе, 104</a> <br /><a href=/service/731/general?sID_UA_Region=8000000000&sID_UA_City=8000000000> вул. Павла Усенка, 8</a> <br /><a href=/service/732/general?sID_UA_Region=8000000000&sID_UA_City=8000000000> вул. Новокостянтинівська, 8</a> <br /><a href=/service/733/general?sID_UA_Region=8000000000&sID_UA_City=8000000000> пров. Балтійський, 20</a> <br />                              

  107 4 8 NULL  4 {sPath:service/form/form-data,oParams:{processDefinitionId:kuznetsovsk_mvk_4:1:1}}  https://test.region.igov.org.ua/wf-region/  FALSE 1 FALSE   BankID,EDS

*/