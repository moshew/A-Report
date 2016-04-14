// script.js

// create the module and name it app
// also include ngRoute for all our routing needs
var app = angular.module('app', ['ngRoute', 'ngAnimate', 'ngMaterial', 'ngMdIcons', 'angucomplete-alt']);
//var domain = 'http://areport-myfirsttestapp.rhcloud.com/';
var domain = 'http://a-report.co.il/';

// configure our routes
app.config(function ($routeProvider) {
    $routeProvider

        .when('/', {
            templateUrl: 'pages/home.html',
            controller: 'mainController'
        })

        .when('/login', {
            templateUrl: 'pages/login.html',
            controller: 'loginController'
        })

        .when('/status', {
            templateUrl: 'pages/status.html',
            controller: 'statusController'
        })

        .when('/report', {
            templateUrl: 'pages/report.html',
            controller: 'statusController'
        })

        .when('/settings', {
            templateUrl: 'pages/settings.html',
            controller: 'settingsController'
        })

        .when('/statusList', {
            templateUrl: 'pages/statusList.html',
            controller: 'statusListController'
        })

        .when('/reportOpt', {
            templateUrl: 'pages/reportOpt.html',
            controller: 'statusController'
        })

        .when('/futureReport', {
            templateUrl: 'pages/futureReport.html',
            controller: 'statusController'
        })

        .when('/futureStatus', {
            templateUrl: 'pages/futureStatus.html',
            controller: 'statusController'
        });



});

app.config(function ($mdThemingProvider) {
    $mdThemingProvider
        .theme('default')
        .primaryPalette('deep-orange') //#ff5722
        .accentPalette('pink')
        .warnPalette('red')
        .backgroundPalette('blue-grey')
});

app.factory('dataShare', function ($http, $location, $timeout) {
    var service = {};
    var pagePromise = null;
    service.data = false;
    service.settings = false;

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

    service.changePage = function (data, path) {
        this.mainPage = false;
        this.set(data);
        if (path == null) {
            if (data.id == -1) path = 'login';
            else {
                if (data.hasOwnProperty('futurePage')) {
                    if (data.status == -1) path = 'futureReport';
                    else path = 'futureStatus';
                }
                else {
                    this.mainPage = true;
                    if (data.status == -1) path = 'report';
                    else path = 'status';
                }
            }
        }
        $location.path(path);
        $timeout.cancel(pagePromise);
        pagePromise = $timeout(function () {
            this.mainPage = false;
            $location.path('');
        }, 5 * 60 * 1000);
    };

    service.action = function (oper) {
        page = (oper == 'future') ? 'future_report' : 'login';
        url = domain + page + '.php?callback=JSON_CALLBACK&id=' + this.get().id;
        service.setLoading(true);
        $http.jsonp(url)
        .success(function (data) {
            service.setLoading(false);
            if (oper=='main' || oper=='future') service.changePage(data);
            else service.changePage(data, oper);
        });
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
    }

    service.getLoading = function () {
        return _loading;
    }

    return service;
});

app.controller('mainController', function ($scope, $http, $location, dataShare) {
    $scope.dataShare = dataShare;
    $scope.zoom_factor = window.innerHeight / 6.67;
    $scope.i_width = window.innerWidth;
    $scope.i_height = window.innerHeight;
    $scope.enter = function () {
        dataShare.setLoading(true);
        $http.jsonp(domain+'login.php?callback=JSON_CALLBACK')
            .success(function (data) {
                dataShare.setLoading(false);
                if (data.ver == 1.0) {
                    dataShare.changePage(data);
                } else {
                    $scope.versionUpdate = true;
                }
            });
    };
});

app.controller('loginController', function ($scope, $http, $location, $mdDialog, dataShare) {
    $scope.dataShare = dataShare;
    $scope.loginSate = 'code';
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

        if ($scope.loginSate == 'code') {
            $scope.fills[$scope.index].value = !($scope.fills[$scope.index].value);
        }

        if (val != 'r') $scope.index++;

        if ($scope.loginSate == 'code' && $scope.index == 5) {
            dataShare.setLoading(true);
            $http.jsonp(domain+'login.php?callback=JSON_CALLBACK&id=' + $scope.value)
            .success(function (data) {
                dataShare.setLoading(false);
                refresh();
                if (data.id != -1) dataShare.changePage(data);
            });

        } else if ($scope.loginSate == 'phone' && $scope.index == 10) {
            dataShare.setLoading(true);
            $http.jsonp(domain+'send_code.php?callback=JSON_CALLBACK&p_id=' + $scope.value)
            .success(function (data) {
                dataShare.setLoading(false);
                $scope.sendCodeScreen = true;
                $scope.loginCodeResponse = (data.status) ? 'found' : 'not-found';
            });
        }
    };

    $scope.sendCode = function () {
        refresh();
        $scope.loginSate = ($scope.loginSate == 'code') ? 'phone' : 'code';
        $scope.message = ($scope.loginSate == 'code') ? 'הקש את קוד המשתמש לכניסה' : 'הכנס מספר ווטסאפ למשלוח קוד';
    };

    refresh = function () {
        $scope.value = '';
        $scope.index = 0;
        $scope.fills = [{ value: true }, { value: true }, { value: true }, { value: true }, { value: true }];
    };
});

