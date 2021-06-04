Moralis.initialize(""); // Application id from moralis.io
Moralis.serverURL = ''; //Server url from moralis.io

const user = Moralis.User.current();
const openMintTokenAddress = "";
const openMintMarketplaceAddress = "";
let openMintTokenInstance;
let openMintMarketplaceInstance;
let web3;
let nft;
let cover;
let royalty = 10;
let ethPrice;
const BASE_URL = "https://api.coingecko.com/api/v3";
const ETH_USD_PRICE_URL = "/simple/price?ids=ethereum&vs_currencies=usd";
console.log(user);

$(document).ready(async function(){
  web3 = await Moralis.Web3.enable();
  openMintTokenInstance = new web3.eth.Contract(abi.OpenMintToken, openMintTokenAddress);
  openMintMarketplaceInstance = new web3.eth.Contract(abi.OpenMintMarketplace, openMintMarketplaceAddress);
  ethPrice = await getEthPrice();
  checkIfApproved();
});

if(user == null){
  $('#ifWalletNotConnectedModal').modal('show');

  $('#nftImgFile').prop('disabled', true);
  $('#nftCoverFile').prop('disabled', true);
  $('#onSaleSwitch').prop('disabled', true);
  $('#salePriceInput').prop('disabled', true);
  $('#royaltySlider').prop('disabled', true);
  $('#title').prop('disabled', true);
  $('#descriptionInput').prop('disabled', true);
  $('#additionalInfoInput').prop('disabled', true);
  $('#createButton').prop('disabled', true);
  $('#createModal').modal('hide');
  $('#setApprovalBtn').prop('disabled', true);
  $('#saveToIPFSBtn').prop('disabled', true);
  $('#setOffer').prop('disabled', true);
}

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

$('#goBackBtn').click(()=>{
  window.history.back();
});

async function getEthPrice(){
  let ethPrice = BASE_URL + ETH_USD_PRICE_URL;
  const response = await fetch(ethPrice);
  const data = await response.json();
  let usdEthPrice = data.ethereum.usd;
  return usdEthPrice;
};

$(function () {
  $('[data-toggle="tooltip"]').tooltip()
})

async function readURL(input) {
  if (input.files && input.files[0]) {
    let reader = new FileReader();

    let fileType = input.files[0].type;
    let fileSize = input.files[0].size;

    if(fileSize > 64000000){
      $('#fileSizeModalBody').html('File size cannot exceed 64 MB.');
      $('#fileSizeModal').modal('show');
      $('#createButton').prop('disabled', true);
      $('#nftSizeExceededText').html('File too large, please utilize unlockable content');
      nft = '';
    }

    reader.onload = function (file) {
      if(fileType == 'image/png' || fileType == 'image/jpeg' || fileType == 'image/gif' || fileType == 'image/webp'){
        $('#nftImgEx').attr('src', file.target.result);
        if(input.files[0].size <= 3000000){
          $('#formToUploadCover').css('display', 'none');
          cover = new Moralis.File(input.files[0].name, input.files[0]);
        } else{
          $('#nftCoverEx').prop('required');
        }
      } else if (fileType == "video/mp4" || fileType == "video/webm") {
        $('#nftImgEx').css('display', 'none');
        $('#nftVidEx').css('display', 'inline-block');
        $('#nftVidEx').attr('src', file.target.result);
        $('#nftCoverEx').prop('required');
      } else if (fileType == "audio/mp3" || fileType == "audio/webm" || fileType == "audio/mpeg"){
        $('#nftImgEx').css('display', 'none');
        $('#nftAudEx').css('display', 'inline-block');
        $('#nftAudEx').attr('src', file.target.result);
        $('#nftCoverEx').prop('required');
      }
    };

    reader.readAsDataURL(input.files[0]);

    const file = input.files[0];

    const fileName = input.files[0].name;

    let extension = fileName.split('.').pop();

    const cleanedFileName = 'nft.' + extension;

    console.log(cleanedFileName);

    nft = new Moralis.File(cleanedFileName, file);
    console.log('NFT To MINT: ', nft);
  }
};


