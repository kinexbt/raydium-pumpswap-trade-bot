$('#searchBtn').click(()=>{
  $('.navbar-toggler').css('display', 'none');
  $('.collapse').removeClass('show');
  $('.navbar-brand').css('display', 'none');
  $('#searchBtn').css('display', 'none');
  $('.searchbar').css('display', 'flex');
  $('#exitSearchBtn').css('display', 'block');
  $('.navbar').css('justify-content', 'space-around');

});

$('#exitSearchBtn').click(()=>{
  $('.navbar-toggler').css('display', 'flex');
  $('.navbar-brand').css('display', 'flex');
  $('#searchBtn').css('display', 'inline-block');
  $('.searchbar').css('display', 'none');
  $('#exitSearchBtn').css('display', 'none');
  $('.navbar').css('justify-content', 'space-between');
});

$('#searchInput').on('keyup',(e)=>{
  let input = $('#searchInput').val();
  let inputCheck = $('#searchInput').val().replace(/\s/g, '');
  $('#searchInput').tooltip('hide');
  if(e.which == 13  && inputCheck !== ''){
    window.location.assign(`http://localhost:8000/search.html?query=${input}`);
  } else if(e.which == 13  && inputCheck == ''){
    $('#searchInput').prop('data-toggle', 'tooltip');
    $('#searchInput').prop('data-placement', 'bottom');
    $('#searchInput').prop('title', 'Oops, search left blank');
    $('#searchInput').tooltip('show');
    $('#searchInput').hover(()=>{
      $('#searchInput').tooltip('hide');
    })
  }
})
