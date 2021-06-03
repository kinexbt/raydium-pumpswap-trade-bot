Moralis.initialize(""); // Application id from moralis.io
Moralis.serverURL = ''; //Server url from moralis.io

const BASE_URL = "https://api.coingecko.com/api/v3";
const ETH_USD_PRICE_URL = "/simple/price?ids=ethereum&vs_currencies=usd";
const openMintTokenAddress = "";
const openMintMarketplaceAddress = "";
const paymentGatewayAddress = "";
let openMintTokenInstance;
let openMintMarketplaceInstance;
let paymentGatewayInstance;
let web3;
const user = Moralis.User.current();
const url_string = (window.location.href).toLowerCase();
let url = new URL(url_string);
let address = url.searchParams.get('address');

$(document).ready(async function(){
  web3 = await Moralis.Web3.enable();
  openMintTokenInstance = new web3.eth.Contract(abi.OpenMintToken, openMintTokenAddress);
  openMintMarketplaceInstance = new web3.eth.Contract(abi.OpenMintMarketplace, openMintMarketplaceAddress);
  paymentGatewayInstance = new web3.eth.Contract(abi.PaymentGateway, paymentGatewayAddress);
  ifAddressNotInDatabase(address);
  ethPrice = await getEthPrice();
  getActiveOwnedArt();
  getInactiveOwnedArt();
  getProfileDetails();
  twitterShareProfile();
  followBtn();
  sendTip();
  getMyBalance();
  withdrawBtn();
  getForSaleCount();
  getOwnsCount();
  getMintedCount();
  getLikedCount();
  getEncouragedCount();
  getFollowingCount();
  getFollowerCount();
});

async function ifAddressNotInDatabase(address){
  const params = { ethAddress: address };
  let isAddressIn = await Moralis.Cloud.run('isAddressInDatabase', params);
  if(!isAddressIn){
    $('.profileGenerated').html(`<p id="notYetConnectedText">This address has not yet connected their wallet to Open<span class="gradient-text">Mint<span></>`);
  }
};

async function getForSaleCount(){
  let ifOfferDetails = await Moralis.Cloud.run("getOfferDetails");
  let ifOfferDetailsDuplicatesRemoved = removeDuplicates(ifOfferDetails, it => it.tokenId);
  const count = ifOfferDetailsDuplicatesRemoved.filter(item => item.owner.toLowerCase() == address.toLowerCase() && !item.isSold && item.active).length;
  $('#forSaleCount').html(count);
  return count;
};

async function getOwnsCount(){
  let artwork = await Moralis.Cloud.run('getArtwork');
  const count = artwork.filter(item => item.currentOwner.toLowerCase() == address.toLowerCase()).length;
  $('#ownsCount').html(count);
  if(count == 0){
    $('.cardDivs').html(`<div class="list-group"><span class="sub-text mt-5">No artwork currently owned</span></div>`);
  }
  return count;
};

async function getMintedCount(){
  let artwork = await Moralis.Cloud.run('getArtwork');
  const count = artwork.filter(item => item.creator.toLowerCase() == address.toLowerCase()).length;
  $('#mintedCount').html(count);
  return count;

};

async function getLikedCount(){
  let artwork = await Moralis.Cloud.run('getArtwork');
  const count = artwork.filter(item => item.likers && item.likers.includes(address)).length;
  $('#likedCount').html(count);
  return count;

};

async function getEncouragedCount(){
  let artwork = await Moralis.Cloud.run('getArtwork');
  const count = artwork.filter(item => item.encouragers && item.encouragers.includes(address)).length;
  $('#encouragedCount').html(count);
  return count;

};

async function getFollowingCount(){
  const params = {ethAddress: address}
  let following = await Moralis.Cloud.run('getFollowing', params);
  if(following == undefined){
    $('#followingCount').html(0);
  } else{
    let followingCount = following.length;
    $('#followingCount').html(followingCount);
  }
};

async function getFollowerCount(){
  const params = {ethAddress: address}
  let followers = await Moralis.Cloud.run('getFollowers', params);
  if(followers == undefined){
    $('#followerCount').html(0);
  } else{
    let followerCount = followers.length;
    $('#followerCount').html(followerCount);
  }
};

//button in connect modal
$('#connectWalletModalBtn').click(async () =>{
  $('#connectWalletModalBtn').prop('disabled', true);
  $('#connectWalletModalBtn').html(`Connecting Wallet <div class="spinner-border spinner-border-sm text-light" role="status">
                                                        <span class="sr-only">Loading...</span>
                                                      </div>`);
  //this is the one in the nav
  $('#connectWalletBtn').html(`Connecting Wallet <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                  <span class="sr-only">Loading...</span>`);
  try{
    let currentUser = await Moralis.Web3.authenticate();
    if(currentUser){
      location.reload();
    }
  } catch (error) {
    alert(error.message);
    console.log(error);
    $('#connectWalletModalBtn').prop('disabled', false);
    $('#connectWalletModalBtn').html('Connect Wallet');
    $('#connectWalletBtn').html('Connect Wallet');
  }
});

async function getEthPrice(){
  let ethPrice = BASE_URL + ETH_USD_PRICE_URL;
  const response = await fetch(ethPrice);
  const data = await response.json();
  let usdEthPrice = data.ethereum.usd;
  return Number(usdEthPrice);
};

function displayProfilePhotoAndBadge(profilePhoto, amountSold){
  if(profilePhoto){
    addSellerBadgeProfile(amountSold);
  $('#profilePhoto').attr('src', profilePhoto._url);
    dismissLoadingPulseOnProfilePhoto(profilePhoto._url);
    console.log('user inputted new profile photo')
  } else {
    addSellerBadgeProfile(amountSold);
    $('#profilePhoto').attr('src', './assets/images-icons/default.png');
    let profilePhoto = './assets/images-icons/default.png';
    dismissLoadingPulseOnProfilePhoto(profilePhoto);
    console.log('default photo')
  }
};

function dismissLoadingPulseOnProfilePhoto(profilePhoto){
  let img = new Image;
  img.src = profilePhoto;
  img.onload = function(){
    $('#profilePhoto').css('display', 'inline');
    $('#sellerRank').css('display', 'inline');
    $('#spinnerGrowProfilePhoto').css('display', 'none');
    console.log('profilePhoto succesfully loaded!')
  };
  img.onerror = function(){
    $('#profilePhoto').css('display', 'inline');
    $('#sellerRank').css('display', 'inline');
    $('#spinnerGrowProfilePhoto').css('display', 'none');
    $('#profilePhoto').attr('src', './assets/images-icons/cantFindProfilePhoto.png');
    console.log('No network connection or profilephoto is not available.')
  };
};

function addSellerBadgeProfile(amountSold){
  if (amountSold == undefined){
    $('#sellerRank').attr('src', './assets/images-icons/noSales.png');
  } else if(amountSold >= 1 && amountSold <= 4){
    $('#sellerRank').attr('src', './assets/images-icons/oneSale.png');
  } else if(amountSold >= 5 && amountSold <= 9){
    $('#sellerRank').attr('src', './assets/images-icons/fiveSales.png');
  } else if(amountSold >= 10 && amountSold <= 19){
    $('#sellerRank').attr('src', './assets/images-icons/tenSales.png');
  } else if(amountSold >= 20 && amountSold <= 34){
    $('#sellerRank').attr('src', './assets/images-icons/twentySales.png');
  } else if(amountSold >= 35 && amountSold <= 49){
    $('#sellerRank').attr('src', './assets/images-icons/thirtyfiveSales.png');
  } else if(amountSold >= 50 && amountSold <= 74){
    $('#sellerRank').attr('src', './assets/images-icons/fiftySales.png');
  } else if(amountSold >= 75 && amountSold <= 99){
    $('#sellerRank').attr('src', './assets/images-icons/seventyfiveSales.png');
  } else if(amountSold >= 100){
    $('#sellerRank').attr('src', './assets/images-icons/hundredPlusSales.png');
  }
};

function displayUsername(username){
  $('#username').html(username);
};

function displayEthAddress(ethAddress){
  let abbreivatedAddress = truncateString(ethAddress);
  $('#truncatedEthAddress').html(abbreivatedAddress);

  $('#copySpan').html(`<button class="btn" type="button" id="copyAddressBtn" data-clipboard-text="`+ethAddress+`">
                          <img class='icon' src="./assets/images-icons/clipboard.png">
                        </button>`)
  clipboardButton();
};

function truncateString(str) {
  let lastChar = str.length;
  return str.slice(0, 9) + '...' + str.slice((lastChar - 5), lastChar);
};

function clipboardButton(){
  let clipboard = new ClipboardJS('#copyAddressBtn');

  clipboard.on('success', function (e) {
      $('#copyAddressBtn').html('✅');
      setTimeout("backToClipboardIcon()", 1500);
      console.log(e);
    });

    clipboard.on('error', function (e) {
      console.log(e);
    });
};

function backToClipboardIcon(){
  $('#copyAddressBtn').html(`<img class='icon' src="./assets/images-icons/clipboard.png">`);
};

function displayBio(bio){
  if(bio){
    $('#bio').html(bio);
  } else{
    $('#bio').css('display', 'none');
  }
};

function displayTwitter(twitter){
  if(twitter){
    $('.social-media-tags').css('display', 'block');
    $('#twitter').css('display', 'inline');
    $('#twitter').attr('href', 'https://twitter.com/'+twitter);
    $('#twitterHandle').html(twitter);
  } else {
    $('#twitter').css('display', 'none');
  }
};

function displayInstagram(instagram){
  if(instagram){
    $('.social-media-tags').css('display', 'block');
    $('#instagram').css('display', 'inline');
    $('#instagram').attr('href', 'https://www.instagram.com/' +instagram);
    $('#instagramHandle').html(instagram);
  } else {
    $('#instagram').css('display', 'none');
  }
};

function twitterShareProfile(){
  let left = screen.width / 3;
  let top = screen.height / 3;
  let width = screen.width / 3;
  let height = screen.height / 3;
  let page = window.location.href;
  let tweet = `https://twitter.com/intent/tweet?text=Check%20out%20this%20artist%20on%20OpenMint!&hashtags=openmint%2Cbsc%2Cnonfungible%2Cdigitalasset%2Cnft&via=openmint&url=${page}`;
  $('#twitterShare').click(()=>{
    window.open(tweet, 'popup', `width=${width},height=${height},top=${top},left=${left}`);
  });
};

function facebookShareProfile(username){
  //this will not work until site actually hosted
  let left = screen.width / 3;
  let top = screen.height / 3;
  let width = screen.width / 3;
  let height = screen.height / 3;
  let page = window.location.href;
  let post = `https://www.facebook.com/sharer/sharer.php?u=${page}%3F&quote=Check%20out%20${username}'s%20NFTs%20on%20OpenMint`;
  $('#facebookShare').click(()=>{
    window.open(post, 'popup', `width=${width},height=${height},top=${top},left=${left}`);
  });
};

function emailShareProfile(username){
  let page = window.location.href;
  $('#emailShare').click(()=>{
    window.location.href = `mailto:user@example.com?subject=${username}'s%20profile%20on%20OpenMint&body=Check%20out%20the%20artwork%20of%20${username}%20on%20OpenMint,%20${page}`;
  });
};

function followBtn(){
  if(user && user.attributes.ethAddress !== address){
    $('#followButton').css('display', 'block');
    doesUserFollow();
  } else {
    $('#followButton').css('display', 'none');
  }
};