$("#nftImgFile").change(function(){
  readURL(this);
  $('.upload-button-div').css('display', 'none');
  $('#imageFileLabel').css('display', 'none');

  $('#clearFile').css('display', 'block');

  $('#formToUploadCover').css('display', 'block');
});

$('#closeIcon1').click(()=>{
  location.reload();
});

$('#closeIcon2').click(()=>{
  location.reload();
});

function coverURL(input) {
  if(input.files && input.files[0]) {
    let reader = new FileReader();

    let fileType = input.files[0].type;
    let fileSize = input.files[0].size;

    reader.onload = function (file) {
      if(fileType == 'image/png' || fileType == 'image/jpeg' || fileType == 'image/gif' || fileType == 'image/webp'){
        $('#nftCoverEx').attr('src', file.target.result);
        if(fileSize > 3000000){
          $('#fileSizeModalBody').html('File size cannot exceed 3 MB.');
          $('#fileSizeModal').modal('show');
          $('#createButton').prop('disabled', true);
          $('#fileSizeExceededText').html('File too large, please use smaller file');
          cover = '';
        }
      } else{
        $('#nftCoverEx').html('Incorrect File Format');
      }
    };

    reader.readAsDataURL(input.files[0]);

    const coverFile = input.files[0];

    const coverfileName = input.files[0].name;

    let coverExtension = coverfileName.split('.').pop();

    const cleanedCoverFileName = 'cover.' + coverExtension;

    cover = new Moralis.File(cleanedCoverFileName, coverFile);
    console.log(cover);
  }
};

$("#nftCoverFile").change(function(){
  coverURL(this);
  $('.cover-upload-button-div').css('display', 'none');
  $('#coverLabel').css('display', 'none');

  $('#clearCover').css('display', 'block');
});

$('#onSaleSwitch').click(() =>{
  if($('#onSaleSwitch').prop('checked')){
    console.log('going to marketplace');
    $('#priceInputGroup').css('display', '');
    $('#unlockableContent').css('display', '');
    $('#setApprovalBtn').css('display', 'block');
    $('#saveToIPFSBtn').prop('disabled', true);
    $('#setOffer').css('display', 'block');
    $('#salePriceInput').prop('required', true);
    checkIfApproved();
    $("#createButton").prop('disabled', true);
  } else{
    console.log('not going on sale');
    $('#priceInputGroup').css('display', 'none');
    $('#unlockableContent').css('display', 'none');
    $('#unlockableContentInputGroup').css('display', 'none');
    $('#unlockableSwitch').prop('checked', false);
    $('#unlockableContentText').val('');
    $('#salePriceInput').val('');
    $('#saleProfit').html('0 ETH');
    $('#usdProfit').html('$0.00');
    $('#setApprovalBtn').css('display', 'none');
    $('#saveToIPFSBtn').prop('disabled', false);
    $('#setOffer').css('display', 'none');
    $('#salePriceInput').prop('required', false);
    $("#createButton").prop('disabled', false);
  }
});

$('#salePriceInput').keyup(() =>{
  let price = $('#salePriceInput').val();

  let profit = price - (price * .02);
  $('#saleProfit').html(`${profit} ETH`);
  let usdProfit = (profit * ethPrice).toFixed(2);
  $('#usdProfit').html(`$${usdProfit}`);

  let reg = /^\d{0,18}(\.\d{1,15})?$/;
  price = price.replace(/^0+/, '').replace(/\.?0+$/, '');

  if(price !== '' && reg.test(price)){
    $('#createButton').prop('disabled', false);
  } else{
    $('#createButton').prop('disabled', true);
  }
});

$('#unlockableSwitch').click(() =>{
  if($('#unlockableSwitch').prop('checked')){
    console.log('unlockable content enabled');
    $('#unlockableContentInputGroup').css('display', 'block');
    $('#unlockableContentText').prop('required', true);
  } else{
    console.log('unlockable content disabled');
    $('#unlockableContentInputGroup').css('display', 'none');
    $('#unlockableContentText').val('');
    $('#unlockableContentText').prop('required', false);
  }
});

