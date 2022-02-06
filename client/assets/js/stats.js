const appId = ""; // Application id from moralis.io
const serverUrl = ''; //Server url from moralis.io
Moralis.start({ serverUrl, appId });


const user = Moralis.User.current();
let web3;
let bnbPrice;
const BASE_URL = "https://api.1inch.exchange/v3.0/56/";
const WBNB_TO_BUSD = "quote?fromTokenAddress=0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c&toTokenAddress=0xe9e7cea3dedca5984780bafc599bd69add087d56&amount=1000000000000000000";

$(document).ready(async ()=>{
  web3 = await Moralis.enableWeb3();
  bnbPrice = await getBnbPrice();
  loadInfo();
  $('[data-toggle="tooltip"]').tooltip();
});

function loadInfo(){
  getProfits();
  getRoyaltiesReceived();
  getTipsReceived();
  getTotalEarned();
  getNextBadgePreview();
  getAmountSold();
  getAmountBought();
  getAmountMinted();
  getLikesReceived();
  getCurrentEncouragements();
  getFollowerCount();
  getFollowingCount();
  getDateJoined();
};

async function getBnbPrice(){
  let bnbPrice = BASE_URL + WBNB_TO_BUSD;
  const response = await fetch(bnbPrice);
  const data = await response.json();
  const usdBnbPrice = web3.utils.fromWei(data.toTokenAmount, 'ether');
  return Number(usdBnbPrice);
};

if(user == null){
  $('.container').html(`<p id="notYetConnectedText">Please connect wallet to view your stats</p>`);
  $('#ifWalletNotConnectedModal').modal('show');
};