async function doesUserFollow(){
  const params = {ethAddress: address};
  let doesFollow = await Moralis.Cloud.run('doesUserFollow', params);
  console.log(doesFollow);
  if(doesFollow){
    $('#followButton').html("Unfollow");
  } else{
    $('#followButton').html("Follow");
  }
};

$("#followButton").click(async() =>{
  const params = {
    followThisAddress: address
    };
  let follow = await Moralis.Cloud.run('follow', params);
  let followers = await Moralis.Cloud.run('followers', params);
  doesUserFollow();
  console.log(follow);
  console.log(followers);
});

function sendTip(){
  $('#tipButton').click(()=>{
    if(!user){
      $('#tipModalBody').html("Please connect wallet to send tip");
      $('#confirmTipBtn').css('display', 'none');
      $('#tipModal').modal('show');
    } else if(user.attributes.ethAddress.toLowerCase() == address.toLowerCase()){
      $('#tipModalBody').html("Cannot send a tip to yourself");
      $('#confirmTipBtn').css('display', 'none');
      $('#tipModal').modal('show');
    } else if(user.attributes.ethAddress.toLowerCase() !== address.toLowerCase()){
      $('#tipModal').modal('show');
      $('#tipToAddress').html(`to: ${address}`);
    }
  });
};

$('#tipInput').keyup(async() =>{
  let reg = /^\d{0,18}(\.\d{1,15})?$/;
  let tip = $('#tipInput').val();
  tip = tip.replace(/^0+/, '').replace(/\.?0+$/, '');
  let tipInUsd = (tip * ethPrice).toFixed(2);

  $('#tipAmountInEth').html(`${tip} ETH`);
  $('#tipAmountInUsd').html(`($${tipInUsd})`);

  if(tip !== '' && reg.test(tip)){
    $('#confirmTipBtn').prop('disabled', false);
    $('#tipRegexMessage').removeClass('text-danger');
    $('#tipRegexMessage').addClass('text-success');
    $('#tipRegexMessage').html('Valid tip');
  } else{
    $('#confirmTipBtn').prop('disabled', true);
    $('#tipRegexMessage').removeClass('text-success');
    $('#tipRegexMessage').addClass('text-danger');
    $('#tipRegexMessage').html('Invalid tip format');
  }
});


$('#tipModal').on('hidden.bs.modal', function (e) {
  $('#tipInput').val('');
  $('#tipRegexMessage').html('');
  $('#tipAmountInEth').html('0 ETH');
  $('#tipAmountInUsd').html('$(0.00)');

  $('#confirmTipBtn').prop('disabled', true);

  $('#tipStatus').html('');
});

$('#confirmTipBtn').click(()=>{
  let toAddress = address;
  let price = $('#tipInput').val();
  price = price.replace(/^0+|\.?0+$/, '');
  let tipInWei = web3.utils.toWei(price, 'ether');

  $('#tipStatus').html('');
  sendTipToContract(toAddress, tipInWei);
});

async function sendTipToContract(toAddress, tipInWei){
  $('#confirmTipBtn').prop('disabled', true);
  $('#confirmTipBtn').html(`Sending <div class="spinner-border spinner-border-sm text-light" role="status">
                                      <span class="sr-only">Loading...</span>
                                    </div>`)
  try {
    await paymentGatewayInstance.methods.sendPayment(toAddress).send({from: ethereum.selectedAddress, value: tipInWei});
    $('#tipStatus').removeClass('text-danger');
    $('#tipStatus').addClass('text-success');
    $('#tipStatus').html('Succesfully sent tip');
    $('#confirmTipBtn').html('Send Tip');
    $('#confirmTipBtn').prop('disabled', true);
  } catch (err){
    alert(err.message);
    $('#confirmTipBtn').prop('disabled', false);
    $('#tipStatus').removeClass('text-success');
    $('#tipStatus').addClass('text-danger');
    $('#tipStatus').html('Something went wrong');
    $('#confirmTipBtn').html('Send Tip');
  }
};

async function getMyBalance(){
  let myBalance = await paymentGatewayInstance.methods.balance().call({from: ethereum.selectedAddress});
  let priceInEth = web3.utils.fromWei(myBalance, 'ether');
  return priceInEth;
};

async function withdrawBtn(){
  if(!user || user.attributes.ethAddress.toLowerCase() !== address.toLowerCase()){
    $('#withdraw').css('display', 'none');
  } else{
    let profit = await getMyBalance();
    if(profit > 0){
      $('#withdraw').css('display', 'block');
      $('#amountToWithdraw').html(` ${profit} ETH`);
    } else{
      $('#withdraw').prop('disabled', true);
    }
  }
};

$("#withdraw").click(async function(){
  $('#withdrawModal').modal('show');
  let profit = await getMyBalance();
  $('#withdrawText').html(`Confirm to withdraw your profits of <span class="sale-profit">${profit} ETH</span>`);
});

$('#confirmBtn').click(async ()=>{
  let profit = await getMyBalance();
  if(user.attributes.ethAddress.toLowerCase() == address.toLowerCase() && profit > 0){
    $('#withdrawStatus').html('');
    withdrawProfits();
  }
});

async function withdrawProfits(){
  $('#confirmBtn').prop('disabled', true);
  $('#confirmBtn').html(`Confirming <div class="spinner-border spinner-border-sm text-light" role="status">
                                      <span class="sr-only">Loading...</span>
                                    </div>`)
  try {
    await paymentGatewayInstance.methods.withdraw().send({from: ethereum.selectedAddress});
    $('#withdrawStatus').removeClass('text-danger');
    $('#withdrawStatus').addClass('text-success');
    $('#withdrawStatus').html('Succesfully withdrawn');
    $('#confirmBtn').html('Confirm');
    $('#withdrawText').html(`Confirm to withdraw your profits of <span class="sale-profit">0 ETH</span>`);
    $('#withdraw').html('Withdraw');
    $('#withdraw').prop('disabled', true);
  } catch (err){
    alert(err.message);
    $('#confirmBtn').prop('disabled', false);
    $('#withdrawStatus').removeClass('text-success');
    $('#withdrawStatus').addClass('text-danger');
    $('#withdrawStatus').html('Something went wrong withdrawing');
    $('#confirmBtn').html('Confirm');
  }
};

$('#withdrawModal').on('hidden.bs.modal', function (e) {
  $('#withdrawStatus').html('');
});

function loader(){
  $('.cardDivs').html(`<div id='loader' class="spinner-border mt-5 text-primary" style="width: 3rem; height: 3rem;" role="status">
                        <span class="sr-only">Loading...</span>
                      </div>`);
};

$('#forSale').click(async()=>{
  $('.cardDivs').empty();
  loader();
  let count = await getForSaleCount();
  if(count == 0){
    $('.cardDivs').html(`<div class="list-group"><span class="sub-text mt-5">No artwork for sale currently</span></div>`);
  } else {
    getActiveOwnedArt();
  }
});

$('#owns').click(async()=>{
  $('.cardDivs').empty();
  loader();
  let count = await getOwnsCount();
  if(count == 0){
    $('.cardDivs').html(`<div class="list-group"><span class="sub-text mt-5">No artwork currently owned</span></div>`);
  } else {
    getActiveOwnedArt();
    getInactiveOwnedArt();
  }
});

$('#minted').click(async ()=>{
  $('.cardDivs').empty();
  loader();
  let count = await getMintedCount();
  if(count == 0){
    $('.cardDivs').html(`<div class="list-group"><span class="sub-text mt-5">No artwork minted yet</span></div>`);
  } else {
    getInactiveMintedArt();
    getActiveMintedArt();
  }
});

$('#liked').click(async ()=>{
  $('.cardDivs').empty();
  loader();
  let count = await getLikedCount();
  if(count == 0){
    $('.cardDivs').html(`<div class="list-group"><span class="sub-text mt-5">No artwork liked yet</span></div>`);
  } else {
    getActiveLikedArt();
    getInactiveLikedArt();
  }
});

$('#encouraged').click(async ()=>{
  $('.cardDivs').empty();
  loader();
  let count = await getEncouragedCount();
  if(count == 0){
    $('.cardDivs').html(`<div class="list-group"><span class="sub-text mt-5">No artwork encouraged currently</span></div>`);
  } else {
    getEncouragedArt();
  }
});

$('#following').click(()=>{
  $('.cardDivs').empty();
  loader();
  $('.cardDivs').append(`<div class="list-group"></div>`);
  getFollowing();
})

$('#followers').click(()=>{
  $('.cardDivs').empty();
  loader();
  $('.cardDivs').append(`<div class="list-group"></div>`);
  getFollowers();
});

async function getFollowers(){
  const params = {ethAddress: address};
  let followers = await Moralis.Cloud.run('getFollowers', params);
  console.log(followers);
  if(followers == undefined || followers.length == 0){
    $('#loader').css('display', 'none');
    $('.list-group').html(`<span class="sub-text mt-5">No followers currently</span>`);
  } else {
    for (i = 0; i < followers.length; i++) {
      let follower = followers[i];
      const params = {ethAddress: follower};
      let userInfo = await Moralis.Cloud.run('getUser', params);
      let username = userInfo.username;
      let ethAddress = userInfo.ethAddress;
      let userProfilePhoto;
      if(userInfo.profilePhoto){
        userProfilePhoto = userInfo.profilePhoto._url;
      } else {
        userProfilePhoto = './assets/images-icons/default.png';
      }
      let amountOfFollowers = userInfo.amountOfFollowers;
      let amountSold = userInfo.amountSold;

      $('#loader').css('display', 'none');
      userCard(ethAddress);
      $('#userPhoto' + ethAddress).attr('src', userProfilePhoto);
      $('#userPhoto' + ethAddress).css('display', 'none');
      $('#userRank' + ethAddress).css('display', 'none');
      addSellerBadgeUserCard(amountSold, ethAddress);
      dismissLoadingPulseUserCard(ethAddress, userProfilePhoto);
      $('#username' + ethAddress).html(username);
      $('#amountOfFollowers' + ethAddress).html(`${amountOfFollowers } followers`);
      dynamicFollowButton(ethAddress);
      doesUserFollowInCard(ethAddress);
      followButtonInCard(ethAddress);
      darkmodeForDynamicContent();
    };
  }
};

async function getFollowing(){
  const params = {ethAddress: address};
  let following = await Moralis.Cloud.run('getFollowing', params);
  console.log(following);
  if(following == undefined || following.length == 0){
    $('#loader').css('display', 'none');
    $('.list-group').html(`<span class="sub-text mt-5">Not following anyone currently</span>`);
  }else{
    for (i = 0; i < following.length; i++) {
      let followingUser = following[i];
      const params = {ethAddress: followingUser};
      let userInfo = await Moralis.Cloud.run('getUser', params);

      let username = userInfo.username;
      let ethAddress = userInfo.ethAddress;
      let userProfilePhoto;
      if(userInfo.profilePhoto){
        userProfilePhoto = userInfo.profilePhoto._url;
      } else {
        userProfilePhoto = './assets/images-icons/default.png';
      }
      let amountOfFollowers = userInfo.amountOfFollowers;
      let amountSold = userInfo.amountSold;

      $('#loader').css('display', 'none');
      userCard(ethAddress);
      $('#userPhoto' + ethAddress).attr('src', userProfilePhoto);
      $('#userPhoto' + ethAddress).css('display', 'none');
      $('#userRank' + ethAddress).css('display', 'none');
      addSellerBadgeUserCard(amountSold, ethAddress);
      dismissLoadingPulseUserCard(ethAddress, userProfilePhoto);
      $('#username' + ethAddress).html(username);
      $('#amountOfFollowers' + ethAddress).html(`${amountOfFollowers } followers`);
      dynamicFollowButton(ethAddress);
      doesUserFollowInCard(ethAddress);
      followButtonInCard(ethAddress);
      darkmodeForDynamicContent();
    };
  }
};