$('#royaltySlider').change(()=>{
  royalty = $('#royaltySlider').val();

  $('#royaltyAmount').html(`${royalty}%`);
  console.log(royalty/100);
});

$("form").on('submit',function(e){
  e.preventDefault();
  //disabling prevents accidental last minute changes that can mess up upload
  $('#onSaleSwitch').prop('disabled', true);

  if(nft && cover){
    $('#createModal').modal('show');
  }
});

async function checkIfApproved(){
  try{
    let approved = await openMintTokenInstance.methods.isApprovedForAll(user.attributes.ethAddress, openMintMarketplaceAddress).call();
    console.log("Approved: " + approved);

    if(approved){
      $('#setApprovalBtn').css('display', 'none');
      $('#saveToIPFSBtn').prop('disabled', false);
      $('#setOffer').prop('disabled', true);
    } else{
      $('#setApprovalBtn').css('display', 'block');
      $('#saveToIPFSBtn').prop('disabled', true);
      $('#setOffer').prop('disabled', true);
    }
  } catch(err){
    console.log(err);
  }
};

$('#setApprovalBtn').click(async() =>{
  $('#setApprovalBtn').prop('disabled', true);
  $('#setApprovalBtn').html(`Setting Approval To Sell <div class="spinner-border spinner-border-sm text-light" role="status">
                              <span class="sr-only">Loading...</span>
                            </div>`);
  await openMintTokenInstance.methods.setApprovalForAll(openMintMarketplaceAddress, true).send({from: user.attributes.ethAddress}, (err, txHash) => {
    if(err){
      alert(err.message);
      $('#setApprovalBtn').prop('disabled', false);
      $('#setApprovalBtn').html('Set Approval To Sell')
    }else{
      console.log(txHash, "Approval Successfully Granted");
      $('#saveToIPFSBtn').prop('disabled', false);
      $('#setApprovalBtn').prop('disabled', true);
      $('#setApprovalBtn').html('Approval Successfully Granted');
      $('#setApprovalBtn').removeClass('btn-primary');
      $('#setApprovalBtn').addClass('btn-success');
    }
  });
});

$('#saveToIPFSBtn').click(async ()=>{
  $('#saveToIPFSBtn').prop('disabled', true);
  $('#saveToIPFSBtn').html(`Uploading art to IPFS <div class="spinner-border spinner-border-sm text-light" role="status">
                              <span class="sr-only">Loading...</span>
                            </div>`);
  uploadArtToIPFS();
});

async function uploadArtToIPFS(){
  try{
    await nft.saveIPFS();
    console.log(nft);

    let nftPath = nft.ipfs();
    console.log(nftPath);
    uploadMetaDataToIPFS(nftPath);
} catch (err) {
    console.log(err);
    alert("Error saving art to ipfs");
    $('#saveToIPFSBtn').prop('disabled', false);
    $('#saveToIPFSBtn').html("Upload and Mint");
}
};

async function uploadMetaDataToIPFS(nftPath){
  $('#saveToIPFSBtn').html(`Uploading metadata to IPFS <div class="spinner-border spinner-border-sm text-light" role="status">
                              <span class="sr-only">Loading...</span>
                            </div>`);
  try{
    let allEmojiRegEx = /\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]/g;

    const metadata = {
      name: $('#title').val().replace(allEmojiRegEx, ''),
      description: $('#descriptionInput').val().replace(allEmojiRegEx, ''),
      image: nftPath
    }
    console.log(metadata);

    const nftMetadata = new Moralis.File("nft-metadata.json", {base64: btoa(JSON.stringify(metadata))});
    console.log(nftMetadata);

    await nftMetadata.saveIPFS();
    console.log(nftMetadata);

    let nftMetadataPath = nftMetadata.ipfs();
    console.log(nftMetadataPath);

    mint(nftMetadataPath, nftPath);
  } catch(err){
    console.log(err);
    alert("Error saving metadata to ipfs");
    $('#saveToIPFSBtn').prop('disabled', false);
    $('#saveToIPFSBtn').html("Upload and Mint");
  }
};

