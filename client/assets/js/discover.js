$('#all').click(() => {
  $('#forSale').removeClass('btn-dark');
  $('#notForSale').removeClass('btn-dark');

  $('#all').addClass('btn-dark');

});

$('#forSale').click(() => {
  $('#all').removeClass('btn-dark');
  $('#notForSale').removeClass('btn-dark');

  $('#forSale').addClass('btn-dark');
  //check to see how the grid can be updated
  // $('.not-for-sale').css('display', 'none');

});

$('#notForSale').click(() => {
  $('#all').removeClass('btn-dark');
  $('#forSale').removeClass('btn-dark');

  $('#notForSale').addClass('btn-dark');
});
