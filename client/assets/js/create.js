Moralis.initialize(""); // Application id from moralis.io
Moralis.serverURL = ''; //Server url from moralis.io

let user = Moralis.User.current();

$(document).ready(async function(){
  ifWalletNotConnected();
});

$('#singleButton').click(() =>{
  window.location.href='erc-721.html';
});

$('#multipleButton').click(() =>{
  // window.location.href='erc-1155.html';
});

async function ifWalletNotConnected(){
  if(user == null){
    $('#ifWalletNotConnectedModal').modal('show');
  }
};

$('#goBackBtn').click(()=>{
  window.history.back();
});

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
      user = Moralis.User.current();
      location.reload();
    }
  } catch (error) {
    alert(error.message);
    $('#connectWalletModalBtn').prop('disabled', false);
    $('#connectWalletModalBtn').html('Connect Wallet');
    $('#connectWalletBtn').html('Connect Wallet');
  }
});
