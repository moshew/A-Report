// script.js
var domain = 'http://ikafe.tk/coffee-anan/srv/';

var app = angular.module('app', ['ngRoute', 'ngAnimate', 'ngMaterial', 'angucomplete-alt', 'multipleDatePicker', 'ngMobile']);
/*
app.run(function($http, $timeout, dataShare) {
    var id = window.localStorage.getItem("id");
    $http.jsonp(domain + 'ca-login.php?callback=JSON_CALLBACK&id=' + id)
        .success(function (data) {
            dataShare.set(data);
			$timeout(function () {
				if (data.ver <= 0.5) {
					if (data.id == -1) dataShare.action('login');
					else dataShare.changePage(data);
				} else dataShare.action('versionUpdate');
			}, 2000);

        });
});
*/
// configure our routes
app.config(function ($routeProvider) {
    $routeProvider

        .when('/', {
            templateUrl: 'pages/ca-home.html',
            controller: 'mainController'
        })

		.when('/home', {
            templateUrl: 'pages/ca-home.html',
            controller: 'mainController'
        })

        .when('/versionUpdate', {
            templateUrl: 'pages/ca-versionUpdate.html',
            controller: 'mainController'
        })

        .when('/login', {
            templateUrl: 'pages/ca-login.html',
            controller: 'loginController'
        })

        .when('/menu', {
            templateUrl: 'pages/ca-menu.html',
            controller: 'menuController'
        })

        .when('/sites', {
            templateUrl: 'pages/ca-sites.html',
            controller: 'machinesController'
        })

        .when('/site', {
            templateUrl: 'pages/ca-site.html',
            controller: 'machinesController'
        })

        .when('/notifications', {
            templateUrl: 'pages/ca-notifications.html',
            controller: 'notificationsController'
        })

        .when('/reports', {
            templateUrl: 'pages/ca-reports.html',
            controller: 'reportsController'
        })

        .when('/report', {
            templateUrl: 'pages/ca-report.html',
            controller: 'reportsController'
        })
		
		.when('/settings', {
            templateUrl: 'pages/ca-settings.html',
            controller: 'settingsController'
        })



});

app.config(function ($mdThemingProvider) {
    $mdThemingProvider
        .theme('default')
        .primaryPalette('deep-orange') //#ff5722
        .accentPalette('pink')
        .warnPalette('red')
        .backgroundPalette('blue-grey')
});

app.factory('dataShare', function ($http, $location, $timeout, $window) {
    var service = {};
    var pagePromise = null;
    service.data = null;
    service.settings = null;

    service.set = function (data) {
        this.data = data;
        if (this.data.hasOwnProperty("settings")) this.settings = this.data.settings;
    };
    service.get = function () {
        return this.data;
    };

    service.getSettings = function () {
        return this.settings;
    };

    service.setSettings = function(key1, val1) {
        this.settings[key1] = val1;
    };

    service.getZoomFactor = function() {
        return Math.min(window.innerWidth/3.75, window.innerHeight/6.67);
    };

    service.changePage = function (data, path) {
        if (data!=null) this.set(data);
        if (path == null) path = 'menu';
        $location.path(path);
    };

    service.action = function (oper, page, params) {
		if (page == null) service.changePage(null, oper);
		else {
			params = (params==null)?'':'&'+Object.keys(params).map(function(k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]) }).join('&');
			url = domain + page + '.php?callback=JSON_CALLBACK&id=' + this.get().id + params;
			service.setLoading(true);
			$http.jsonp(url)
			.success(function (data) {
				service.setLoading(false);
				service.changePage(data, oper);
			})
			.error(function (data) {
				service.setLoading(false);
			});
		}
    };

    var _loading = false;
    var wp = null;
    service.setLoading = function (start) {
        if (start) {
            wp = $timeout(function () {
                _loading = true;
            }, 300);
        }
        else {
            $timeout.cancel(wp);
            _loading = false;
        }
    };

    service.getLoading = function () {
        return _loading;
    };

    return service;
});

app.controller('mainController', function ($scope, $rootScope, $http, $window, $timeout, dataShare) {
    $scope.dataShare = dataShare;
    $scope.zoomFactor = dataShare.getZoomFactor();

	var id = window.localStorage.getItem("id");
    $http.jsonp(domain + 'ca-login.php?callback=JSON_CALLBACK&id=' + id)
        .success(function (data) {
            //dataShare.set(data);
			$timeout(function () {
				if (data.ver <= 0.5) {
					if (data.id == -1) dataShare.changePage(data, 'login');
					else dataShare.changePage(data);
				} else dataShare.action('versionUpdate');
			}, 2000);

        });

		
		
    $scope.enter = function (admin) {
        dataShare.setLoading(true);
        $http.jsonp(domain + 'login.php?callback=JSON_CALLBACK&id=' + dataShare.get().id)
            .success(function (data) {
                dataShare.setLoading(false);
                path = (admin) ? 'reportAdmin' : null;
                dataShare.changePage(data, path);
            })
            .error(function (data) {
                dataShare.setLoading(false);
            });
    };

    $scope.logout = function () {
        $http.jsonp(domain+'login.php?callback=JSON_CALLBACK&id='+dataShare.get().id+'delete')
            .success(function (data) {
                window.localStorage.removeItem("id");
                dataShare.set(data);
            });
    };
});

