Moralis.initialize(""); // Application id from moralis.io
Moralis.serverURL = ''; //Server url from moralis.io

$(document).ready(()=>{
  initUser();
});

//button in nav
$('#connectWalletBtn').click(()=>{
  $('#connectWalletBtn').prop('disabled', true);
  $('#connectWalletBtn').html(`Connecting... <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                <span class="sr-only">Loading...</span>`);
  login();
});

async function login(){
  try {
    let userIn = await Moralis.Web3.authenticate();
    if(userIn){
      location.reload();
      initUser();
    }
  } catch (error) {
    alert(error.message);
    $('#connectWalletBtn').prop('disabled', false);
    $('#connectWalletBtn').html('Connect');
  }
};

async function initUser(){
  if (user){
    console.log(user.attributes.authData.moralisEth.data);
    $('#connectWalletTag').css('display', 'none');
    $('#profileTag').css('display', 'block');
    displayEthAddressInNav();
    displayProfilePhotoInNav();
    console.log('user logged in');
  } else{
    $('#connectWalletTag').css('display', 'block');
    $('#profileTag').css('display', 'none');
    $('#connectWallet').css('display', 'block');
    console.log('user NOT logged in');
  }
};

function displayEthAddressInNav(){
  let abbreivatedAddress = truncateStringInNav(user.attributes.ethAddress);
  $('#userAddress').html(abbreivatedAddress);
};

function truncateStringInNav(str) {
  let lastChar = str.length;
  return str.slice(0, 6) + '...' + str.slice((lastChar - 3), lastChar);
};

function displayProfilePhotoInNav(){
  if(user.attributes.profilePhoto){
    displaySellerRankInNav();
    $('#profilePhotoInNav').attr('src', user.attributes.profilePhoto._url);
    $('#profilePhotoInNav').css('display', 'none');

    let profilePhoto = user.attributes.profilePhoto._url;

      let img = new Image;

      img.src = profilePhoto;

      img.onload = function(){
        $('#spinnerBorderInNav').css('display', 'none');
        $('#profilePhotoInNav').css('display', 'inline');

        console.log('profilePhoto succesfully loaded!')
      };

      img.onerror = function(){
        $('#spinnerBorderInNav').css('display', 'none');
        $('#profilePhotoInNav').css('display', 'inline');
        $('#profilePhotoInNav').attr('src', './assets/images-icons/cantFindProfilePhoto.png');
        console.log('No network connection or profile photo is not available.')
      };

  } else{
    displaySellerRankInNav();
    $('#profilePhotoInNav').attr('src', './assets/images-icons/default.png');
    $('#profilePhotoInNav').css('display', 'none');

    let profilePhoto = './assets/images-icons/default.png';

      let img = new Image;

      img.src = profilePhoto;

      img.onload = function(){
        $('#spinnerBorderInNav').css('display', 'none');
        $('#profilePhotoInNav').css('display', 'inline');

        console.log('profilePhoto succesfully loaded!')
      };

      img.onerror = function(){
          alert('No network connection or profile photo is not available.')
      };
  }
};

function displaySellerRankInNav(){
  let amountSold = user.attributes.amountSold;
  if (amountSold == undefined){
    $('#rankInNav').attr('src', './assets/images-icons/noSales.png');
  } else if(amountSold >= 1 && amountSold <= 4){
    $('#rankInNav').attr('src', './assets/images-icons/oneSale.png');
  } else if(amountSold >= 5 && amountSold <= 9){
    $('#rankInNav').attr('src', './assets/images-icons/fiveSales.png');
  } else if(amountSold >= 10 && amountSold <= 19){
    $('#rankInNav').attr('src', './assets/images-icons/tenSales.png');
  } else if(amountSold >= 20 && amountSold <= 34){
    $('#rankInNav').attr('src', './assets/images-icons/twentySales.png');
  } else if(amountSold >= 35 && amountSold <= 49){
    $('#rankInNav').attr('src', './assets/images-icons/thirtyfiveSales.png');
  } else if(amountSold >= 50 && amountSold <= 74){
    $('#rankInNav').attr('src', './assets/images-icons/fiftySales.png');
  } else if(amountSold >= 75 && amountSold <= 99){
    $('#rankInNav').attr('src', './assets/images-icons/seventyfiveSales.png');
  } else if(amountSold >= 100){
    $('#rankInNav').attr('src', './assets/images-icons/hundredPlusSales.png');
  }
};

$('#myProfile').click(()=>{
  const base = 'http://localhost:8000/profile.html?address=';
  let destination = user.attributes.ethAddress.toLowerCase();
  let profile = base + destination;
  $('#myProfile').attr('href', profile);
});

$('#disconnectWalletBtn').click(()=>{
  logout();
});

async function logout(){
  try {
    let loggedOut = await Moralis.User.logOut();
    if(loggedOut){
      initUser();
    }
    window.location.href="index.html";
  } catch (error) {
    alert(error.message)
  }
};