async function doesUserFollowInCard(ethAddress){
  if(user){
    const params = {ethAddress: ethAddress};
    let doesFollow = await Moralis.Cloud.run('doesUserFollow', params);
    if(doesFollow){
      $('#followButton' + ethAddress).html("Unfollow");
    } else{
      $('#followButton' + ethAddress).html("Follow");
    }
  }
};

function followButtonInCard(ethAddress){
  $("#followButton" + ethAddress).click(async() =>{
    const params = {
      followThisAddress: ethAddress
      };
    let follow = await Moralis.Cloud.run('follow', params);
    let followers = await Moralis.Cloud.run('followers', params);
    doesUserFollowInCard(ethAddress);
  });
};

async function dynamicFollowButton(ethAddress){
  if(user && user.attributes.ethAddress !== ethAddress){
    $('#followUser' + ethAddress).html(`<button type="button" class="btn btn-light shadow-sm button-styling" id="followButton${ethAddress}">Follow</button>`)
  }
};

function dismissLoadingPulseUserCard(ethAddress, userProfilePhoto){
  let img = new Image;
  img.src = userProfilePhoto;
  img.onload = function(){
    $('#userPhoto' + ethAddress).css('display', 'inline');
    $('#userRank' + ethAddress).css('display', 'block');
    $('#userSpinner' + ethAddress).css('display', 'none');
  };
  img.onerror = function(){
    $('#userPhoto' + ethAddress).css('display', 'inline');
    $('#userRank' + ethAddress).css('display', 'block');
    $('#userSpinner' + ethAddress).css('display', 'none');
    $('#userPhoto' + ethAddress).attr('src', './assets/images-icons/cantFindProfilePhoto.png');
    console.log('No network connection or pp is not available.')
  };
};

function addSellerBadgeUserCard(amountSold, ethAddress){
  if (amountSold == undefined){
    $('#userRank' + ethAddress).attr('src', './assets/images-icons/noSales.png');
  } else if(amountSold >= 1 && amountSold <= 4){
    $('#userRank' + ethAddress).attr('src', './assets/images-icons/oneSale.png');
  } else if(amountSold >= 5 && amountSold <= 9){
    $('#userRank' + ethAddress).attr('src', './assets/images-icons/fiveSales.png');
  } else if(amountSold >= 10 && amountSold <= 19){
    $('#userRank' + ethAddress).attr('src', './assets/images-icons/tenSales.png');
  } else if(amountSold >= 20 && amountSold <= 34){
    $('#userRank' + ethAddress).attr('src', './assets/images-icons/twentySales.png');
  } else if(amountSold >= 35 && amountSold <= 49){
    $('#userRank' + ethAddress).attr('src', './assets/images-icons/thirtyfiveSales.png');
  } else if(amountSold >= 50 && amountSold <= 74){
    $('#userRank' + ethAddress).attr('src', './assets/images-icons/fiftySales.png');
  } else if(amountSold >= 75 && amountSold <= 99){
    $('#userRank' + ethAddress).attr('src', './assets/images-icons/seventyfiveSales.png');
  } else if(amountSold >= 100){
    $('#userRank' + ethAddress).attr('src', './assets/images-icons/hundredPlusSales.png');
  }
};

function removeDuplicates(data, key){
  return [
    ...new Map(
        data.map(x => [key(x), x])
    ).values()
  ]
};

async function getActiveOwnedArt(){
  try{
    let ifOfferDetails = await Moralis.Cloud.run("getOfferDetails");
    let ifOfferDetailsLength = removeDuplicates(ifOfferDetails, it => it.tokenId).length;
    let ifOfferDetailsDuplicatesRemoved = removeDuplicates(ifOfferDetails, it => it.tokenId);

    for (i = 0; i < ifOfferDetailsLength; i++) {
      if(ifOfferDetailsDuplicatesRemoved[i].owner.toLowerCase() == address.toLowerCase() && ifOfferDetailsDuplicatesRemoved[i].active == true && ifOfferDetailsDuplicatesRemoved[i].isSold == false){
        let cover = ifOfferDetailsDuplicatesRemoved[i].cover._url;
        let name = ifOfferDetailsDuplicatesRemoved[i].name;
        let fileType = ifOfferDetailsDuplicatesRemoved[i].fileType;
        let likes = ifOfferDetailsDuplicatesRemoved[i].likes;
        let active = ifOfferDetailsDuplicatesRemoved[i].active;
        let tokenAddress = ifOfferDetailsDuplicatesRemoved[i].tokenAddress;
        let id = ifOfferDetailsDuplicatesRemoved[i].tokenId;
        let owner = ifOfferDetailsDuplicatesRemoved[i].owner;
        let price = ifOfferDetailsDuplicatesRemoved[i].price;
        let royalty = ifOfferDetailsDuplicatesRemoved[i].royalty;
        let creator = ifOfferDetailsDuplicatesRemoved[i].creator;
        let unlockableContent = ifOfferDetailsDuplicatesRemoved[i].unlockableContent;

        $('#loader').css('display', 'none');
        cardDiv(tokenAddress, id, owner);
        getOwnerPhoto(tokenAddress, id, owner);
        fileIcon(tokenAddress, id, fileType);
        likeButton(tokenAddress, id, likes);
        showHeartsFilled(tokenAddress, id);
        quickActions(tokenAddress, id, owner, active, royalty, creator);

        if(unlockableContent){
          $('#card'  + tokenAddress + id).addClass('unlockable-content-shadow');
        }

        $('#cover' + tokenAddress + id).attr('src', cover);
        $('#cover' + tokenAddress + id).css('display', 'none');
        dismissLoadingPulseOnCover(tokenAddress, id, cover);

        $('#name' + tokenAddress + id).html(name);

        let priceInEth = web3.utils.fromWei(price, 'ether');
        $('#forSale' + tokenAddress + id).html(`<span class="for-sale-text">${priceInEth} ETH</span>`);
        $('#button' + tokenAddress + id).html(`<a href="http://localhost:8000/token.html?token=`+tokenAddress+id+`"><button class="btn btn-primary buy-btn">Buy</button></a>`);
      }
      darkmodeForDynamicContent();
    }
  } catch (error){
    console.log(error)
  }
};

async function getInactiveOwnedArt(){
  try{
    let artwork = await Moralis.Cloud.run('getArtwork');
    for (i = 0; i < artwork.length; i++) {
      if(artwork[i].currentOwner.toLowerCase() == address.toLowerCase() && artwork[i].active == false){
        let cover = artwork[i].cover._url;
        let tokenAddress = artwork[i].tokenAddress;
        let id = artwork[i].tokenId;
        let name = artwork[i].name;
        let fileType = artwork[i].fileType;
        let active = artwork[i].active;
        let owner = artwork[i].currentOwner;
        let creator = artwork[i].creator;
        let royalty = artwork[i].royalty;
        let unlockableContent = artwork[i].unlockableContent;
        let likes = artwork[i].likes;
        let encouragements = artwork[i].encouragements;

        $('#loader').css('display', 'none');
        cardDiv(tokenAddress, id, owner);
        getOwnerPhoto(tokenAddress, id, owner);
        fileIcon(tokenAddress, id, fileType);
        likeButton(tokenAddress, id, likes);
        showHeartsFilled(tokenAddress, id);
        quickActions(tokenAddress, id, owner, active, royalty, creator);

        if(unlockableContent){
          $('#card'  + tokenAddress + id).addClass('unlockable-content-shadow');
        }

        $('#cover' + tokenAddress + id).attr('src', cover);
        $('#cover' + tokenAddress + id).css('display', 'none');
        dismissLoadingPulseOnCover(tokenAddress, id, cover);

        $('#name' + tokenAddress + id).html(name);
        $('#notForSale' + tokenAddress + id).html(`<button id="encourageBell`+tokenAddress+id+`" class="btn like-encourage-button fas fa-concierge-bell"><span class="like-encourage-text" id="encourageCounter`+tokenAddress+id+`"></span></button>`);
        $('#button' + tokenAddress + id).html(`<a href="http://localhost:8000/token.html?token=`+tokenAddress+id+`"><button class="btn btn-light view-btn">View</button></a>`);
        encourageButton(tokenAddress, id);
        showBellsFilled(tokenAddress, id);
        if(encouragements < 1 || encouragements == undefined){
          $('#encourageCounter' + tokenAddress + id).html(' Encourage To Sell');
        } else{
          $('#encourageCounter' + tokenAddress + id).html(` ${encouragements}`);
        }
        darkmodeForDynamicContent();
      }
    }
  } catch (error){
    console.log(error)
  }
};

async function getInactiveMintedArt(){
  try{
    let artwork = await Moralis.Cloud.run('getArtwork');
    console.log(artwork);
    for (i = 0; i < artwork.length; i++) {
      if(artwork[i].creator.toLowerCase() == address.toLowerCase() && artwork[i].active == false){
        let cover = artwork[i].cover._url;
        let tokenAddress = artwork[i].tokenAddress;
        let id = artwork[i].tokenId;
        let name = artwork[i].name;
        let fileType = artwork[i].fileType;
        let owner = artwork[i].currentOwner;
        let active = artwork[i].active;
        let creator = artwork[i].creator;
        let royalty = artwork[i].royalty;
        let unlockableContent = artwork[i].unlockableContent;
        let likes = artwork[i].likes;
        let encouragements = artwork[i].encouragements;

        $('#loader').css('display', 'none');
        cardDiv(tokenAddress, id, owner);
        getOwnerPhoto(tokenAddress, id, owner);
        fileIcon(tokenAddress, id, fileType);
        likeButton(tokenAddress, id, likes);
        showHeartsFilled(tokenAddress, id);
        quickActions(tokenAddress, id, owner, active, royalty, creator);

        if(unlockableContent){
          $('#card'  + tokenAddress + id).addClass('unlockable-content-shadow');
        }

        $('#cover' + tokenAddress + id).attr('src', cover);
        $('#cover' + tokenAddress + id).css('display', 'none');
        dismissLoadingPulseOnCover(tokenAddress, id, cover);

        $('#name' + tokenAddress + id).html(name);
        $('#notForSale' + tokenAddress + id).html(`<button id="encourageBell`+tokenAddress+id+`" class="btn like-encourage-button fas fa-concierge-bell"><span class="like-encourage-text" id="encourageCounter`+tokenAddress+id+`"></span></button>`);
        $('#button' + tokenAddress + id).html(`<a href="http://localhost:8000/token.html?token=`+tokenAddress+id+`"><button class="btn btn-light view-btn">View</button></a>`);
        encourageButton(tokenAddress, id);
        showBellsFilled(tokenAddress, id);
        if(encouragements < 1 || encouragements == undefined){
          $('#encourageCounter' + tokenAddress + id).html(' Encourage To Sell');
        } else{
          $('#encourageCounter' + tokenAddress + id).html(` ${encouragements}`);
        }
        darkmodeForDynamicContent();
      }
    }
  } catch (error){
    console.log(error)
  }
};


