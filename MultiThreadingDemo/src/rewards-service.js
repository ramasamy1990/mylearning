/**
 * @file Angular service for populate rewards from OSGI config, Admin page and LQ service
 */
(function() {
	'use strict';
	
	var rewardsObject = {
			userGiftCards: [],
			guestGiftCards: [],
			userPartnerOffers: [],
			guestPartnerOffers: [],
			adminPageData: {
				partnerOffersData: [],
				giftCardsData: []
				
			}
	};

	var busy = false;
	var promise;
	
    function rewardsService($rootScope, $q, osgiConfigService, lqEcommerceEndpoint, applicationState, userProfileService, rewardsAdminEndpoint) {
        
         //---------------------------------< implementation>

    	/* Get all gift cards */
       function getAllGiftCards(){
    	   if(applicationState.isUserLoggedIn()){
    		   return getUserGiftCards();
    	   }else{
    		   return getGiftCards();
    	   }
       }
	   
	           /* Get all partner Offers cards */
        function getAllPartnerOffers() {
            if (applicationState.isUserLoggedIn()) {
                return getUserPartnerOffers();
            } else {
                return getPartnerOffers();
            }
        }
       
       /* get gift cards for logged-in user */
       function getUserGiftCards(){
    	   var defer = $q.defer();
    	   if(rewardsObject.userGiftCards.length > 1){
    		   defer.resolve(rewardsObject.userGiftCards);
    	   }else{
    		   if(!busy){
    			   busy = true;
    			   getRewardsConfig().then(function(rewardsConfig){
            		   var giftCategories = rewardsConfig.giftOffers;
            		   var rewardsPromises = giftCategories.map(function(item){
            			  return getUsergiftCardsByCategory(item).then(function(giftCardList){
            				  if(giftCardList.length > 0){
            					  rewardsObject.userGiftCards = rewardsObject.userGiftCards.concat(giftCardList);
            				  }
            			  });
            		   });
            		  return $q.all(rewardsPromises).then(function(data){
            			   busy = false;
            			   defer.resolve(rewardsObject.guestGiftCards);
            		   });
            	   }); 
    		   }else{
    			   return promise;
    		   }
    	   }
    	   promise = defer.promise;
    	   return defer.promise;
       }
       
       /* get gift cards for anonymouse user */
       function getGiftCards(){
    	   var defer = $q.defer();
    	   if(rewardsObject.guestGiftCards.length > 1){
    		   defer.resolve(rewardsObject.guestGiftCards);
    	   }else{
    		   if(!busy){
    			   busy = true;
    			   getRewardsConfig().then(function(rewardsConfig){
            		   var giftCategories = rewardsConfig.giftOffers;
            		   var rewardsPromises = giftCategories.map(function(item){
            			  return getgiftCardsByCategory(item).then(function(giftCardList){
            				  if(giftCardList.length > 0){
            					  rewardsObject.guestGiftCards = rewardsObject.guestGiftCards.concat(giftCardList);
            				  }
            			  });
            		   });
            		  return $q.all(rewardsPromises).then(function(data){
            			   busy = false;
            			   defer.resolve(rewardsObject.guestGiftCards);
            		   });
            	   });
        	   }else{
        		   return promise;
        	   }
    	   }
    	   promise = defer.promise;
    	   return defer.promise;
       }
	   
	    /* get partner offers for logged-in user */
        function getUserPartnerOffers() {
            if (rewardsObject.userPartnerOffers.length > 1) {
                return $q.when(rewardsObject.userPartnerOffers);
            } else {
                return getRewardsConfig().then(function(rewardsConfig) {
                    var partnerOffersCategories = rewardsConfig.partnerOffers;
                    var rewardsPromises = partnerOffersCategories.map(function(item) {
                        return getUsergiftCardsByCategory(item).then(function(partnerOffersList) {
                            if (partnerOffersList.length > 0) {
                                rewardsObject.userPartnerOffers = rewardsObject.userPartnerOffers.concat(partnerOffersList);
                            }
                        });
                    });
                    return $q.all(rewardsPromises);
                });
            }
        }
		
		/* Get partner offers for anonymous user */
        function getPartnerOffers() {
            if (rewardsObject.guestPartnerOffers.length > 1) {
                return $q.when(rewardsObject.guestPartnerOffers);
            } else {
                return getRewardsConfig().then(function(rewardsConfig) {
                    var partnerOffersCategories = rewardsConfig.partnerOffers;
                    var rewardsPromises = partnerOffersCategories.map(function(item) {
                        return getgiftCardsByCategory(item).then(function(partnerOffersList) {
                            if (partnerOffersList.length > 0) {
                                rewardsObject.guestPartnerOffers = rewardsObject.guestPartnerOffers.concat(partnerOffersList);
                            }
                        });
                    });
                    return $q.all(rewardsPromises);
                });
            }
        }
       
        /* Get logged-in user gift cards for given category */
        function getUsergiftCardsByCategory(category){
     	   return applicationState.getSecurityToken().then(function(securityToken){
 			   var httpConfig = {
 	                    headers: {
 	                        "Lq_auth_key": securityToken
 	                    }
 	                };
 			  return lqEcommerceEndpoint.getRewardOptionsLoggedIn(category, httpConfig).then(function(giftCardslist){
 				   return giftCardslist.data;
 			   });
 		   });
        }
        
        function setRedeemOfferConfirmationNumber(response) {
            try {                
                if (response.data.confirmationNumber.number) {
                    service.data.redeemOfferConfirmationNumber = response.data.confirmationNumber.number;
                }
            } catch (exception) {
                console.error(exception);
            }
        }
        
        /* Get logged-in user gift cards for given category */
        function redeemOrderReward(quantity){           
     	   return applicationState.getSecurityToken().then(function(securityToken){
     		  var httpConfig = {
	                    headers: {
	                        "Lq_auth_key": securityToken
	                    }
	                };
                
               return userProfileService.getReturnsId(securityToken).then(function(returnsId){  
                   return userProfileService.getBasicUserInfo(securityToken).then(function(userProfileData){
    			       var profileDetails =
    			    		{	
    			    		 "RewardOrder": {
    			    		   "partnerAccountNumber": service.data.selectedReward.partnerRewardOption.partnerItemId,
    			    		   "quantity": quantity,
    			    		   "returnsNumber": {
    			    		     "id": returnsId
    			    		   },
    			    		   "rewardId": {
    			    		     "id": service.data.selectedReward.rewardId.id
    			    		   },
    			    		   "shippingAddress": {
    			    		     "city": userProfileData.address.city,
    			    		     "countryCode": userProfileData.address.countryCode,
    			    		     "countryDisplay": userProfileData.address.countryDisplay,
    			    		     "county": userProfileData.address.county,
    			    		     "postalCode": userProfileData.address.postalCode,
    			    		     "stateProvince": userProfileData.address.stateProvince,
    			    		     "stateProvinceDisplay": userProfileData.address.stateProvinceDisplay,
    			    		     "street": userProfileData.address.street,
    			    		     "street2": userProfileData.address.street2,
    			    		     "firstName": userProfileData.firstName,
    			    		     "lastName": userProfileData.lastName
    			    		   }
    			    		 }
    			    		};
    				 	
    				   return lqEcommerceEndpoint.redeemRewards(profileDetails, httpConfig).then(function(response){                          
    				        return response;
    	 			   }); 			 
    			   });
               }); 			
 		   });
        }
        
        /* Get anonymous user gift cards for given category */
       function getgiftCardsByCategory(category){
    		   return lqEcommerceEndpoint.getRewardOptions(category).then(function(giftCardslist){
				   return giftCardslist.data;
			   });
       }
       
       /* Get gift cards admin page data */
       function getgiftCardsAdminPageData() {
    	   if( (rewardsObject.adminPageData.giftCardsData.length > 1)){
    		    return $q.when(rewardsObject.adminPageData.giftCardsData);
    	   }else{
    		   return rewardsAdminEndpoint.getRewardOffersAdminData('giftcardsoffers').then(function(rewardsAdminList) {
                   Object.keys(rewardsAdminList).forEach(function(key) {
                       rewardsObject.adminPageData.giftCardsData[key] = rewardsAdminList[key];
                   });
               });
    	   }
       }
       
       /* Get partner offers admin page data */
       function getPartnerOffersAdminPageData() {
    	   if( (rewardsObject.adminPageData.partnerOffersData.length > 1)){
    		    return $q.when(rewardsObject.adminPageData.partnerOffersData);
    	   }else{
    		   return rewardsAdminEndpoint.getRewardOffersAdminData('partneroffers').then(function(rewardsAdminList) {
                   Object.keys(rewardsAdminList).forEach(function(key) {
                       rewardsObject.adminPageData.partnerOffersData[key] = rewardsAdminList[key];
                   });
               });
    	   }
       }
       
       /* Get rewards OSGI config */
       function getRewardsConfig(){
    	   return osgiConfigService.selectConfig('rewards').then(function(config){
    		   return config;
    	   });
       }
       
       /* Get Points for user-profile */
       function getUserPointsSummary(){
			return applicationState.getSecurityToken().then(function(authToken){
			 return  userProfileService.getPoints(authToken).then(function(points){
	                return points;
					});
				});
       }
       
       /* Set selected reward */
       function setSelectedReward(reward, quantity){
    	   service.data.selectedReward = reward;
    	   service.data.selectedReward.quantity = quantity;
       }
       
       /* Get reward details by rewardId */
       function getRewardDetails(rewardId){
    	   var rewardDetails = {};
    	   return service.getAllGiftCards().then(function(giftCards){
    		   giftCards.forEach(function(item){
    			   if(item.rewardId.id === rewardId){
    				   rewardDetails = item;
    			   }
    		   });
    		   return rewardDetails;
    	   });
       }
       
       /**
        * This method clears reward data on sign-out
        */          
        $rootScope.$on('signout-cache-flush', function () {
            rewardsObject.userGiftCards=[];
            rewardsObject.userPartnerOffers = [];
            service.data.selectedReward = {};
            service.data.redeemOfferConfirmationNumber = {};            
       });
        
		//-----------------< Exposed interface >
		var service = {
                getAllGiftCards: getAllGiftCards,
				getUserPointsSummary: getUserPointsSummary,
				getPartnerOffersAdminPageData: getPartnerOffersAdminPageData,
				getgiftCardsAdminPageData: getgiftCardsAdminPageData,
				getAllPartnerOffers: getAllPartnerOffers,
				rewardsObject: rewardsObject,
				setSelectedReward: setSelectedReward,
				getRewardDetails: getRewardDetails,
                redeemOrderReward: redeemOrderReward,                
                setRedeemOfferConfirmationNumber: setRedeemOfferConfirmationNumber,
                data:{
				    selectedReward:{},
				    redeemOfferConfirmationNumber: {}				  
				}
		};

		return service;
	}

	lqModule.factory('rewardsService', rewardsService);
	rewardsService.$inject = ['$rootScope', '$q', 'osgiConfigService', 'lqEcommerceEndpoint', 'applicationState', 'userProfileService', 'rewardsAdminEndpoint'];
})();
	