app.controller('loginController', function ($scope, $http, dataShare) {
    $scope.dataShare = dataShare;
    $scope.loginState = 'code';
    $scope.message = 'הקש את קוד המשתמש לכניסה';
    $scope.value = '';
    $scope.index = 0;
    $scope.fills = [{ value: true }, { value: true }, { value: true }, { value: true }, { value: true }];

    $scope.press = function (val) {
        if (val == 'r') {
            if ($scope.index > 0) {
                $scope.index--;
                $scope.value = $scope.value.slice(0, -1);
            }
            else return;
        }
        else {
            $scope.value += val;
        }

        if ($scope.loginState == 'code') {
            $scope.fills[$scope.index].value = !($scope.fills[$scope.index].value);
        }

        if (val != 'r') $scope.index++;

        if ($scope.loginState == 'code' && $scope.index == 5) {
            dataShare.setLoading(true);
            $http.jsonp(domain+'ca-login.php?callback=JSON_CALLBACK&tid=' + $scope.value)
            .success(function (data) {
                dataShare.setLoading(false);
                refresh();
                if (data.id != -1) {
                    window.localStorage.setItem("id", data.id);
                    dataShare.changePage(data);
                }
            });

        } else if ($scope.loginState == 'phone' && $scope.index == 10) {
            dataShare.setLoading(true);
            $http.jsonp(domain+'ca-sendcode.php?callback=JSON_CALLBACK&phone=' + $scope.value)
            .success(function (data) {
                dataShare.setLoading(false);
                $scope.sendCodeScreen = true;
            });
        }
    };

    $scope.sendCode = function () {
        refresh();
        $scope.loginState = ($scope.loginState == 'code') ? 'phone' : 'code';
        $scope.message = ($scope.loginState == 'code') ? 'הקש את קוד המשתמש לכניסה' : 'הכנס מספר ווטסאפ למשלוח קוד';
    };

    refresh = function () {
        $scope.value = '';
        $scope.index = 0;
        $scope.fills = [{ value: true }, { value: true }, { value: true }, { value: true }, { value: true }];
    };
});

app.controller('menuController', function ($scope, $http, $location, dataShare, $timeout) {
    $scope.dataShare = dataShare;
    if (dataShare.get()==null) { $location.path(''); return; }

    $scope.myStyle = [null,null,null,null];

	var pages = [['sites','ca-sites'], ['notifications','ca-notifications'], ['reports'], ['settings','ca-settings']];
    $scope.report = function (option) {
		$scope.myStyle[option] = { 'background-color': 'rgba(0,0,0,0.2' };
		dataShare.action(pages[option][0], pages[option][1]);
    };
});

app.controller('machinesController', function ($scope, $http, $timeout, $location, dataShare) {
    $scope.dataShare = dataShare;
    if (dataShare.get()==null) { $location.path(''); return; }
	$scope.stockupdateinp = {val: 2};

    $scope.siteStockUpdateCB = function(approve) {
		if (!approve) {
			$scope.errorMsg = false;
			return;
		}
		if ($scope.stockupdateinp.val==null) return;
		dataShare.setLoading(true);
		$http.jsonp(domain + 'ca-updateStock.php?callback=JSON_CALLBACK&id=' + dataShare.get().id + "&sid=" + dataShare.get().site.id + "&val=" + $scope.stockupdateinp.val)
            .success(function (data) {
				dataShare.setLoading(false);
                dataShare.set(data);
                $scope.errorMsg = false;
            });
    }
					
});

app.controller('reportsController', function ($scope, $http, $location, $timeout, dataShare) {
    $scope.dataShare = dataShare;
	if (dataShare.get()==null) { $location.path(''); return; }
	
	$scope.reports = [{id:0, title:'דוח זמינות באתרים',img:"1.png"}, {id:1, title:'דוח ניצול חודשי', img:"2.png"}, {id:2, title:'יצירת לו"ז עתידי', img:"3.png"}];

	$scope.getReport = function (op) {
		params = {'op': op};
		dataShare.action('report', 'ca-report', params);
    };

});


app.controller('settingsController', function ($scope, $http, $location, $timeout, dataShare) {
    $scope.dataShare = dataShare;
	if (dataShare.get()==null) { $location.path(''); return; }
	
    var switchEnable = true;
	
	$scope.settings = [{title:'התראה על אי שימוש במכונה למעלה מ-24 שעות',status:true}, {title:'התרעה על זמינות נמוכה מ-20% באתר', status:true}];
	
	$scope.switchSetting = function (setting) {
        if (switchEnable) {
            switchEnable = false;
            $timeout(function () { switchEnable = true; }, 500);
            setting.status = !setting.status;
        }
    };

    $scope.closePermissions = function (save) {
        dataShare.changePage();
    };
});

app.controller('notificationsController', function ($scope, $http, $location, $timeout, dataShare) {
    $scope.dataShare = dataShare;
    if (dataShare.get()==null) { $location.path(''); return; }
});

angular.module('app').config(function ($mdDateLocaleProvider) {
    $mdDateLocaleProvider.formatDate = function (date) {
        return moment(date).format('D/M/YYYY');
    };
});