async function getActiveMintedArt(){
  try{
    let ifOfferDetails = await Moralis.Cloud.run("getOfferDetails");
    let ifOfferDetailsLength = removeDuplicates(ifOfferDetails, it => it.tokenId).length;
    let ifOfferDetailsDuplicatesRemoved = removeDuplicates(ifOfferDetails, it => it.tokenId);
    for (i = 0; i < ifOfferDetailsLength; i++) {
      if(ifOfferDetailsDuplicatesRemoved[i].creator.toLowerCase() == address.toLowerCase() && ifOfferDetailsDuplicatesRemoved[i].active == true && ifOfferDetailsDuplicatesRemoved[i].isSold == false){
        let cover = ifOfferDetailsDuplicatesRemoved[i].cover._url;
        let name = ifOfferDetailsDuplicatesRemoved[i].name;
        let fileType = ifOfferDetailsDuplicatesRemoved[i].fileType;
        let likes = ifOfferDetailsDuplicatesRemoved[i].likes;
        let active = ifOfferDetailsDuplicatesRemoved[i].active;
        let tokenAddress = ifOfferDetailsDuplicatesRemoved[i].tokenAddress;
        let id = ifOfferDetailsDuplicatesRemoved[i].tokenId;
        let owner = ifOfferDetailsDuplicatesRemoved[i].owner;
        let price = ifOfferDetailsDuplicatesRemoved[i].price;
        let creator = ifOfferDetailsDuplicatesRemoved[i].creator;
        let royalty = ifOfferDetailsDuplicatesRemoved[i].royalty;
        let unlockableContent = ifOfferDetailsDuplicatesRemoved[i].unlockableContent;

        $('#loader').css('display', 'none');
        cardDiv(tokenAddress, id, owner);
        getOwnerPhoto(tokenAddress, id, owner);
        fileIcon(tokenAddress, id, fileType);
        likeButton(tokenAddress, id, likes);
        showHeartsFilled(tokenAddress, id);
        quickActions(tokenAddress, id, owner, active, royalty, creator);

        if(unlockableContent){
          $('#card'  + tokenAddress + id).addClass('unlockable-content-shadow');
        }

        $('#cover' + tokenAddress + id).attr('src', cover);
        $('#cover' + tokenAddress + id).css('display', 'none');
        dismissLoadingPulseOnCover(tokenAddress, id, cover);

        $('#name' + tokenAddress + id).html(name);

        let priceInEth = web3.utils.fromWei(price, 'ether');
        $('#forSale' + tokenAddress + id).html(`<span class="for-sale-text">${priceInEth} ETH</span>`);
        $('#button' + tokenAddress + id).html(`<a href="http://localhost:8000/token.html?token=`+tokenAddress+id+`"><button class="btn btn-primary buy-btn">Buy</button></a>`);
      }
      darkmodeForDynamicContent();
    }
  } catch (error){
    console.log(error)
  }
};

async function getActiveLikedArt(){
  try{
    let ifOfferDetails = await Moralis.Cloud.run("getOfferDetails");
    console.log(ifOfferDetails);
    let ifOfferDetailsLength = removeDuplicates(ifOfferDetails, it => it.tokenId).length;
    let ifOfferDetailsDuplicatesRemoved = removeDuplicates(ifOfferDetails, it => it.tokenId);
    for (i = 0; i < ifOfferDetailsLength; i++) {
      if(ifOfferDetailsDuplicatesRemoved[i].likers && ifOfferDetailsDuplicatesRemoved[i].likers.includes(address) && ifOfferDetailsDuplicatesRemoved[i].active == true && ifOfferDetailsDuplicatesRemoved[i].isSold == false){
        let cover = ifOfferDetailsDuplicatesRemoved[i].cover._url;
        let name = ifOfferDetailsDuplicatesRemoved[i].name;
        let fileType = ifOfferDetailsDuplicatesRemoved[i].fileType;
        let likes = ifOfferDetailsDuplicatesRemoved[i].likes;
        let active = ifOfferDetailsDuplicatesRemoved[i].active;
        let tokenAddress = ifOfferDetailsDuplicatesRemoved[i].tokenAddress;
        let id = ifOfferDetailsDuplicatesRemoved[i].tokenId;
        let owner = ifOfferDetailsDuplicatesRemoved[i].owner;
        let price = ifOfferDetailsDuplicatesRemoved[i].price;
        let creator = ifOfferDetailsDuplicatesRemoved[i].creator;
        let royalty = ifOfferDetailsDuplicatesRemoved[i].royalty;
        let unlockableContent = ifOfferDetailsDuplicatesRemoved[i].unlockableContent;

        $('#loader').css('display', 'none');
        cardDiv(tokenAddress, id, owner);
        getOwnerPhoto(tokenAddress, id, owner);
        fileIcon(tokenAddress, id, fileType);
        likeButton(tokenAddress, id, likes);
        showHeartsFilled(tokenAddress, id);
        quickActions(tokenAddress, id, owner, active, royalty, creator);

        if(unlockableContent){
          $('#card'  + tokenAddress + id).addClass('unlockable-content-shadow');
        }

        $('#cover' + tokenAddress + id).attr('src', cover);
        $('#cover' + tokenAddress + id).css('display', 'none');
        dismissLoadingPulseOnCover(tokenAddress, id, cover);

        $('#name' + tokenAddress + id).html(name);

        let priceInEth = web3.utils.fromWei(price, 'ether');
        $('#forSale' + tokenAddress + id).html(`<span class="for-sale-text">${priceInEth} ETH</span>`);
        $('#button' + tokenAddress + id).html(`<a href="http://localhost:8000/token.html?token=`+tokenAddress+id+`"><button class="btn btn-primary buy-btn">Buy</button></a>`);
      }
      darkmodeForDynamicContent();
    }
  } catch (error){
    console.log(error)
  }
};

async function getInactiveLikedArt(){
  try{
    let artwork = await Moralis.Cloud.run('getArtwork');
    console.log(artwork);
    for (i = 0; i < artwork.length; i++) {
      if(artwork[i].likers && artwork[i].likers.includes(address) && artwork[i].active == false){
        let cover = artwork[i].cover._url;
        let tokenAddress = artwork[i].tokenAddress;
        let id = artwork[i].tokenId;
        let name = artwork[i].name;
        let fileType = artwork[i].fileType;
        let owner = artwork[i].currentOwner;
        let active = artwork[i].active;
        let creator = artwork[i].creator;
        let royalty = artwork[i].royalty;
        let unlockableContent = artwork[i].unlockableContent;
        let likes = artwork[i].likes;
        let encouragements = artwork[i].encouragements;

        $('#loader').css('display', 'none');
        cardDiv(tokenAddress, id, owner);
        getOwnerPhoto(tokenAddress, id, owner);
        fileIcon(tokenAddress, id, fileType);
        likeButton(tokenAddress, id, likes);
        showHeartsFilled(tokenAddress, id);
        quickActions(tokenAddress, id, owner, active, royalty, creator);

        if(unlockableContent){
          $('#card'  + tokenAddress + id).addClass('unlockable-content-shadow');
        }

        $('#cover' + tokenAddress + id).attr('src', cover);
        $('#cover' + tokenAddress + id).css('display', 'none');
        dismissLoadingPulseOnCover(tokenAddress, id, cover);

        $('#name' + tokenAddress + id).html(name);
        $('#notForSale' + tokenAddress + id).html(`<button id="encourageBell`+tokenAddress+id+`" class="btn like-encourage-button fas fa-concierge-bell"><span class="like-encourage-text" id="encourageCounter`+tokenAddress+id+`"></span></button>`);
        $('#button' + tokenAddress + id).html(`<a href="http://localhost:8000/token.html?token=`+tokenAddress+id+`"><button class="btn btn-light view-btn">View</button></a>`);
        encourageButton(tokenAddress, id);
        showBellsFilled(tokenAddress, id);
        if(encouragements < 1 || encouragements == undefined){
          $('#encourageCounter' + tokenAddress + id).html(' Encourage To Sell');
        } else{
          $('#encourageCounter' + tokenAddress + id).html(` ${encouragements}`);
        }
        darkmodeForDynamicContent();
      }
    }
  } catch (error){
    console.log(error)
  }
};

async function getEncouragedArt(){
  try{
    let artwork = await Moralis.Cloud.run('getArtwork');
    console.log(artwork);
    for (i = 0; i < artwork.length; i++) {
      if(artwork[i].encouragers && artwork[i].encouragers.includes(address)){
        let cover = artwork[i].cover._url;
        let tokenAddress = artwork[i].tokenAddress;
        let id = artwork[i].tokenId;
        let name = artwork[i].name;
        let fileType = artwork[i].fileType;
        let owner = artwork[i].currentOwner;
        let active = artwork[i].active;
        let creator = artwork[i].creator;
        let royalty = artwork[i].royalty;
        let unlockableContent = artwork[i].unlockableContent;
        let likes = artwork[i].likes;
        let encouragements = artwork[i].encouragements;

        $('#loader').css('display', 'none');
        cardDiv(tokenAddress, id, owner);
        getOwnerPhoto(tokenAddress, id, owner);
        fileIcon(tokenAddress, id, fileType);
        likeButton(tokenAddress, id, likes);
        showHeartsFilled(tokenAddress, id);
        quickActions(tokenAddress, id, owner, active, royalty, creator);

        if(unlockableContent){
          $('#card'  + tokenAddress + id).addClass('unlockable-content-shadow');
        }

        $('#cover' + tokenAddress + id).attr('src', cover);
        $('#cover' + tokenAddress + id).css('display', 'none');
        dismissLoadingPulseOnCover(tokenAddress, id, cover);

        $('#name' + tokenAddress + id).html(name);
        $('#notForSale' + tokenAddress + id).html(`<button id="encourageBell`+tokenAddress+id+`" class="btn like-encourage-button fas fa-concierge-bell"><span class="like-encourage-text" id="encourageCounter`+tokenAddress+id+`"></span></button>`);
        $('#button' + tokenAddress + id).html(`<a href="http://localhost:8000/token.html?token=`+tokenAddress+id+`"><button class="btn btn-light view-btn">View</button></a>`);
        encourageButton(tokenAddress, id);
        showBellsFilled(tokenAddress, id);
        if(encouragements < 1 || encouragements == undefined){
          $('#encourageCounter' + tokenAddress + id).html(' Encourage To Sell');
        } else{
          $('#encourageCounter' + tokenAddress + id).html(` ${encouragements}`);
        }
        darkmodeForDynamicContent();
      }
    }
  } catch (error){
    console.log(error)
  }
};

async function showBellsFilled(tokenAddress, id){
  if(user){
    const params = {
      tokenAddress: tokenAddress,
      tokenId: id
      };
    let likeQuery = await Moralis.Cloud.run('userEncouragedThisArtwork', params);
    if(likeQuery){
      $('#encourageBell' + tokenAddress + id).css('color', '#fac418');
    } else{
      $('#encourageBell' + tokenAddress + id).css('color', '#aaa');
    }
  }
};

function encourageButton(tokenAddress, id){
  $('#encourageBell' + tokenAddress + id).click(async ()=>{
    if(user){
      $('#encourageBell' + tokenAddress + id).prop('disabled', true);
      const params = {
        tokenAddress: tokenAddress,
        tokenId: id
        };
      let encourage = await Moralis.Cloud.run('encourage', params);
      if(encourage == 0){
        $('#encourageBell' + tokenAddress + id).prop('disabled', false);
        $('#encourageCounter' + tokenAddress + id).html(' Encourage To Sell');
      }else{
        $('#encourageBell' + tokenAddress + id).prop('disabled', false);
        $('#encourageCounter' + tokenAddress + id).html(` ${encourage}`);
      }
      let encourageQuery = await Moralis.Cloud.run('userEncouragedThisArtwork', params);
      if(encourageQuery){
        $('#encourageBell' + tokenAddress + id).css('color', '#fac418');
      } else{
        $('#encourageBell' + tokenAddress + id).css('color', '#aaa');
      }
    } else{
      $('#ifWalletNotConnectedModal').modal('show');
    }
  });
};