async function mint(nftMetadataPath, nftPath){
  $('#saveToIPFSBtn').html(`Minting artwork on blockchain <div class="spinner-border spinner-border-sm text-light" role="status">
                                                            <span class="sr-only">Loading...</span>
                                                          </div>`);
  try {
    let receipt = await openMintTokenInstance.methods.createArtwork(nftMetadataPath, royalty).send({from: user.attributes.ethAddress});
    $('#saveToIPFSBtn').prop('disabled', true);
    $('#saveToIPFSBtn').html("Successfully Minted");
    let tokenId = receipt.events.Transfer.returnValues.tokenId;
    uploadToDB(tokenId, nftMetadataPath, nftPath);
    console.log(receipt);
  } catch (err) {
    console.log(err);
    alert("Error minting token");
    $('#saveToIPFSBtn').prop('disabled', false);
    $('#saveToIPFSBtn').html("Upload and Mint");
  }
};

async function uploadToDB(tokenId, nftMetadataPath, nftPath){
  $('#saveToIPFSBtn').html(`Finishing upload to OpenMint <div class="spinner-border spinner-border-sm text-light" role="status">
                                                            <span class="sr-only">Loading...</span>
                                                          </div>`);
  try {
    let fileType = nft._source.file.type;
    await cover.save();

    const Artwork = Moralis.Object.extend("Artwork");

    const artwork = new Artwork();
    artwork.set('name', $('#title').val());
    artwork.set('description', $('#descriptionInput').val());
    artwork.set('additionalInfo', $('#additionalInfoInput').val());
    artwork.set('unlockableContent', $('#unlockableContentText').val());
    artwork.set('fileType', fileType);
    artwork.set('path', nftPath);
    artwork.set('metadataPath', nftMetadataPath);
    artwork.set('royalty', Number(royalty));
    artwork.set('cover', cover);
    artwork.set('nftId', tokenId);
    artwork.set('tokenAddress', openMintTokenAddress.toLowerCase());
    artwork.set('currentOwner', user.attributes.ethAddress);
    artwork.set('creator', user.attributes.ethAddress);
    artwork.set('active', false);
    artwork.set('likes', 0);
    await artwork.save();
    console.log(artwork);

    $('#saveToIPFSBtn').html("Successfully Minted And Uploaded");
    $('#saveToIPFSBtn').removeClass('btn-primary');
    $('#saveToIPFSBtn').addClass('btn-success');

    if($('#onSaleSwitch').prop('checked')){
      $('#setOffer').prop('disabled', false);
      setArtForSale(tokenId);
    } else{
      confetti({
        zIndex: 9999
      });
      $('#successfulText').html('<a href="http://localhost:8000/profile.html?address='+user.attributes.ethAddress+'">Click here to view.</a> <a href="erc-721.html">Or click here to make another one.</a>');
    }

  } catch (err) {
    console.log(err);
    alert("Error uploading to openmint");
    $('#saveToIPFSBtn').prop('disabled', false);
    $('#saveToIPFSBtn').html("Upload and Mint");
  }
};

function setArtForSale(tokenId){
  $('#setOffer').click(async() =>{
    let price = $('#salePriceInput').val();
    const amountInWei = web3.utils.toWei(price, 'ether');

    $('#setOffer').prop('disabled', true);
    $('#setOffer').html(`Putting On Sale <div class="spinner-border spinner-border-sm text-light" role="status">
                            <span class="sr-only">Loading...</span>
                          </div>`);
    try{
      await openMintMarketplaceInstance.methods.setOffer(amountInWei, tokenId, openMintTokenAddress).send({from: user.attributes.ethAddress});
      $('#setOffer').html('Successfully Put On Sale');
      $('#setOffer').removeClass('btn-primary');
      $('#setOffer').addClass('btn-success');
      confetti({
        zIndex: 9999
      });
      $('#successfulText').html('<a href="http://localhost:8000/profile.html?address='+user.attributes.ethAddress+'">Click here to view.</a> <a href="erc-721.html">Or click here to make another one.</a>');
    } catch(err){
      alert(err.message);
      $('#setOffer').prop('disabled', false);
      $('#setOffer').html("Put On Sale");
    }
  });
};