//button in connect modal
$('#connectWalletModalBtn').click(async ()=>{
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

$('#goBackBtn').click(()=>{
  window.history.back();
});

async function getProfits(){
  const params = {ethAddress: user.attributes.ethAddress};
  let userInfo = await Moralis.Cloud.run('getUser', params);
  let totalProfit = userInfo.totalProfit;
  if(totalProfit == undefined){
    $('#profitsFromSelling').html(`0 BNB`);
    $('#profitsFromSellingUSD').html(`($0.00)`);
  } else{
    totalProfit = userInfo.totalProfit.toString();
    let profitInBnb = web3.utils.fromWei(totalProfit, 'ether');
    let priceInUsd = (profitInBnb * bnbPrice).toFixed(2);
    $('#profitsFromSelling').html(`${profitInBnb} BNB`);
    $('#profitsFromSellingUSD').html(`($${priceInUsd})`);
  }
  $('.profit').removeClass('spinner-border spinner-border-sm text-primary')
};

async function getRoyaltiesReceived(){
  const params = {ethAddress: user.attributes.ethAddress};
  let userInfo = await Moralis.Cloud.run('getUser', params);
  let totalRoyalties = userInfo.totalRoyalties;
  if(totalRoyalties == undefined){
    $('#royaltiesReceived').html(`0 BNB`);
    $('#royaltiesReceivedUSD').html(`($0.00)`);
  } else{
    totalRoyalties = userInfo.totalRoyalties.toString();
    let royaltiesInBnb = web3.utils.fromWei(totalRoyalties, 'ether');
    let priceInUsd = (royaltiesInBnb * bnbPrice).toFixed(2);
    $('#royaltiesReceived').html(`${royaltiesInBnb} BNB`);
    $('#royaltiesReceivedUSD').html(`($${priceInUsd})`);
  }
  $('.royalty').removeClass('spinner-border spinner-border-sm text-primary')
};

async function getTipsReceived(){
  const params = {ethAddress: user.attributes.ethAddress};
  let userInfo = await Moralis.Cloud.run('getUser', params);
  let totalTips = userInfo.totalTips;
  if(totalTips == undefined){
    $('#tipsReceived').html(`0 BNB`);
    $('#tipsReceivedUSD').html(`($0.00)`);
  } else{
    totalTips = userInfo.totalTips.toString();
    let tipsInBnb = web3.utils.fromWei(totalTips, 'ether');
    let priceInUsd = (tipsInBnb * bnbPrice).toFixed(2);
    $('#tipsReceived').html(`${tipsInBnb} BNB`);
    $('#tipsReceivedUSD').html(`($${priceInUsd})`);
  }
  $('.tips').removeClass('spinner-border spinner-border-sm text-primary')
};

async function getTotalEarned(){
  const params = {ethAddress: user.attributes.ethAddress};
  let userInfo = await Moralis.Cloud.run('getUser', params);
  let totalTips = userInfo.totalTips;
  if(totalTips == undefined){
    totalTips = 0;
  }
  let totalRoyalties = userInfo.totalRoyalties;
  if(totalRoyalties == undefined){
    totalRoyalties = 0;
  }
  let totalProfit = userInfo.totalProfit;
  if(totalProfit == undefined){
    totalProfit = 0;
  }
  let total = totalTips + totalRoyalties + totalProfit;
  total = total.toString();
  let totalBnb = web3.utils.fromWei(total, 'ether');
  let totalUsd = (totalBnb * bnbPrice).toFixed(2);
  $('#total').html(`${totalBnb} BNB`);
  $('#totalUSD').html(`($${totalUsd})`);
  $('.total').removeClass('spinner-border spinner-border-sm text-primary')
};

async function getNextBadgePreview(){
  const params = {ethAddress: user.attributes.ethAddress};
  let userInfo = await Moralis.Cloud.run('getUser', params);
  let amountSold = userInfo.amountSold;

  nextBadge(amountSold);
  $('.next-badge').removeClass('spinner-border spinner-border-sm text-primary')
  $('.badge-img').removeClass('spinner-border spinner-border-sm text-primary')
};

function nextBadge(amountSold){
  if (amountSold == undefined){
    $('#amountTillNextBadge').html(1);
    $('#nextBadge').attr('src', './assets/images-icons/oneSale.png');
  } else if(amountSold >= 1 && amountSold <= 4){
    $('#amountTillNextBadge').html(5 - amountSold);
    $('#nextBadge').attr('src', './assets/images-icons/fiveSales.png');
  } else if(amountSold >= 5 && amountSold <= 9){
    $('#amountTillNextBadge').html(10 - amountSold);
    $('#nextBadge').attr('src', './assets/images-icons/tenSales.png');
  } else if(amountSold >= 10 && amountSold <= 19){
    $('#amountTillNextBadge').html(20 - amountSold);
    $('#nextBadge').attr('src', './assets/images-icons/twentySales.png');
  } else if(amountSold >= 20 && amountSold <= 34){
    $('#amountTillNextBadge').html(35 - amountSold);
    $('#nextBadge').attr('src', './assets/images-icons/thirtyfiveSales.png');
  } else if(amountSold >= 35 && amountSold <= 49){
    $('#amountTillNextBadge').html(50 - amountSold);
    $('#nextBadge').attr('src', './assets/images-icons/fiftySales.png');
  } else if(amountSold >= 50 && amountSold <= 74){
    $('#amountTillNextBadge').html(75 - amountSold);
    $('#nextBadge').attr('src', './assets/images-icons/seventyfiveSales.png');
  } else if(amountSold >= 75 && amountSold <= 99){
    $('#amountTillNextBadge').html(100 - amountSold);
    $('#nextBadge').attr('src', './assets/images-icons/hundredPlusSales.png');
  } else if(amountSold >= 100){
    $('#amountTillNextBadge').html(0);
    $('#nextBadge').attr('src', './assets/images-icons/hundredPlusSales.png');
  }
};

async function getAmountSold(){
  const params = {ethAddress: user.attributes.ethAddress};
  let userInfo = await Moralis.Cloud.run('getUser', params);
  let amountSold = userInfo.amountSold;
  if(amountSold == undefined){
    $('#amountSold').html(0);
  } else{
    $('#amountSold').html(amountSold);
  }
  $('.sold').removeClass('spinner-border spinner-border-sm text-primary')
};

async function getAmountBought(){
  const params = {ethAddress: user.attributes.ethAddress};
  let userInfo = await Moralis.Cloud.run('getUser', params);
  let amountBought = userInfo.amountBought;
  if(amountBought == undefined){
    $('#amountBought').html(0);
  } else{
    $('#amountBought').html(amountBought);
  }
  $('.bought').removeClass('spinner-border spinner-border-sm text-primary')
};

async function getAmountMinted(){
  let artwork = await Moralis.Cloud.run('getArtwork');
  const count = artwork.filter(item => item.creator.toLowerCase() == user.attributes.ethAddress.toLowerCase()).length;
  $('#amountMinted').html(count);
  $('.minted').removeClass('spinner-border spinner-border-sm text-primary')
};

async function getLikesReceived(){
  try{
    let totalLikes = 0;
    let artwork = await Moralis.Cloud.run('getArtwork');
    for (i = 0; i < artwork.length; i++) {
      if(artwork[i].creator.toLowerCase() == user.attributes.ethAddress.toLowerCase()){
        let likes = artwork[i].likes;
        totalLikes += +likes;
        $('#likesReceived').html(totalLikes);
        $('.likes').removeClass('spinner-border spinner-border-sm text-primary')
      } else {
        $('#likesReceived').html(0);
        $('.likes').removeClass('spinner-border spinner-border-sm text-primary')
      }
    }
  } catch (error){
    console.log(error)
  }
};

async function getCurrentEncouragements(){
  try{
    let totalEncouragements = 0;
    let artwork = await Moralis.Cloud.run('getArtwork');
    for (i = 0; i < artwork.length; i++) {
      if(artwork[i].currentOwner.toLowerCase() == user.attributes.ethAddress.toLowerCase()){
        let encouragements = artwork[i].encouragements;
        totalEncouragements += +encouragements;
        if(encouragements == undefined){
          $('#currentEncouragements').html(0);
          $('.encouragements').removeClass('spinner-border spinner-border-sm text-primary')
        } else{
          $('#currentEncouragements').html(totalEncouragements);
          $('.encouragements').removeClass('spinner-border spinner-border-sm text-primary')
        }
      } else {
        $('#currentEncouragements').html(0);
        $('.encouragements').removeClass('spinner-border spinner-border-sm text-primary')
      }
    }
  } catch (error){
    console.log(error)
  }
};

async function getFollowerCount(){
  const params = {ethAddress: user.attributes.ethAddress}
  let followers = await Moralis.Cloud.run('getFollowers', params);
  if(followers == undefined){
    $('#amountOfFollowers').html(0);
  } else{
    let followerCount = followers.length;
    $('#amountOfFollowers').html(followerCount);
  }
  $('.followers').removeClass('spinner-border spinner-border-sm text-primary')
};

async function getFollowingCount(){
  const params = {ethAddress: user.attributes.ethAddress}
  let following = await Moralis.Cloud.run('getFollowing', params);
  if(following == undefined){
    $('#amountFollowing').html(0);
  } else{
    let followingCount = following.length;
    $('#amountFollowing').html(followingCount);
  }
  $('.following').removeClass('spinner-border spinner-border-sm text-primary');
};

function getDateJoined(){
  let joined = user.attributes.createdAt;
  let day = joined.getDate();
  let month = joined.getMonth() + 1;
  let year = joined.getFullYear();
  $('#dateJoined').html(`${day}.${month}.${year}`);
  $('.date').removeClass('spinner-border spinner-border-sm text-primary');
};