function likeButton(tokenAddress, id, likes){
  if(likes > 0){
    $('#likeCounter' + tokenAddress + id).html(likes);
  }
  $('#like' + tokenAddress + id).click(async ()=>{
    if(user){
      $('#like' + tokenAddress + id).prop('disabled', true);
      const params = {
        tokenAddress: tokenAddress,
        tokenId: id
        };
      let like = await Moralis.Cloud.run('like', params);
      if(like || !like){
        $('#like' + tokenAddress + id).prop('disabled', false);
        $('#likeCounter' + tokenAddress + id).html(like);
      }

      let likeQuery = await Moralis.Cloud.run('userLikesThisArtwork', params);
      if(likeQuery){
        $('#like' + tokenAddress + id).removeClass('far');
        $('#like' + tokenAddress + id).addClass('fas');
      } else{
        $('#like' + tokenAddress + id).removeClass('fas');
        $('#like' + tokenAddress + id).addClass('far');
      }
    } else{
      $('#ifWalletNotConnectedModal').modal('show');
    }
  });
};

async function showHeartsFilled(tokenAddress, id){
  if(user){
    const params = {
      tokenAddress: tokenAddress,
      tokenId: id
      };
    let likeQuery = await Moralis.Cloud.run('userLikesThisArtwork', params);
    if(likeQuery){
      $('#like' + tokenAddress + id).removeClass('far');
      $('#like' + tokenAddress + id).addClass('fas');
    } else{
      $('#like' + tokenAddress + id).removeClass('fas');
      $('#like' + tokenAddress + id).addClass('far');
    }
  }
};

function dismissLoadingPulseOnCover(tokenAddress, id, cover){
  let img = new Image;
  img.src = cover;
  img.onload = function(){
    $('#cover' + tokenAddress + id).css('display', 'block');
    $('#coverSpinner' + tokenAddress + id).css('display', 'none');
    console.log('cover succesfully loaded!')
  };
  img.onerror = function(){
    $('#cover' + tokenAddress + id).css('display', 'block');
    $('#coverSpinner' + tokenAddress + id).css('display', 'none');
    $('#cover' + tokenAddress + id).attr('src', './assets/images-icons/cantFindNFT.png');
    console.log('No network connection or NFT is not available.')
  };
};

async function getOwnerPhoto(tokenAddress, id, owner){
  $('#ownerPhoto' + tokenAddress + id).css('display', 'none');
  $('#ownerRank' + tokenAddress + id).css('display', 'none');
  ifOwnerNotInDatabase(tokenAddress, id, owner);
  try{
    let users = await Moralis.Cloud.run('getAllUsers');
    for (i = 0; i < users.length; i++) {
      let profilePhoto = users[i].profilePhoto;
      let username = users[i].username;
      let ethAddress = users[i].ethAddress;
      let amountSold = users[i].amountSold;

      if(ethAddress == owner && profilePhoto){
        addSellerBadge(tokenAddress, id, amountSold);
        $('#ownerPhoto' + tokenAddress + id).attr('src', profilePhoto._url);
        dismissLoadingPulseOnOwnerPhoto(tokenAddress, id, profilePhoto._url);
      } else if (ethAddress == owner && !profilePhoto){
        addSellerBadge(tokenAddress, id, amountSold);
        $('#ownerPhoto' + tokenAddress + id).attr('src', './assets/images-icons/default.png');
        let defaultProfilePhoto = "./assets/images-icons/default.png"
        dismissLoadingPulseOnOwnerPhoto(tokenAddress, id, defaultProfilePhoto);
      }
    }
  } catch(err){
    console.log(err);
  }
};

function dismissLoadingPulseOnOwnerPhoto(tokenAddress, id, profilePhoto){
  let img = new Image;
  img.src = profilePhoto;
  img.onload = function(){
    $('#ownerPhoto' + tokenAddress + id).css('display', 'inline');
    $('#ownerRank' + tokenAddress + id).css('display', 'block');
    $('#cardOwnerPhotoSpinner' + tokenAddress + id).css('display', 'none');
  };
  img.onerror = function(){
    $('#ownerPhoto' + tokenAddress + id).css('display', 'inline');
    $('#ownerRank' + tokenAddress + id).css('display', 'block');
    $('#ownerPhoto' + tokenAddress + id).attr('src', './assets/images-icons/cantFindProfilePhoto.png');
    console.log('No network connection or profilephoto is not available.')
  };
};

function addSellerBadge(tokenAddress, id, amountSold){
  if (amountSold == undefined){
    $('#ownerRank' + tokenAddress + id).attr('src', './assets/images-icons/noSales.png');
  } else if(amountSold >= 1 && amountSold <= 4){
    $('#ownerRank' + tokenAddress + id).attr('src', './assets/images-icons/oneSale.png');
  } else if(amountSold >= 5 && amountSold <= 9){
    $('#ownerRank' + tokenAddress + id).attr('src', './assets/images-icons/fiveSales.png');
  } else if(amountSold >= 10 && amountSold <= 19){
    $('#ownerRank' + tokenAddress + id).attr('src', './assets/images-icons/tenSales.png');
  } else if(amountSold >= 20 && amountSold <= 34){
    $('#ownerRank' + tokenAddress + id).attr('src', './assets/images-icons/twentySales.png');
  } else if(amountSold >= 35 && amountSold <= 49){
    $('#ownerRank' + tokenAddress + id).attr('src', './assets/images-icons/thirtyfiveSales.png');
  } else if(amountSold >= 50 && amountSold <= 74){
    $('#ownerRank' + tokenAddress + id).attr('src', './assets/images-icons/fiftySales.png');
  } else if(amountSold >= 75 && amountSold <= 99){
    $('#ownerRank' + tokenAddress + id).attr('src', './assets/images-icons/seventyfiveSales.png');
  } else if(amountSold >= 100){
    $('#ownerRank' + tokenAddress + id).attr('src', './assets/images-icons/hundredPlusSales.png');
  }
};

async function getProfileDetails(){
  try{
    let userDetails = await Moralis.Cloud.run('getAllUsers');
    for (i = 0; i < userDetails.length; i++) {
      if(userDetails[i].ethAddress.toLowerCase() == address.toLowerCase()){
        let profilePhoto = userDetails[i].profilePhoto;
        let username = userDetails[i].username;
        let ethAddress = userDetails[i].ethAddress;
        let bio = userDetails[i].bio;
        let twitter = userDetails[i].twitter;
        let instagram = userDetails[i].instagram;
        let amountSold = userDetails[i].amountSold;
        displayProfilePhotoAndBadge(profilePhoto, amountSold);//TypeError if variable and function name are the same
        displayUsername(username);
        displayEthAddress(ethAddress);
        displayBio(bio);
        displayTwitter(twitter);
        displayInstagram(instagram);
        emailShareProfile(username);
        facebookShareProfile(username);
      }
    }
  } catch(err){
    console.log(err);
  }
};

function fileIcon(tokenAddress, id, fileType){
  if(fileType == 'image/png' || fileType == 'image/jpeg' || fileType == 'image/gif' || fileType == 'image/webp'){
    $('#fileIcon' + tokenAddress + id).attr('src', '');
  } else if (fileType == "video/mp4" || fileType == "video/webm") {
    $('#fileIcon' + tokenAddress + id).attr('src', 'assets/images-icons/videoIcon.png');
  } else if (fileType == "audio/mp3" || fileType == "audio/webm" || fileType == "audio/mpeg"){
    $('#fileIcon' + tokenAddress  + id).attr('src', 'assets/images-icons/audioIcon.png');
  }
};

async function ifOwnerNotInDatabase(tokenAddress, id, owner){
  const params = { ethAddress: owner };
  let isAddressIn = await Moralis.Cloud.run('isAddressInDatabase', params);
  if(!isAddressIn){
    let amountSold = undefined;
    addSellerBadge(tokenAddress, id, amountSold);
    $('#ownerPhoto' + tokenAddress + id).attr('src', './assets/images-icons/unknown.png');
    let unknownProfilePhoto = "./assets/images-icons/unknown.png"
    dismissLoadingPulseOnOwnerPhoto(tokenAddress, id, unknownProfilePhoto);
  }
};

function quickActions(tokenAddress, id, owner, active, royalty, creator){
  if(user == null || user.attributes.ethAddress.toLowerCase() !== owner.toLowerCase()){
    $('#quickActions' + tokenAddress + id).html(`<a class="dropdown-item quick-action" id="shareQuickAction`+tokenAddress+id+`" data-toggle="modal" data-target="#shareModal`+tokenAddress+id+`">Share</a>`);
  } else if(user.attributes.ethAddress.toLowerCase() == owner.toLowerCase() && active == true){
    $('#quickActions' + tokenAddress + id).html(` <a class="dropdown-item quick-action" id="changePriceQuickAction`+tokenAddress+id+`" data-toggle="modal" data-target="#changePriceModal`+tokenAddress+id+`">Change price</a>
                                                  <a class="dropdown-item quick-action" id="removeFromSaleQuickAction`+tokenAddress+id+`" data-toggle="modal" data-target="#removeFromSaleModal`+tokenAddress+id+`">Remove from sale</a>
                                                  <a class="dropdown-item quick-action" id="shareQuickAction`+tokenAddress+id+`" data-toggle="modal" data-target="#shareModal`+tokenAddress+id+`">Share</a>`
                                                );
  } else if(user.attributes.ethAddress.toLowerCase() == owner.toLowerCase() && active == false){
    $('#quickActions' + tokenAddress + id).html(` <a class="dropdown-item quick-action" id="putForSaleQuickAction`+tokenAddress+id+`" data-toggle="modal" data-target="#putForSaleModal`+tokenAddress+id+`">Put for sale</a>
                                                  <a class="dropdown-item quick-action" id="transferTokenQuickAction`+tokenAddress+id+`" data-toggle="modal" data-target="#transferTokenModal`+tokenAddress+id+`">Transfer token</a>
                                                  <a class="dropdown-item quick-action" id="shareQuickAction`+tokenAddress+id+`" data-toggle="modal" data-target="#shareModal`+tokenAddress+id+`">Share</a>`
                                                );
  }
  shareQuickActionButton(tokenAddress, id);
  putForSaleQuickActionButton(tokenAddress, id, royalty, creator);
  removeFromSaleQuickActionButton(tokenAddress, id, royalty, creator);
  changePriceQuickActionButton(tokenAddress, id, royalty, creator);
  transferTokenQuickActionButton(tokenAddress, id);
  darkmodeForDynamicContent();
};

function shareQuickActionButton(tokenAddress, id){
  $("#shareQuickAction" + tokenAddress + id).click(()=>{
    shareModalHTML(tokenAddress, id);
    shareOptions(tokenAddress, id);

    onModalClose(tokenAddress, id);
    darkmodeForDynamicContent();
  });
};

