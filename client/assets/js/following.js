Moralis.initialize(""); // Application id from moralis.io
Moralis.serverURL = ''; //Server url from moralis.io

const user = Moralis.User.current();

const BASE_URL = "https://api.coingecko.com/api/v3";
const ETH_USD_PRICE_URL = "/simple/price?ids=ethereum&vs_currencies=usd";
const openMintTokenAddress = "";
const openMintMarketplaceAddress = "";
let openMintTokenInstance;
let openMintMarketplaceInstance;
let web3;
let ethPrice;

$(document).ready(async ()=>{
  web3 = await Moralis.Web3.enable();
  openMintTokenInstance = new web3.eth.Contract(abi.OpenMintToken, openMintTokenAddress);
  openMintMarketplaceInstance = new web3.eth.Contract(abi.OpenMintMarketplace, openMintMarketplaceAddress);
  ethPrice = await getEthPrice();
  isUserIn();
});

function isUserIn(){
  if(!user){
    $('.following').html('<p class="center-content not-connected-text">Please connect wallet to view artwork from artists you follow</p>');
    $('#ifWalletNotConnectedModal').modal('show');
  }else{
    checkIfUserIsFollowingPeople();
  }
};

function checkIfUserIsFollowingPeople(){
  let followingArray = user.attributes.following;
  if(followingArray == undefined || !followingArray.length){
    $('.following').html("<div class='center-content'><span class='not-connected-text'>Follow an artist to see the NFTs they create here.<br><span class='price-info'>The follow button is located on the user's profile page</span></span><div>");
  } else{
    $('#amountFollowing').html(`(${followingArray.length})`);
    viewAll();
    allCount();
    forSaleCount();
    notForSaleCount();
  }
};