app.controller('statusController', function ($scope, $http, $location, dataShare) {
    $scope.dataShare = dataShare;
    $scope.loginData = dataShare.get();
    $scope.settingsData = dataShare.getSettings();
    $scope.mainPage = dataShare.mainPage;
    $scope.reportedUsers = [];
    $scope.reportPage='main';

    $scope.status_labels = ['נוכח', 'חופש', 'מחלה', 'חו"ל', '\'מחוץ ליח', 'קורס', 'מיוחדת', 'הצהרה', '\'יום ד', 'מחלת ילד', 'לידה', 'אחר'];
    $scope.status_label = $scope.status_labels[dataShare.get().status];
    $scope.myStyle = [null,null,null,null,null,null,null,null,null,null,null,null];

    var reportSent = false;
    $scope.report = function (status) {
        if (reportSent && status >= 0) return;
        else if (reportSent && status == -1) reportSent = true;
        else reportSent = true;

        if (status>0) {
            $scope.myStyle[status] = { 'background-color': '#80be40' };
        }
        dataShare.setLoading(true);
        $http.jsonp(domain+'report.php?callback=JSON_CALLBACK&id=' + $scope.loginData.id + '&day=' + $scope.loginData.day + '&oper=' + status)
        .success(function (data) {
            dataShare.setLoading(false);
            $http.put(domain+'report_notification.php');
            dataShare.changePage(data);
        });
    };

    $scope.futureReport = function (cancel) {
        if (cancel) future_status = -1;
        var start_day = moment($scope.report_dates.start_day).format('YYYY-MM-DD');
        var end_day   = moment($scope.report_dates.end_day).format('YYYY-MM-DD');
        $http.jsonp(domain+'future_report.php?callback=JSON_CALLBACK&id=' + $scope.loginData.id + '&start_day=' + start_day + '&end_day=' + end_day + '&oper=' + future_status)
            .success(function (data) {
                $http.put(domain+'report_notification.php');
                dataShare.changePage(data);
            });
    };

    $scope.today = new Date($scope.loginData.day);
    var tomorrow = new Date();
    tomorrow.setDate($scope.today.getDate() + 1);
    $scope.report_dates = { start_day: tomorrow, end_day: tomorrow };

    $scope.dateChanged = function () {
        if ($scope.report_dates.end_day < $scope.report_dates.start_day)
            $scope.report_dates.end_day = $scope.report_dates.start_day;
    };

    var future_status = 1;
    $scope.report2BtnStyle = [null, { 'background-color': '#80be40' }, null, null, null, null, null, null, null, null, null, null];
    $scope.changeFutureStatus = function (status) {
        $scope.report2BtnStyle[future_status] = { 'background-color': '#234a7d' };
        $scope.report2BtnStyle[status] = { 'background-color': '#80be40' };
        future_status = status;
    };
});
/*
app.controller('settingsController', function ($scope, $http, $location, dataShare) {
    $scope.settingsPage='main';
    $scope.dataShare = dataShare;
    $scope.loginData = dataShare.get();
    $scope.settingsData = dataShare.getSettings();
    $scope.mainPage = dataShare.mainPage;

    $http.jsonp(domain+'notifications.php?callback=JSON_CALLBACK&id=' + $scope.loginData.id)
    .success(function (data) {
        $scope.reportedUsers = data;
    });

    var changeSetting = false;
    $scope.changeSettings = function (setting) {
        if (changeSetting) return;
        changeSetting = true;
        key = Object.keys($scope.loginData.settings)[setting];
        $scope.loginData.settings[key] = !($scope.loginData.settings[key]);
        url = domain+'settings.php?callback=JSON_CALLBACK&id=' + $scope.loginData.id + '&key=' + key + '&value=' + $scope.loginData.settings[key];
        $http.jsonp(url)
        .success(function () {
            setTimeout(function () {
                changeSetting = false;
            }, 500);
        });
    }

    $scope.removeUser = function (user) {
        $http.jsonp(domain+'notifications.php?callback=JSON_CALLBACK&op=del&id=' + $scope.loginData.id+'&user='+user)
            .success(function (data) {
                $scope.reportedUsers = data;
            });
    }

    $scope.addUser = function (user) {
        $http.jsonp(domain + 'notifications.php?callback=JSON_CALLBACK&op=req&id=' + $scope.loginData.id + '&user=' + user.originalObject.name)
            .success(function (data) {
                $scope.reportedUsers = data;
                $scope.$broadcast('angucomplete-alt:clearInput', 'settings-AddUser');

            });
    }
});
*/
app.controller('statusListController', function ($scope, $http, $location, dataShare) {
    $scope.dataShare = dataShare;
    $scope.editMode = false;

    $http.jsonp(domain+'notifications.php?callback=JSON_CALLBACK&id=' + $scope.loginData.id)
        .success(function (data) {
            $scope.reportedUsers = data;
        });

    $scope.removeUser = function (user) {
        $http.jsonp(domain+'notifications.php?callback=JSON_CALLBACK&op=del&id=' + $scope.loginData.id+'&user='+user)
            .success(function (data) {
                $scope.reportedUsers = data;
            });
    }

    $scope.addUser = function (user) {
        $http.jsonp(domain + 'notifications.php?callback=JSON_CALLBACK&op=req&id=' + $scope.loginData.id + '&user=' + user.originalObject.name)
            .success(function (data) {
                $scope.reportedUsers = data;
                $scope.$broadcast('angucomplete-alt:clearInput', 'settings-AddUser');

            });
    }
});

angular.module('app').config(function ($mdDateLocaleProvider) {
    $mdDateLocaleProvider.formatDate = function (date) {
        return moment(date).format('D/M/YYYY');
    };
});