function putForSaleQuickActionButton(tokenAddress, id, royalty, creator){
  $('#putForSaleQuickAction' + tokenAddress + id).click(() =>{
    putForSaleModalHTML(tokenAddress, id);
    if(creator == user.attributes.ethAddress){
      $('#ifOwnerNotCreator' + tokenAddress + id).css('display', 'none');
    } else{
      $('#ifOwnerNotCreator' + tokenAddress + id).css('display', 'block');
      $('#royalty' + tokenAddress + id).html(`${royalty}%`);
    }

    checkForApprovalBeforePuttingOnSale(tokenAddress, id);
    setApprovalIfNeeded(tokenAddress, id);
    putOnSale(tokenAddress, id, royalty, creator);
    putForSaleInput(tokenAddress, id, royalty, creator);

    onModalClose(tokenAddress, id);
    darkmodeForDynamicContent();
  });
};

function removeFromSaleQuickActionButton(tokenAddress, id, royalty, creator){
  $('#removeFromSaleQuickAction' + tokenAddress + id).click(() =>{
    removeFromSaleModalHTML(tokenAddress, id);

    removeFromSale(tokenAddress, id, royalty, creator);

    onModalClose(tokenAddress, id);
    darkmodeForDynamicContent();
  });
};

function changePriceQuickActionButton(tokenAddress, id, royalty, creator){
  $('#changePriceQuickAction' + tokenAddress + id).click(() =>{
    changePriceModalHTML(tokenAddress, id);
    if(creator == user.attributes.ethAddress){
      $('#ifOwnerNotCreator' + tokenAddress + id).css('display', 'none');
    } else{
      $('#ifOwnerNotCreator' + tokenAddress + id).css('display', 'block');
      $('#royalty' + tokenAddress + id).html(`${royalty}%`);
    }

    changePriceFrontEnd(tokenAddress, id, royalty, creator);
    changePriceInput(tokenAddress, id, royalty, creator);

    onModalClose(tokenAddress, id);
    darkmodeForDynamicContent();
  });
};

function transferTokenQuickActionButton(tokenAddress, id){
  $('#transferTokenQuickAction' + tokenAddress + id).click(() =>{
    transferTokenModalHTML(tokenAddress, id);

    transferToken(tokenAddress, id);
    toAddressInput(tokenAddress, id);

    onModalClose(tokenAddress, id);
    darkmodeForDynamicContent();
  });
};

function shareOptions(tokenAddress, id){
  //obviously changing localhost to real url when hosted
  let left = screen.width / 3;
  let top = screen.height / 3;
  let width = screen.width / 3;
  let height = screen.height / 3;
  let tokenPage = `http://localhost:8000/token.html?token=${tokenAddress+id}`;
  let tweet = `https://twitter.com/intent/tweet?text=Check%20out%20this%20NFT%20on%20OpenMint!&hashtags=openmint%2Cbsc%2Cnonfungible%2Cdigitalasset%2Cnft&via=openmint&url=${tokenPage}`;
  let post = `https://www.facebook.com/sharer/sharer.php?u=${tokenPage}%3F&quote=Check%20out%20this%20NFT%20on%20OpenMint`;

  $('#twitterBtnInModal' + tokenAddress + id).click(()=>{
    window.open(tweet, 'popup', `width=${width},height=${height},top=${top},left=${left}`);
  });

  $('#facebookBtnInModal' + tokenAddress + id).click(()=>{
    window.open(post, 'popup', `width=${width},height=${height},top=${top},left=${left}`);
  });

  $('#emailBtnInModal' + tokenAddress + id).click(()=>{
    window.location.href = `mailto:user@example.com?subject=Check%20out%20this%20NFT%20on%20OpenMint&body=Never%20seen%20anything%20quite%20like%20this,%20${tokenPage}`;
  });
};

function onModalClose(tokenAddress, id){
  $('.modal').on('hidden.bs.modal', function (e) {
    $('.modals').empty();
    $('#changePriceInput' + tokenAddress + id).val('');
    $('#changePriceBtn' + tokenAddress + id).prop('disabled', true);
    $('#changePriceSaleProfit' + tokenAddress + id).html('0 ETH');
    $('#changePriceUSDProfit' + tokenAddress + id).html('$0.00');

    $('#salePriceInput' + tokenAddress + id).val('');
    $('#putOnSaleBtn' + tokenAddress + id).prop('disabled', true);
    $('#saleProfit' + tokenAddress + id).html('0 ETH');
    $('#usdProfit' + tokenAddress + id).html('$0.00');

    $('#toAddressInput' + tokenAddress + id).val('');
    $('#transferTokenBtn' + tokenAddress + id).prop('disabled', true);

    $('#removeFromSaleBtn' + tokenAddress + id).prop('disabled', true);
    $('#yesContinueBtn' + tokenAddress + id).prop('disabled', false);
  });
};

async function checkForApprovalBeforePuttingOnSale(tokenAddress, id){
  try{
    let approved = await openMintTokenInstance.methods.isApprovedForAll(user.attributes.ethAddress, openMintMarketplaceAddress).call();
    console.log("Approved: " + approved);

    if(!approved){
      $('#salePriceInput' + tokenAddress + id).prop('disabled', true);
      $('#setApprovalBtn' + tokenAddress + id).css('display', 'block');
    } else{
      $('#salePriceInput' + tokenAddress + id).prop('disabled', false);
      $('#setApprovalBtn' + tokenAddress + id).css('display', 'none');
    }
  } catch(err){
    alert(err.message);
  }
};

function setApprovalIfNeeded(tokenAddress, id){
  $('#setApprovalBtn' + tokenAddress + id).click(async() =>{
    $('#setApprovalBtn' + tokenAddress + id).prop('disabled', true);
    $('#setApprovalBtn' + tokenAddress + id).html(`Setting Approval <div class="spinner-border spinner-border-sm text-light" role="status">
                                                    <span class="sr-only">Loading...</span>
                                                  </div>`);
    await openMintTokenInstance.methods.setApprovalForAll(openMintMarketplaceAddress, true).send({from: user.attributes.ethAddress}, (err, txHash) => {
      if(err){
        alert(err.message);
        $('#setApprovalBtn' + tokenAddress + id).html("Set Approval To Sell");
        $('#setApprovalBtn' + tokenAddress + id).prop('disabled', false);
        $('#salePriceInput' + tokenAddress + id).prop('disabled', true);
      }else{
        console.log(txHash, "Approval Successfully Granted");
        $('#setApprovalBtn' + tokenAddress + id).prop('disabled', true);
        $('#setApprovalBtn' + tokenAddress + id).removeClass('btn-primary');
        $('#setApprovalBtn' + tokenAddress + id).addClass('btn-success');
        $('#setApprovalBtn' + tokenAddress + id).html('Approval Successfully Granted');
        $('#salePriceInput' + tokenAddress + id).prop('disabled', false);
      }
    });
  });
};

function putOnSale(tokenAddress, id, royalty, creator){
  $('#putOnSaleBtn' + tokenAddress + id).click(async()=>{
    let price = $('#salePriceInput' + tokenAddress + id).val();
    price = price.replace(/^0+/, '').replace(/\.?0+$/, '');
    const amountInWei = web3.utils.toWei(price, 'ether');

    $('#putOnSaleBtn' + tokenAddress + id).prop('disabled', true);
    $('#putOnSaleBtn' + tokenAddress + id).html(`Put For Sale <div class="spinner-border spinner-border-sm  text-light" role="status">
                                                    <span class="sr-only">Loading...</span>
                                                  </div>`);
    try{
      await openMintMarketplaceInstance.methods.setOffer(amountInWei, id, tokenAddress).send({from: user.attributes.ethAddress});
      $('#putOnSaleBtn' + tokenAddress + id).html('Successfully Put On Sale');
      $('#putOnSaleBtn' + tokenAddress + id).removeClass('btn-primary');
      $('#putOnSaleBtn' + tokenAddress + id).addClass('btn-success');

      $('#salePriceInput' + tokenAddress + id).prop('disabled', true);

      confetti({
        zIndex: 9999,
        particleCount: 200
      });

      $('#notForSale' + tokenAddress + id).css('display', 'none');

      $('#forSale' + tokenAddress + id).css('display', 'block');
      $('#forSale' + tokenAddress + id).html(`<span class="for-sale-text">${price} ETH</span>`);
      $('#button' + tokenAddress + id).html(`<a href="http://localhost:8000/token.html?token=`+tokenAddress+id+`"><button class="btn btn-primary buy-btn">Buy</button></a>`);

      $('#quickActions' + tokenAddress + id).html(` <a class="dropdown-item quick-action" id="changePriceQuickAction`+tokenAddress+id+`" data-toggle="modal" data-target="#changePriceModal`+tokenAddress+id+`">Change price</a>
                                                    <a class="dropdown-item quick-action" id="removeFromSaleQuickAction`+tokenAddress+id+`" data-toggle="modal" data-target="#removeFromSaleModal`+tokenAddress+id+`">Remove from sale</a>
                                                    <a class="dropdown-item quick-action" id="shareQuickAction`+tokenAddress+id+`" data-toggle="modal" data-target="#shareModal`+tokenAddress+id+`">Share</a>`
                                                  );
      changePriceQuickActionButton(tokenAddress, id, royalty, creator);
      removeFromSaleQuickActionButton(tokenAddress, id, royalty, creator);
      shareQuickActionButton(tokenAddress, id);
    } catch(err){
      alert(err.message);
      $('#putOnSaleBtn' + tokenAddress + id).prop('disabled', false);
      $('#putOnSaleBtn' + tokenAddress + id).html('Put On Sale');
      $('#salePriceInput' + tokenAddress + id).prop('disabled', false);
      $('.modal').modal('hide');
    }
  });
};

function putForSaleInput(tokenAddress, id, royalty, creator){
  $('#salePriceInput' + tokenAddress + id).keyup(async() =>{
    let reg = new RegExp(/^\d{0,18}(\.\d{1,15})?$/);
    let price = $('#salePriceInput' + tokenAddress + id).val();
    price = price.replace(/^0+/, '').replace(/\.?0+$/, '');
    if(price !== '' && reg.test(price)){
      $('#putOnSaleBtn' + tokenAddress + id).prop('disabled', false);
    } else{
      $('#putOnSaleBtn' + tokenAddress + id).prop('disabled', true);
    }

    if(creator == user.attributes.ethAddress){
      let profit = price - (price * .02);
      $('#saleProfit' + tokenAddress + id).html(`${profit} ETH`);
      let usdProfit = (profit * ethPrice).toFixed(2);
      $('#usdProfit' + tokenAddress + id).html(`$${usdProfit}`);
    } else{
      let profit = price - (price * .02) - (price * (royalty/100));
      $('#saleProfit' + tokenAddress + id).html(`${profit} ETH`);
      let usdProfit = (profit * ethPrice).toFixed(2);
      $('#usdProfit' + tokenAddress + id).html(`$${usdProfit}`);
    }
  });
};

