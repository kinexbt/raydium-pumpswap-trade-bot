function readURL(input) {
  if (input.files && input.files[0]) {
    let reader = new FileReader();

    let fileType = input.files[0].type;

    reader.onload = function (file) {
      if(fileType == 'image/png' || fileType == 'image/jpeg' || fileType == 'image/gif' || fileType == 'image/webp'){
        $('#nftImgEx').attr('src', file.target.result);
      } else if (fileType == "video/mp4" || fileType == "video/webm") {
        $('#nftImgEx').css('display', 'none');
        $('#nftVidEx').css('display', 'inline-block');
        $('#nftVidEx').attr('src', file.target.result);
      } else if (fileType == "audio/mp3" || fileType == "audio/webm" || fileType == "audio/mpeg"){
        $('#nftImgEx').css('display', 'none');
        $('#nftAudEx').css('display', 'inline-block');
        $('#nftAudEx').attr('src', file.target.result);
      }
    };

    reader.readAsDataURL(input.files[0]);

    let file = input.files[0];

    let fileNameForPinata = input.files[0].name;

    console.log(file);
    console.log(fileNameForPinata);
  }
};

$("#nftImgFile").change(function(){
  readURL(this);
  $('.upload-button-div').css('display', 'none');
  $('#imageFileLabel').css('display', 'none');

  $('#clearFile').css('display', 'block');

  $('#formToUploadCover').css('display', 'block');
});

function coverURL(input) {
  if (input.files && input.files[0]) {
    let reader = new FileReader();

    let fileType = input.files[0].type;

    reader.onload = function (file) {
      if(fileType == 'image/png' || fileType == 'image/jpeg' || fileType == 'image/gif' || fileType == 'image/webp'){
        $('#nftCoverEx').attr('src', file.target.result);
      } else{
        $('#nftCoverEx').html('Incorrect File Format');
      }
    };

    reader.readAsDataURL(input.files[0]);

    let file = input.files[0];

    let fileNameForPinata = input.files[0].name;

    console.log(file);
    console.log(fileNameForPinata);
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
  }
})

$('#salePriceInput').keyup(() =>{
  let price = $('#salePriceInput').val();
  console.log(price);
  let profit = price - (price * .02);
  $('#saleProfit').html(`${profit} ETH`);

  //get coingecko api for price of eth to get usd profit price
  //regex for input
  //commas for numbers in profit
  //and rounding for usd
  // 1800 eth price to hold as an example for now
  let usdProfit = (profit * 1800).toFixed(2);
  $('#usdProfit').html(`$${usdProfit}`);
});

$('#unlockableSwitch').click(() =>{
  if($('#unlockableSwitch').prop('checked')){
    console.log('unlockable content enabled');
    $('#unlockableContentInputGroup').css('display', 'block');
  } else{
    console.log('unlockable content disabled');
    $('#unlockableContentInputGroup').css('display', 'none');
    $('#unlockableContentText').val('');
  }
});

function highResURL(input){
  if (input.files && input.files[0]){
    let reader = new FileReader();

    reader.readAsDataURL(input.files[0]);
    let file = input.files[0];

    let fileNameForPinata = input.files[0].name;

    console.log(file);
    console.log(fileNameForPinata);
  }
};

$('#highResFile').change(function(){
  highResURL(this);
  console.log('file loaded');

  $('#clearHighResFile').css('display', 'block');
});

$('#clearHighResFile').click(() =>{
  $('#highResFile').val('');
  console.log('cleared high res');
});


$('#royaltySlider').change(()=>{
  let royalty = $('#royaltySlider').val();
  $('#royaltyAmount').html(`${royalty}%`);
  console.log(royalty/100);
});
