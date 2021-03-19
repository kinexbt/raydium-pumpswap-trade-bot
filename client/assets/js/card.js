$('.like-button').click(() =>{
  if($('.heart').hasClass('far')){
    $('.heart').removeClass('far');
    $('.heart').addClass('fas');
    $('.like-counter').html((i, val) => { return + val+1 });
  } else{
    $('.heart').removeClass('fas');
    $('.heart').addClass('far');
    $('.like-counter').html((i, val) => { return + val-1 });
  }
});

//only using a class because IDs arent generated yet
$('.mint-this').click(() =>{
  $(".fa-concierge-bell").css('color', '#ffea00');
})