function removeFromSale(tokenAddress, id, royalty, creator){
  $('#yesContinueBtn' + tokenAddress + id).click(()=>{
    $('#removeFromSaleBtn' + tokenAddress + id).prop('disabled', false);
    $('#yesContinueBtn' + tokenAddress + id).prop('disabled', true);
  });

  $('#removeFromSaleBtn' + tokenAddress + id).click(async()=>{
    $('#removeFromSaleBtn' + tokenAddress + id).prop('disabled', true);
    $('#removeFromSaleBtn' + tokenAddress + id).html(`Remove From Sale <div class="spinner-border spinner-border-sm  text-light" role="status">
                                                        <span class="sr-only">Loading...</span>
                                                      </div>`);
    try{
      await openMintMarketplaceInstance.methods.removeOffer(id, tokenAddress).send({from: user.attributes.ethAddress});
      $('#removeFromSaleBtn' + tokenAddress + id).html('Successfully Removed');
      $('#removeFromSaleBtn' + tokenAddress + id).removeClass('btn-danger');
      $('#removeFromSaleBtn' + tokenAddress + id).addClass('btn-success');

      $('#forSale' + tokenAddress + id).css('display', 'none');

      $('#notForSale' + tokenAddress + id).css('display', 'block');
      $('#notForSale' + tokenAddress + id).html(`<button id="encourageBell`+tokenAddress+id+`" class="btn like-encourage-button fas fa-concierge-bell"><span class="like-encourage-text" id="encourageCounter`+tokenAddress+id+`"></span></button>`);
      $('#button' + tokenAddress + id).html(`<a href="http://localhost:8000/token.html?token=`+tokenAddress+id+`"><button class="btn btn-light view-btn">View</button></a>`);

      $('#quickActions' + tokenAddress + id).html(` <a class="dropdown-item quick-action" id="putForSaleQuickAction`+tokenAddress+id+`" data-toggle="modal" data-target="#putForSaleModal`+tokenAddress+id+`">Put for sale</a>
                                                    <a class="dropdown-item quick-action" id="transferTokenQuickAction`+tokenAddress+id+`" data-toggle="modal" data-target="#transferTokenModal`+tokenAddress+id+`">Transfer token</a>
                                                    <a class="dropdown-item quick-action" id="shareQuickAction`+tokenAddress+id+`" data-toggle="modal" data-target="#shareModal`+tokenAddress+id+`">Share</a>`
                                                  );
      putForSaleQuickActionButton(tokenAddress, id, royalty, creator);
      transferTokenQuickActionButton(tokenAddress, id);
      shareQuickActionButton(tokenAddress, id);
      encourageButton(tokenAddress, id);
      $('#encourageCounter' + tokenAddress + id).html(' Encourage To Sell');
    } catch(err){
      alert(err.message);
      $('#removeFromSaleBtn' + tokenAddress + id).prop('disabled', false);
      $('#removeFromSaleBtn' + tokenAddress + id).html('Remove From Sale');
      $('#yesContinueBtn' + tokenAddress + id).prop('disabled', false);
      $('.modal').modal('hide');
    }
  })
};

function changePriceFrontEnd(tokenAddress, id, royalty, creator){
  $('#changePriceBtn' + tokenAddress + id).click(async()=>{
    console.log(id);
    let price = $('#changePriceInput' + tokenAddress + id).val();
    price = price.replace(/^0+/, '').replace(/\.?0+$/, '');
    const amountInWei = web3.utils.toWei(price, 'ether');

    $('#changePriceBtn' + tokenAddress + id).prop('disabled', true);
    $('#changePriceBtn' + tokenAddress + id).html(`Change Price <div class="spinner-border spinner-border-sm text-light" role="status">
                                                    <span class="sr-only">Loading...</span>
                                                  </div>`);
    try{
      await openMintMarketplaceInstance.methods.changePrice(amountInWei, id, tokenAddress).send({from: user.attributes.ethAddress});
      $('#changePriceBtn' + tokenAddress + id).html('Successfully Changed Price');
      $('#changePriceBtn' + tokenAddress + id).removeClass('btn-primary');
      $('#changePriceBtn' + tokenAddress + id).addClass('btn-success');

      $('#changePriceInput' + tokenAddress + id).prop('disabled', true);

      $('#notForSale' + tokenAddress + id).css('display', 'none');

      $('#forSale' + tokenAddress + id).css('display', 'block');
      $('#forSale' + tokenAddress + id).html(`<span class="for-sale-text">${price} ETH</span>`);
      $('#button' + tokenAddress + id).html(`<a href="http://localhost:8000/token.html?token=`+tokenAddress+id+`"><button class="btn btn-primary buy-btn">Buy</button></a>`);

      $('#quickActions' + tokenAddress + id).html(` <a class="dropdown-item quick-action" id="changePriceQuickAction`+tokenAddress+id+`" data-toggle="modal" data-target="#changePriceModal`+tokenAddress+id+`">Change price</a>
                                                    <a class="dropdown-item quick-action" id="removeFromSaleQuickAction`+tokenAddress+id+`" data-toggle="modal" data-target="#removeFromSaleModal`+tokenAddress+id+`">Remove from sale</a>
                                                    <a class="dropdown-item quick-action" id="shareQuickAction`+tokenAddress+id+`" data-toggle="modal" data-target="#shareModal`+tokenAddress+id+`">Share</a>`
                                                  );
      changePriceQuickActionButton(tokenAddress, id, royalty, creator);
      removeFromSaleQuickActionButton(tokenAddress, id, royalty, creator);
      shareQuickActionButton(tokenAddress, id);
    } catch(err){
      alert(err.message);
      $('#changePriceBtn' + tokenAddress + id).prop('disabled', false);
      $('#changePriceBtn' + tokenAddress + id).html('Change Price');
      $('#changePriceInput' + tokenAddress + id).prop('disabled', false);
      $('.modal').modal('hide');
    }
  });
};

function changePriceInput(tokenAddress, id, royalty, creator){
  $('#changePriceInput' + tokenAddress + id).keyup(async() =>{
    let reg = new RegExp(/^\d{0,18}(\.\d{1,15})?$/);
    let price = $('#changePriceInput' + tokenAddress + id).val();
    price = price.replace(/^0+/, '').replace(/\.?0+$/, '');
    if(price !== '' && reg.test(price)){
      $('#changePriceBtn' + tokenAddress + id).prop('disabled', false);
    } else{
      $('#changePriceBtn' + tokenAddress + id).prop('disabled', true);
    }

    if(creator == user.attributes.ethAddress){
      let profit = price - (price * .02);
      $('#changePriceSaleProfit' + tokenAddress + id).html(`${profit} ETH`);
      let usdProfit = (profit * ethPrice).toFixed(2);
      $('#changePriceUSDProfit' + tokenAddress + id).html(`$${usdProfit}`);
    } else{
      let profit = price - (price * .02) - (price * (royalty/100));
      $('#changePriceSaleProfit' + tokenAddress + id).html(`${profit} ETH`);
      let usdProfit = (profit * ethPrice).toFixed(2);
      $('#changePriceUSDProfit' + tokenAddress + id).html(`$${usdProfit}`);
    }
  });
};

function transferToken(tokenAddress, id){
  $('#transferTokenBtn' + tokenAddress + id).click(async()=>{

    let toAddress = $('#toAddressInput' + tokenAddress + id).val();


    $('#transferTokenBtn' + tokenAddress + id).prop('disabled', true);
    $('#transferTokenBtn' + tokenAddress + id).html(`Transfer Token <div class="spinner-border spinner-border-sm  text-light" role="status">
                                                        <span class="sr-only">Loading...</span>
                                                      </div>`);
    try{
      await openMintTokenInstance.methods.safeTransferFrom(user.attributes.ethAddress, toAddress, id).send({from: user.attributes.ethAddress});
      $('#transferTokenBtn' + tokenAddress + id).html('Successfully Transferred Token');
      $('#transferTokenBtn' + tokenAddress + id).removeClass('btn-primary');
      $('#transferTokenBtn' + tokenAddress + id).addClass('btn-success');

      $('#owner' + tokenAddress + id).attr('href', "http://localhost:8000/profile.html?address=" + toAddress);
      $('#cardOwnerPhotoSpinner' + tokenAddress + id).css('display', 'block');
      newOwnerPhotoQuery(tokenAddress, id, toAddress);
      $('#toAddressInput').prop('disabled', true);

      $('#quickActions' + tokenAddress + id).html(`<a class="dropdown-item quick-action" id="shareQuickAction`+tokenAddress+id+`" data-toggle="modal" data-target="#shareModal`+tokenAddress+id+`">Share</a>`);
      shareQuickActionButton(tokenAddress, id);
    } catch(err){
      alert(err.message);
      $('#transferTokenBtn' + tokenAddress + id).prop('disabled', false);
      $('#transferTokenBtn' + tokenAddress + id).html('Put On Sale');
      $('#toAddressInput' + tokenAddress + id).prop('disabled', false);
      $('.modal').modal('hide');
    }
  });
};

function toAddressInput(tokenAddress, id){
  $('#toAddressInput' + tokenAddress + id).keyup(() =>{
    let address = $('#toAddressInput' + tokenAddress + id).val();
    let addressRegEx = /^0x[a-fA-F0-9]{40}$/;

    if(address.toLowerCase() == user.attributes.ethAddress.toLowerCase()){
      $('#transferTokenBtn' + tokenAddress + id).prop('disabled', true);
      $('#regexMessage' + tokenAddress + id).removeClass('text-success');
      $('#regexMessage' + tokenAddress + id).addClass('text-danger');
      $('#regexMessage' + tokenAddress + id).html('This is your current address');
    } else if(addressRegEx.test(address)){
      $('#transferTokenBtn' + tokenAddress + id).prop('disabled', false);
      $('#regexMessage' + tokenAddress + id).removeClass('text-danger');
      $('#regexMessage' + tokenAddress + id).addClass('text-success');
      $('#regexMessage' + tokenAddress + id).html('Valid ethereum address')
    } else{
      $('#transferTokenBtn' + tokenAddress + id).prop('disabled', true);
      $('#regexMessage' + tokenAddress + id).removeClass('text-success');
      $('#regexMessage' + tokenAddress + id).addClass('text-danger');
      $('#regexMessage' + tokenAddress + id).html('Invalid ethereum address')
    }
  });
};

async function newOwnerPhotoQuery(tokenAddress, id, toAddress){
  $('#ownerPhoto' + tokenAddress + id).css('display', 'none');
  $('#ownerRank' + tokenAddress + id).css('display', 'none');
  ifOwnerNotInDatabase(tokenAddress, id, toAddress);
  try{
    let users = await Moralis.Cloud.run('getAllUsers');
    for (i = 0; i < users.length; i++) {
      if(users[i].ethAddress.toLowerCase() == toAddress.toLowerCase()){
        let profilePhoto = users[i].profilePhoto;
        let amountSold = users[i].amountSold;
        if(profilePhoto){
          addSellerBadge(tokenAddress, id, amountSold);
          $('#ownerPhoto' + tokenAddress + id).attr('src', profilePhoto._url);
          dismissLoadingPulseOnOwnerPhoto(tokenAddress, id, profilePhoto._url)
        } else{
          addSellerBadge(tokenAddress, id, amountSold);
          $('#ownerPhoto' + tokenAddress + id).attr('src', './assets/images-icons/default.png');
          let photo = "./assets/images-icons/default.png";
          dismissLoadingPulseOnOwnerPhoto(tokenAddress, id, photo);
        }
      }
    }
  } catch(err){
    console.log(err);
  }
};