//button in connect modal
$('#connectWalletModalBtn').click(async () =>{
  $('#connectWalletModalBtn').prop('disabled', true);
  $('#connectWalletModalBtn').html(`Connecting... <div class="spinner-border spinner-border-sm text-light" role="status">
                                                        <span class="sr-only">Loading...</span>
                                                      </div>`);
  //this is the one in the nav
  $('#connectWalletBtn').html(`Connecting... <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
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
    $('#connectWalletBtn').html('Connect');
  }
});

async function getEthPrice(){
  let ethPrice = BASE_URL + ETH_USD_PRICE_URL;
  const response = await fetch(ethPrice);
  const data = await response.json();
  let usdEthPrice = data.ethereum.usd;
  return Number(usdEthPrice);
};

function loader(){
  $('.cardDivs').html(`<div id='loader' class="spinner-border mt-5 text-primary" style="width: 3rem; height: 3rem;" role="status">
                        <span class="sr-only">Loading...</span>
                      </div>`);
};

function removeDuplicates(data, key){
  return [
    ...new Map(
        data.map(x => [key(x), x])
    ).values()
  ]
};

async function allCount(){
  let followingArray = user.attributes.following;
  let inactiveArtwork = await Moralis.Cloud.run('getArtwork');
  let ifOfferDetails = await Moralis.Cloud.run("getOfferDetails");
  let ifOfferDetailsDuplicatesRemoved = removeDuplicates(ifOfferDetails, it => it.tokenId);
  let activeCount = ifOfferDetailsDuplicatesRemoved.filter(item => !item.isSold && item.active && followingArray.includes(item.creator)).length;
  let inactiveCount = inactiveArtwork.filter(item => !item.active && followingArray.includes(item.creator)).length;
  let allCount = inactiveCount + activeCount;
  $('#allCount').html(allCount);
};

async function forSaleCount(){
  let followingArray = user.attributes.following;
  let ifOfferDetails = await Moralis.Cloud.run("getOfferDetails");
  let ifOfferDetailsDuplicatesRemoved = removeDuplicates(ifOfferDetails, it => it.tokenId);
  let activeCount = ifOfferDetailsDuplicatesRemoved.filter(item => !item.isSold && item.active && followingArray.includes(item.creator)).length;
  $('#forSaleCount').html(activeCount);
};

async function notForSaleCount(){
  let followingArray = user.attributes.following;
  let inactiveArtwork = await Moralis.Cloud.run('getArtwork');
  let inactiveCount = inactiveArtwork.filter(item => !item.active && followingArray.includes(item.creator)).length;
  $('#notForSaleCount').html(inactiveCount);
};

$('#forSale').click(async ()=>{
  let followingArray = user.attributes.following;
  $('.cardDivs').empty();
  loader();
  let ifOfferDetails = await Moralis.Cloud.run("getOfferDetails");
  let ifOfferDetailsDuplicatesRemoved = removeDuplicates(ifOfferDetails, it => it.tokenId);
  let activeCount = ifOfferDetailsDuplicatesRemoved.filter(item => !item.isSold && item.active && followingArray.includes(item.creator)).length;
  if(activeCount < 1){
    $('.following-wrapper').html(`<div class="no-art-for-sale shadow-sm">The artists you follow do not have artwork for sale on Open<span class="gradient-text">Mint</span> at the moment.<div>`);
  }
  recentlyPutForSale();
});

$('#notForSale').click(async ()=>{
  let followingArray = user.attributes.following;
  $('.cardDivs').empty();
  loader();
  let inactiveArtwork = await Moralis.Cloud.run('getArtwork');
  let inactiveCount = inactiveArtwork.filter(item => !item.active && followingArray.includes(item.creator)).length;
  if(inactiveCount < 1){
    $('.following-wrapper').html(`<div class="no-art-for-sale shadow-sm">The artists you follow do not have artwork not for sale on Open<span class="gradient-text">Mint</span> at the moment.<div>`);
  }
  recentlyMintedAndNotOnSale();
});

$('#viewAll').click(()=>{
  $('.cardDivs').empty();
  loader();
  viewAll();
});

async function viewAll(){
  let followingArray = user.attributes.following;
  let ifOfferDetails = await Moralis.Cloud.run("getOfferDetails");
  let ifOfferDetailsDuplicatesRemoved = removeDuplicates(ifOfferDetails, it => it.tokenId);
  let activeCount = ifOfferDetailsDuplicatesRemoved.filter(item => !item.isSold && item.active && followingArray.includes(item.creator)).length;
  let inactiveArtwork = await Moralis.Cloud.run('getArtwork');
  let inactiveCount = inactiveArtwork.filter(item => !item.active && followingArray.includes(item.creator)).length;
  console.log('Inactive: ' + inactiveCount);
  console.log('Active: ' + activeCount);

  if(activeCount < 1 && inactiveCount < 1){
    $('.following-wrapper').html(`<div class="no-art-for-sale shadow-sm">The artists you follow do not have artwork created on Open<span class="gradient-text">Mint</span> at the moment.<div>`);
  }
  recentlyPutForSale();
  recentlyMintedAndNotOnSale();
};

async function recentlyPutForSale(){
  let followingArray = user.attributes.following;
  try{
    let ifOfferDetails = await Moralis.Cloud.run("getOfferDetails");
    let ifOfferDetailsLength = removeDuplicates(ifOfferDetails, art => art.tokenId).length;
    let ifOfferDetailsDuplicatesRemoved = removeDuplicates(ifOfferDetails, art => art.tokenId);

    for (i = 0; i < ifOfferDetailsLength; i++) {
      if(ifOfferDetailsDuplicatesRemoved[i].active == true && ifOfferDetailsDuplicatesRemoved[i].isSold == false && followingArray.includes(ifOfferDetailsDuplicatesRemoved[i].creator)){
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

async function recentlyMintedAndNotOnSale(){
  let followingArray = user.attributes.following;
  try{
    let inactiveArtwork = await Moralis.Cloud.run('getArtwork');
    for (i = 0; i < inactiveArtwork.length; i++) {
      if(inactiveArtwork[i].active == false && followingArray.includes(inactiveArtwork[i].creator)){
        let cover = inactiveArtwork[i].cover._url;
        let tokenAddress = inactiveArtwork[i].tokenAddress;
        let id = inactiveArtwork[i].tokenId;
        let name = inactiveArtwork[i].name;
        let fileType = inactiveArtwork[i].fileType;
        let active = inactiveArtwork[i].active;
        let likes = inactiveArtwork[i].likes;
        let owner = inactiveArtwork[i].currentOwner;
        let royalty = inactiveArtwork[i].royalty;
        let creator = inactiveArtwork[i].creator;
        let unlockableContent = inactiveArtwork[i].unlockableContent;
        let encouragements = inactiveArtwork[i].encouragements;
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
        $('#encourageCounter' + tokenAddress + id).html(' Encourage To Sell');
        $('#encourageBell' + tokenAddress + id).prop('disabled', false);
      }else{
        $('#encourageCounter' + tokenAddress + id).html(` ${encourage}`);
        $('#encourageBell' + tokenAddress + id).prop('disabled', false);
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

function dismissLoadingPulseOnCover(tokenAddress, id, cover){
  let img = new Image;
  img.src = cover;
  img.onload = function(){
    $('#cover' + tokenAddress + id).css('display', 'block');
    $('#spinnerGrow' + tokenAddress + id).css('display', 'none');
  };
  img.onerror = function(){
    $('#cover' + tokenAddress + id).css('display', 'block');
    $('#spinnerGrow' + tokenAddress + id).css('display', 'none');
    $('#cover' + tokenAddress + id).attr('src', './assets/images-icons/cantFindNFT.png');
    console.log('No network connection or NFT is not available.');
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
        dismissLoadingPulseOnOwnerPhoto(tokenAddress, id, profilePhoto._url)
      } else if (ethAddress == owner && !profilePhoto){
        addSellerBadge(tokenAddress, id, amountSold);
        $('#ownerPhoto' + tokenAddress + id).attr('src', './assets/images-icons/default.png');
        let defaultProfilePhoto = "./assets/images-icons/default.png"
        dismissLoadingPulseOnOwnerPhoto(tokenAddress, id, defaultProfilePhoto)
      }
    }
  } catch(err){
    console.log(err);
  }
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

function dismissLoadingPulseOnOwnerPhoto(tokenAddress, id, profilePhoto){
  let img = new Image;
  img.src = profilePhoto;
  img.onload = function(){
    $('#ownerPhoto' + tokenAddress + id).css('display', 'inline');
    $('#ownerRank' + tokenAddress + id).css('display', 'block');
    $('#cardSpinner' + tokenAddress + id).css('display', 'none');
  };
  img.onerror = function(){
    $('#ownerPhoto' + tokenAddress + id).css('display', 'inline');
    $('#ownerRank' + tokenAddress + id).css('display', 'block');
    $('#cardSpinner' + tokenAddress + id).css('display', 'none');
    $('#ownerPhoto' + tokenAddress + id).attr('src', './assets/images-icons/cantFindProfilePhoto.png');
    console.log('No network connection or profilephoto is not available.')
  };
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

function likeButton(tokenAddress, id, likes){
  if(likes > 0){
    $('#likeCounter' + tokenAddress + id).html(likes);
  }
  $('#like' + tokenAddress + id).click(async ()=>{
    if(user){
      $('#like' + tokenAddress + id).prop('disabled', true);
      $('#soldCardLike' + tokenAddress + id).prop('disabled', true);
      const params = {
        tokenAddress: tokenAddress,
        tokenId: id
        };
      let like = await Moralis.Cloud.run('like', params);
      console.log(like);
      if(like || !like){
        $('#likeCounter' + tokenAddress + id).html(like);
        $('#soldCardLikeCounter' + tokenAddress + id).html(like);
        $('#like' + tokenAddress + id).prop('disabled', false);
        $('#soldCardLike' + tokenAddress + id).prop('disabled', false);
      }

      let likeQuery = await Moralis.Cloud.run('userLikesThisArtwork', params);
      if(likeQuery){
        $('#like' + tokenAddress + id).removeClass('far');
        $('#like' + tokenAddress + id).addClass('fas');
        $('#soldCardLike' + tokenAddress + id).removeClass('far');
        $('#soldCardLike' + tokenAddress + id).addClass('fas');
      } else{
        $('#like' + tokenAddress + id).removeClass('fas');
        $('#like' + tokenAddress + id).addClass('far');
        $('#soldCardLike' + tokenAddress + id).removeClass('fas');
        $('#soldCardLike' + tokenAddress + id).addClass('far');
      }
    } else{
      $('#ifWalletNotConnectedModal').modal('show');
    }
  });
};

function fileIcon(tokenAddress, id, fileType){
  if(fileType == 'image/png' || fileType == 'image/jpeg' || fileType == 'image/gif' || fileType == 'image/webp'){
    $('#fileIcon' + tokenAddress + id).attr('src', '');
  } else if (fileType == "video/mp4" || fileType == "video/webm") {
    $('#fileIcon' + tokenAddress + id).attr('src', 'assets/images-icons/videoIcon.png');
  } else if (fileType == "audio/mp3" || fileType == "audio/webm" || fileType == "audio/mpeg"){
    $('#fileIcon' + tokenAddress + id).attr('src', 'assets/images-icons/audioIcon.png');
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
  transferTokenQuickActionButton(tokenAddress, id);
  removeFromSaleQuickActionButton(tokenAddress, id, royalty, creator);
  changePriceQuickActionButton(tokenAddress, id, royalty, creator);
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
    $('#putOnSaleBtn' + tokenAddress + id).html(`Put On Sale <div class="spinner-border spinner-border-sm text-light" role="status">
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
      removeFromSaleQuickActionButton(tokenAddress, id, royalty, creator);
      changePriceQuickActionButton(tokenAddress, id, royalty, creator);
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
    $('#removeFromSaleBtn' + tokenAddress + id).html(`Remove From Sale<div class="spinner-border spinner-border-sm text-light" role="status">
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
    let price = $('#changePriceInput' + tokenAddress + id).val();
    price = price.replace(/^0+/, '').replace(/\.?0+$/, ''); //figure out how to combine these
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
      removeFromSaleQuickActionButton(tokenAddress, id, royalty, creator);
      changePriceQuickActionButton(tokenAddress, id, royalty, creator);
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
    $('#transferTokenBtn' + tokenAddress + id).html(`Transfer Token <div class="spinner-border spinner-border-sm text-light" role="status">
                                                        <span class="sr-only">Loading...</span>
                                                      </div>`);
    try{
      await openMintTokenInstance.methods.safeTransferFrom(user.attributes.ethAddress, toAddress, id).send({from: user.attributes.ethAddress});
      $('#transferTokenBtn' + tokenAddress + id).html('Successfully Transferred Token');
      $('#transferTokenBtn' + tokenAddress + id).removeClass('btn-primary');
      $('#transferTokenBtn' + tokenAddress + id).addClass('btn-success');

      $('#owner' + tokenAddress + id).attr('href', "http://localhost:8000/profile.html?address=" + toAddress);
      $('#cardSpinner' + tokenAddress + id).css('display', 'block');

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
  let nftCard = `<div id="nftCard`+tokenAddress+id+`" class="grid-helper col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-3">
                    <div id="card`+tokenAddress+id+`" class="card minted-item shadow-sm">
                      <div class="top-row">
                        <div class="creator-photo">
                          <a id='owner`+tokenAddress+id+`' href="http://localhost:8000/profile.html?address=`+owner+`"><img loading="lazy" class="owner shadow-sm" id="ownerPhoto`+tokenAddress+id+`" src="" width="40" alt="owner photo">
                            <span id="cardSpinner`+tokenAddress+id+`" class="spinner-grow text-light" style="width: 40px; height: 40px; margin: 0; padding: 0;" role="status">
                              <span class="sr-only">Loading...</span>
                            </span>
                            <div class="rank-badge">
                              <img id="ownerRank`+tokenAddress+id+`" src="" width="15" height="15" alt="seller badge">
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
                          <span id='spinnerGrow`+tokenAddress+id+`' class="spinner-grow text-light embed-responsive-item" role="status">
                            <span class="sr-only">Loading...</span>
                          </span>
                          <img loading="lazy" id='cover`+tokenAddress+id+`' src="" class="card-img embed-responsive-item" alt="">
                          <span class="file-indicator"><img id="fileIcon`+tokenAddress+id+`" src="" width="20"></span>
                        </a>
                      </div>
                      <div class="card-body">
                        <a class="anchor" href="http://localhost:8000/token.html?token=`+tokenAddress+id+`">
                          <p id="name`+tokenAddress+id+`" class="card-title"></p>
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

function soldCardShareModalHTML(tokenAddress, id){
  let soldCardShareModal = `<div class="modal fade" id="soldCardShareModal`+tokenAddress+id+`" tabindex="-1" role="dialog" aria-hidden="true">
                              <div class="modal-dialog modal-dialog-centered" role="document">
                                <div class="modal-content">
                                  <div class="modal-header center-content">
                                    <h5 class="modal-title">Share This NFT</h5>
                                  </div>
                                  <div class="modal-body center-content">
                                  <button id='soldCardTwitterBtnInModal`+tokenAddress+id+`' target="popup" type="button" class="btn btn-primary m-2 button-styling">Twitter</button>
                                  <button id='soldCardFacebookBtnInModal`+tokenAddress+id+`' target="popup" type="button" class="btn btn-primary m-2 button-styling">Facebook</button>
                                  <button id='soldCardEmailBtnInModal`+tokenAddress+id+`' type="button" class="btn btn-primary m-2 button-styling">Email</button>
                                  </div>
                                </div>
                              </div>
                            </div>`
  $('.modals').append(soldCardShareModal);
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
