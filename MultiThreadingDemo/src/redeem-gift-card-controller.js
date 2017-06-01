/**
 * @file Redeem Gift Card Controller 
 */
(function() {
    'use strict';

    function redeemGiftCardController($scope, $rootScope, $location, $window, applicationState, userProfileService, rewardsService, linkService, accountSummaryService) {
        /* jshint validthis: true */
        var vm = this;

        $scope.$watch(function() {
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
                    securityTokenPromise.then(function(securityToken) {
                        userProfileService.getBasicUserInfo(securityToken, isCacheClear).then(function(userInfo) {
                            vm.basicUserInfo = userInfo;
                            vm.address = userInfo.address;
                        });
                    });
                    accountSummaryService.getPointsSummary().then(function(pointSummary) {
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
                    navigate(vm.redirectPageUrl);
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

        $scope.increase = function(quantity) {
            if (quantity < 9) {
                vm.quantity++;
                calculateTotalPoints();
            }
        };
        $scope.decrease = function(quantity) {
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
            if (vm.totalPoints > vm.currentUserPointsBalance) {
                vm.insufficientPointsFlag = true;
            } else {
                vm.insufficientPointsFlag = false;
            }
        }

        function fetchUpdatedUserPoints(isCacheClear) {
            if (applicationState.data.loggedIn) {
                var securityTokenPromise = applicationState.getSecurityToken();
                securityTokenPromise.then(function(securityToken) {
                    userProfileService.getBasicUserInfo(securityToken, isCacheClear).then(function(userInfo) {
                        vm.basicUserInfo = userInfo;
                    });
                });
                accountSummaryService.getPointsSummary().then(function(pointSummary) {
                    vm.currentUserPointsBalance = pointSummary.currentPointsBalance;
                });
            }
        }
        
        function redeemOrder(redirectUrl) {
            rewardsService.redeemOrderReward(vm.quantity).then(
                function successCallback(response) {
                    if (response.status === 200 && redirectUrl.trim().length > 0) {
                       fetchUpdatedUserPoints(true);                       
                       $rootScope.$broadcast('update-points', true);
                       navigate(redirectUrl);   
                    }                                           
                },
                function errorCallback(response) {                    
                    response.then(function(response) {                    
                            vm.redeemFailureFlag = true;
                            vm.errorMessage = response;
                    });
                });
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