function cardDiv(tokenAddress, id, owner){
  let nftCard = `<div id="nftCard`+tokenAddress+id+`" class="grid-helper col-xs-12 col-sm-6 col-md-4 col-lg-4 col-xl-3">
                    <div id="card`+tokenAddress+id+`" class="card shadow-sm">
                      <div class="top-row">
                        <div class="creator-photo">
                          <a id='owner`+tokenAddress+id+`' href="http://localhost:8000/profile.html?address=`+owner+`"><img class="owner shadow-sm" id="ownerPhoto`+tokenAddress+id+`" src="" width="40" alt="owner photo">
                            <span id="cardOwnerPhotoSpinner`+tokenAddress+id+`" class="spinner-grow text-light" style="width: 40px; height: 40px; margin: 0; padding: 0;" role="status">
                              <span class="sr-only">Loading...</span>
                            </span>
                            <div class="rank-badge">
                              <img id="ownerRank`+tokenAddress+id+`" src="" width="15" alt="rank">
                            </div>
                          </a>
                        </div>
                        <!--NOT owner AND it's NOT on market these will be the options-->
                        <div class="dropleft">
                          <button class="btn btn-light dropdown-button" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            ...
                          </button>
                          <div class="dropdown-menu" id="quickActions`+tokenAddress+id+`" aria-labelledby="dropdownMenuButton">

                          </div>
                        </div>
                      </div>
                      <div class="embed-responsive embed-responsive-1by1">
                        <a href="http://localhost:8000/token.html?token=`+tokenAddress+id+`">
                          <span id='coverSpinner`+tokenAddress+id+`' class="spinner-grow text-light embed-responsive-item" role="status">
                            <span class="sr-only">Loading...</span>
                          </span>
                          <img id='cover`+tokenAddress+id+`' loading="lazy" src="" class="card-img embed-responsive-item" alt="...">
                          <span class="file-indicator"><img id="fileIcon`+tokenAddress+id+`" src="" width="20"></span>
                        </a>
                      </div>
                      <div class="card-body">
                        <a class="anchor" href="http://localhost:8000/token.html?token=`+tokenAddress+id+`">
                          <p id='name`+tokenAddress+id+`' class="card-title"></p>
                        </a>
                        <p class="card-text" id="forSale`+tokenAddress+id+`"></p>
                        <p class="card-text not-for-sale-text" id="notForSale`+tokenAddress+id+`"></p>
                        <div class="button-row">
                          <button class="btn btn-light like-encourage-button far fa-heart heart" id="like`+tokenAddress+id+`">
                            <span class="like-encourage-text like-counter" id="likeCounter`+tokenAddress+id+`"> </span>
                          </button>
                          <span id="button`+tokenAddress+id+`"></span>
                        </div>
                      </div>
                    </div>
                  </div>`
  $('.cardDivs').prepend(nftCard);
};

function userCard(ethAddress){
  let userCard = `<li id="userItem`+ethAddress+`" class="list-group-item d-flex justify-content-between align-items-center">
                    <a href="http://localhost:8000/profile.html?address=`+ethAddress+`">
                      <div class="owner-div row">
                        <div class="owner-photo">
                          <img loading="lazy" class="owner shadow-sm" id="userPhoto`+ethAddress+`" src="" width="40" alt="creator photo">
                          <span id="userSpinner`+ethAddress+`" class="spinner-grow text-light" style="width: 40px; height: 40px;" role="status">
                            <span class="sr-only">Loading...</span>
                          </span>
                          <div class="rank-badge">
                            <img id="userRank`+ethAddress+`" src="./assets/images-icons/oneSale.png" width="15" alt="badge based on how many sales from account">
                          </div>
                        </div>
                        <div>
                          <div class="username" id="username`+ethAddress+`"></div>
                          <div class="amount-of-followers sub-text" id="amountOfFollowers`+ethAddress+`"></div>
                        </div>
                      </div>
                    </a>
                    <div class="follow-btn-card" id="followUser`+ethAddress+`"></div>
                  </li>`
$('.list-group').append(userCard);
}

function changePriceModalHTML(tokenAddress, id){
  let changePriceModal = `<div class="modal fade" id="changePriceModal`+tokenAddress+id+`" data-backdrop="static" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered" role="document">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h5 class="modal-title">Change Price 🧐</h5>
                      <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                      </button>
                    </div>
                    <div class="modal-body">

                      <form>
                        <div id="changePriceInputGroup`+tokenAddress+id+`" class="price-input-group">
                          <div class="input-group">
                            <input id="changePriceInput`+tokenAddress+id+`" type="text" class="form-control input-styling" placeholder="Enter price in ETH" aria-label="ether amount">
                          </div>

                          <div class="price-calculator price-info">
                            <span>Service Fee Upon Sale <span>2%</span></span><br>
                            <span id="ifOwnerNotCreator`+tokenAddress+id+`">Creator's Royalty <span id="royalty`+tokenAddress+id+`"></span><br></span>
                            <span>Your profit will be: <span id="changePriceSaleProfit`+tokenAddress+id+`" class="sale-profit">0 ETH</span> <span id="changePriceUSDProfit`+tokenAddress+id+`">$0.00</span></span>
                          </div>
                        </div>
                      </form>

                    </div>
                    <div class="modal-footer change-price-footer">
                      <button type="button" class="btn btn-secondary button-styling" data-dismiss="modal">Close</button>
                      <button type="button" class="btn btn-primary button-styling" disabled id="changePriceBtn`+tokenAddress+id+`">Change Price</button>
                    </div>
                  </div>
                </div>
              </div>`

  $('.modals').append(changePriceModal);
};

function putForSaleModalHTML(tokenAddress, id){
let putForSaleModal =`<div class="modal fade" id="putForSaleModal`+tokenAddress+id+`" data-backdrop="static" tabindex="-1" role="dialog" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered" role="document">
                          <div class="modal-content">
                            <div class="modal-header">
                              <h5 class="modal-title">Put For Sale 🤑</h5>
                              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                              </button>
                            </div>
                            <div class="modal-body">
                              <button type="button" class="btn btn-primary btn-block button-styling" id="setApprovalBtn`+tokenAddress+id+`">Set Approval To Sell</button>

                              <form>
                                <div id="priceInputGroup`+tokenAddress+id+`" class="price-input-group">
                                  <div class="input-group">
                                    <input id="salePriceInput`+tokenAddress+id+`" type="text" class="form-control input-styling" placeholder="Enter price in ETH" aria-label="ether amount">
                                  </div>

                                  <div class="price-calculator price-info">
                                    <span>Service Fee Upon Sale <span>2%</span></span><br>
                                    <span id="ifOwnerNotCreator`+tokenAddress+id+`">Creator's Royalty <span id="royalty`+tokenAddress+id+`"></span><br></span>
                                    <span>Your profit will be: <span id="saleProfit`+tokenAddress+id+`" class="sale-profit">0 ETH</span> <span id="usdProfit`+tokenAddress+id+`">$0.00</span></span>
                                  </div>
                                </div>
                              </form>

                            </div>
                            <div class="modal-footer">
                              <button type="button" class="btn btn-secondary button-styling" data-dismiss="modal">Close</button>
                              <button type="button" class="btn btn-primary button-styling" disabled id="putOnSaleBtn`+tokenAddress+id+`">Put For Sale</button>
                            </div>
                          </div>
                        </div>
                      </div>`
  $('.modals').append(putForSaleModal);
};

function removeFromSaleModalHTML(tokenAddress, id){
  let removeFromSaleModal = `<div class="modal fade" id="removeFromSaleModal`+tokenAddress+id+`" data-backdrop="static" tabindex="-1" role="dialog" aria-hidden="true">
                              <div class="modal-dialog modal-dialog-centered" role="document">
                                <div class="modal-content">
                                  <div class="modal-header">
                                    <h5 class="modal-title">Remove From Sale 🥺</h5>
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                      <span aria-hidden="true">&times;</span>
                                    </button>
                                  </div>
                                  <div class="modal-body">
                                    <p class="modal-text">Are you sure you want to remove this artwork from being on sale?</p>
                                    <button type="button" class="btn btn-primary btn-block button-styling" id="yesContinueBtn`+tokenAddress+id+`">Yes, continue</button>
                                  </div>
                                  <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary button-styling" data-dismiss="modal">Close</button>
                                    <button type="button" class="btn btn-danger button-styling" disabled id="removeFromSaleBtn`+tokenAddress+id+`">Remove From Sale</button>
                                  </div>
                                </div>
                              </div>
                            </div>`
  $('.modals').append(removeFromSaleModal);
};

function transferTokenModalHTML(tokenAddress, id){
  let transferTokenModal = ` <div class="modal fade" id="transferTokenModal`+tokenAddress+id+`" data-backdrop="static" tabindex="-1" role="dialog" aria-hidden="true">
                              <div class="modal-dialog modal-dialog-centered" role="document">
                                <div class="modal-content">
                                  <div class="modal-header">
                                    <h5 class="modal-title">Transfer Token 🎁</h5>
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                      <span aria-hidden="true">&times;</span>
                                    </button>
                                  </div>
                                  <div class="modal-body">
                                    <form>
                                      <div id="toAddressInputGroup`+tokenAddress+id+`" class="price-input-group">
                                        <div class="input-group">
                                          <input id="toAddressInput`+tokenAddress+id+`" type="text" class="form-control input-styling" placeholder="0x..." aria-label="receiver address">
                                        </div>

                                        <div class="price-info">
                                          <span>Enter the address where you want to send this artwork</span><br>
                                          <span id="regexMessage`+tokenAddress+id+`"></span>
                                        </div>
                                      </div>
                                    </form>
                                  </div>
                                  <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary button-styling" data-dismiss="modal">Close</button>
                                    <button type="button" class="btn btn-primary button-styling" disabled id="transferTokenBtn`+tokenAddress+id+`">Transfer Token</button>
                                  </div>
                                </div>
                              </div>
                            </div>`
  $('.modals').append(transferTokenModal);
};

function shareModalHTML(tokenAddress, id){
  let shareModal = `<div class="modal fade" id="shareModal`+tokenAddress+id+`" tabindex="-1" role="dialog" aria-hidden="true">
                              <div class="modal-dialog modal-dialog-centered" role="document">
                                <div class="modal-content">
                                  <div class="modal-header center-content">
                                    <h5 class="modal-title">Share This NFT</h5>
                                  </div>
                                  <div class="modal-body center-content">
                                  <button id='twitterBtnInModal`+tokenAddress+id+`' target="popup" type="button" class="btn btn-primary m-2 button-styling">Twitter</button>
                                  <button id='facebookBtnInModal`+tokenAddress+id+`' target="popup" type="button" class="btn btn-primary m-2 button-styling">Facebook</button>
                                  <button id='emailBtnInModal`+tokenAddress+id+`' type="button" class="btn btn-primary m-2 button-styling">Email</button>
                                  </div>
                                </div>
                              </div>
                            </div>`
  $('.modals').append(shareModal);
};

function darkmodeForDynamicContent(){
  let darkmodeCookie = Cookies.get('darkmode');

  if(darkmodeCookie == 'true'){
    $('.btn-light').addClass('btn-dark');
    $('.btn-light').removeClass('btn-light');

    $('.card').css({'background': '#2a2a2a', 'border': '1px solid #444'});

    $('.dropdown-menu').css('background', 'black');
    $('.dropdown-item').css('color', '#8a8a8a');

    $('.slider-title').css('color', 'white');

    $('.social-tag').css('color', 'white');

    $('.modal-content').css('background', '#343a40');

    $('.anchor').css('color', 'white');

    $('.spinner-grow').removeClass('text-light');
    $('.spinner-grow').addClass('text-dark');
  } else if (darkmodeCookie == 'false') {
    $('.btn-dark').addClass('btn-light');
    $('.btn-dark').removeClass('btn-dark');

    $('.card').css({'background': 'white', 'border': '1px solid #ddd'});

    $('.dropdown-menu').css('background', 'white');
    $('.dropdown-item').css('color', 'black');

    $('.slider-title').css('color', 'black');

    $('.social-tag').css('color', 'black');

    $('.modal-content').css('background', 'white');

    $('.anchor').css('color', 'black');

    $('.spinner-grow').removeClass('text-dark');
    $('.spinner-grow').addClass('text-light');
  }
};
