/*
 * Controller to control the header actions.
 *
 * Created by nbehotas on 13/10/16.
 */
lqModule.controller('headerController', ['$scope', 'linkService', 'searchService', 'applicationState','signInService', '$timeout', 'userProfileService', '$window', 
    function ($scope, linkService, searchService, applicationState,signInService, $timeout, userProfileService, $window) {
        $scope.search = searchService.data;
        $scope.isNavCollapsed = true;
        $scope.selectingLanguage = false;
        $scope.selectingContrast = false;
        $scope.isLoggedIn = applicationState.isUserLoggedIn;
        $scope.currentSubMenu = -1;
        $scope.subNavSelection = -1;
        $scope.showCollapsibleSubNav = false;
        $scope.showDesktopSubNav = false;
        $scope.hideSubNav0 = false;
        $scope.hideSubNav1 = false;
        $scope.hideSubNav2 = false;
        $scope.hideSubNav3 = false;
        $scope.signOut=signInService.signOut;
        if($window.localStorage.getItem('securityToken')){ //if page is refreshed
          $scope.userFirstName =JSON.parse($window.localStorage.getItem('userProfileData')).firstName;
          $scope.userPoints = JSON.parse($window.localStorage.getItem('userProfileData')).pointsSummary.currentPointsBalance;
          $scope.$on('redeem-points', function(event, data) {
              $scope.userPoints = data;
          });
        }
        $scope.$watch(function() {
            return applicationState.data.loggedIn;
            }, function watchCallback(newValue, oldValue) {
                if(newValue!== oldValue){
                    applicationState.getSecurityToken().then(function(authToken){
                        userProfileService.getBasicUserInfo(authToken).then(function(userData){
                            $scope.userFirstName=userData.firstName;    
                        });
                        userProfileService.getPoints(authToken).then(function(pointsSummary){
                            $scope.userPoints=pointsSummary.currentPointsBalance;
                        });
                    });                  
                }}, true);
         
        $scope.toggleMenu = function () {
            if (!$scope.isNavCollapsed) {
                $scope.selectingLanguage = false;
                $scope.selectingContrast = false;
                searchService.setNavBarOpen(false);
            } else {
                searchService.setNavBarOpen(true);
            }
            $scope.isNavCollapsed = !$scope.isNavCollapsed;
        };

        $scope.subMenuChangeSelection = function(index) {
            $scope.currentSubMenu = index;
            $scope.subNavSelection = -1;
            $scope.openSubNavDesktop(index);
            return true;
        };


        $scope.isSubMenuActive = function(index, hideSubNav) {
            if ($scope.currentSubMenu === index && !hideSubNav && $scope.search.showSubNav) {
                return "active";
            } else {
                return "";
            }
        };

        $scope.openSubNavDesktop = function(index) {
            $scope.search.showSubNav = $scope.hasSubmenuItems(index);
            if($scope.hasSubmenuItems(index) && !$scope.isSubNavHidden()){
                document.getElementById("bodyContent").className += ' has-sub-nav';
            }
            else {
                $scope.closeSubNavDesktop();
            }
        };

        $scope.closeSubNavDesktop = function() {
            $scope.search.showSubNav = false;
            $scope.currentSubMenu = -1;
            document.getElementById("bodyContent").className = document.getElementById("bodyContent").className.replace('has-sub-nav','');
        };

        $scope.openSubNavMobile = function() {
            $scope.showCollapsibleSubNav = true;
        };

        $scope.closeSubNavMobile = function() {
            $scope.showCollapsibleSubNav = false;
        };

        $scope.selectSubNavLink = function(index) {
            console.log(index);
            $scope.subNavSelection = index;
        };

        $scope.hideSubNavSelection = function(hideSubNav0, hideSubNav1, hideSubNav2, hideSubNav3) {
            $scope.hideSubNav0 = hideSubNav0;
            $scope.hideSubNav1 = hideSubNav1;
            $scope.hideSubNav2 = hideSubNav2;
            $scope.hideSubNav3 = hideSubNav3;
        };

        $scope.isSubNavHidden = function() {
            if (($scope.currentSubMenu === 0 && $scope.hideSubNav0) ||
                ($scope.currentSubMenu === 1 && $scope.hideSubNav1) ||
                ($scope.currentSubMenu === 2 && $scope.hideSubNav2) ||
                ($scope.currentSubMenu === 3 && $scope.hideSubNav3)) {
                return true;
            }
        };

        $scope.hasSubmenuItems = function(index) {
            return $(".header__sub-nav__content__label-wrapper .header__sub-nav__content__item[data-subnavindex ="+ index +"]").length > 0;
        };

        $scope.initLink = linkService.initLink;

        var init = function () {
        };
        init();

    }]);