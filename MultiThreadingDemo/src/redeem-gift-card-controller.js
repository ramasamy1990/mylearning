/**
 * @file Redeem Gift Card Controller 
 */
(function () {
    'use strict';

    function redeemGiftCardController($scope, $rootScope, $location, $window, applicationState, userProfileService, rewardsService, linkService, accountSummaryService) {
        /* jshint validthis: true */
        var vm = this;

        $scope.$watch(function () {
            return applicationState.data.loggedIn;
        }, function watchCallback(newValue, oldValue) {
            if (!newValue) {
                vm.redirectBackToParentPage();
            } 			
        }, true);           

        function initUserInfo(isCacheClear, redirectUrl) {	
            vm.redirectPageUrl = redirectUrl;
            if (rewardsService.selectedReward.rewardId) {	                                  
                vm.quantity = rewardsService.selectedReward.quantity;
                vm.rewardDetails = rewardsService.selectedReward;
                if (applicationState.data.loggedIn) {
                    var securityTokenPromise = applicationState.getSecurityToken();
                    securityTokenPromise.then(function (securityToken) {
                        userProfileService.getBasicUserInfo(securityToken, isCacheClear).then(function (userInfo) {
                            vm.basicUserInfo = userInfo;
                            vm.address = userInfo.address;
                        });
                    });
                    accountSummaryService.getPointsSummary().then(function (pointSummary) {
                        vm.currentUserPointsBalance = pointSummary.currentPointsBalance;
                        calculateTotalPoints();
                    }); 

                }
            } else {
                vm.redirectBackToParentPage();
            }
        }

        function redirectBackToParentPage() {
            var wcmMode = $('#data-wcm-mode').val();
            if (wcmMode === 'wcm-disabled') {
                if (vm.redirectPageUrl) {
                    window.location.href = linkService.initLink(vm.redirectPageUrl);
                } else {
                    $window.location.href = "#/home";
                }
            }
        }

        function redirectToEditProfile(url) {            
            if (url.trim().length > 0) {
                userProfileService.editFlag = true;                
                $location.path(url);       
            }
        }

        function navigate(url) {
            if (url.trim().length > 0) {
                $location.path(url);
            }
        }

        $scope.increase = function (quantity) {
            if (quantity < 9) {
                vm.quantity++;
                calculateTotalPoints();
            }
        };
        $scope.decrease = function (quantity) {
            if (quantity > 1) {
                vm.quantity--;
                calculateTotalPoints();
            }
        };

        function calculateTotalPoints() {
            if (vm.quantity && vm.rewardDetails.points) {
                vm.totalPoints = vm.quantity * vm.rewardDetails.points;                
            }
            validateUserPointsForRedeem();
        }        

        function validateUserPointsForRedeem() {
            if(vm.totalPoints > vm.currentUserPointsBalance) {
                vm.insufficientPointsFlag = true;
            } else {
                vm.insufficientPointsFlag = false;
            }           
        }

        function redeemOrder(redirectUrl) {
            rewardsService.redeemOrderReward().then(                   
                function successCallback(response) {
                    if (response.status === 200 && redirectUrl.trim().length > 0) {
                        $rootScope.$broadcast('redeem-points',vm.currentUserPointsBalance);
                        window.location.href = linkService.initLink(redirectUrl);		   
                    } 
                }, function errorCallback(response) {
                    response.then(function(response){                      
                        if (getErrorCodeFromResponse(response) === 422) {
                            vm.insufficientPointsFlag = true; 
                        } else {                         
                            vm.redeemFailureFlag = true;
                            vm.errorMessage = response;
                        }
                    });              
                });        
        } 

        function getErrorCodeFromResponse(response) {
            var errorCode = "";
            if(response.indexOf(";") > 0 && response.indexOf("-") > 0) {
                var errorString = response.split(";")[1].split("-")[0].trim();
                if(errorString && errorString.length > 0) {
                    errorCode = parseInt(errorString);
                }
            } 
            return errorCode;
        }

        //--------------------- < View model exposed >

        vm.basicUserInfo = {};
        vm.address = {};     
        vm.rewardDetails = {};
        vm.quantity = {}; 
        vm.redirectPageUrl = {};
        vm.totalPoints = 0;	
        vm.currentUserPointsBalance = {};
        vm.errorMessage = {};
        vm.redeemFailureFlag = false;
        vm.insufficientPointsFlag = false;        
        vm.initUserInfo = initUserInfo;
        vm.redeemOrder = redeemOrder;
        vm.navigate = navigate;
        vm.redirectToEditProfile = redirectToEditProfile;
        vm.redirectBackToParentPage = redirectBackToParentPage;        
    }
    lqModule.controller('redeemGiftCardController', redeemGiftCardController);
    redeemGiftCardController.$inject = ['$scope', '$rootScope', '$location', '$window', 'applicationState', 'userProfileService', 'rewardsService', 'linkService', 'accountSummaryService'];
})();