$(document).ready(() =>{

  //setting theme changes twice so they can be seem without page reload
  //keep doc.ready or else cookie.js wont work
  $('#forDarkMode').click(() => {
    Cookies.set('darkmode', 'true');

    $('#forDarkMode').css('display', 'none');
    $('#forLightMode').css('display', 'block');

    $('nav').removeClass('navbar-light bg-light');
    $('nav').addClass('navbar-dark bg-dark');

    $('.btn-light').addClass('btn-dark');
    $('.btn-light').removeClass('btn-light');

    $('.card').css({'background': '#2a2a2a', 'border': '1px solid #444'});

    $('.dropdown-menu').css('background', 'black');
    $('.dropdown-item').css('color', 'white');

    $('footer').css({'color': '#6c757d', 'background':'#343a40'});

    $('body').css({'background': 'black', 'color': 'white'});

    $('.slider-title').css('color', 'white');

    $('.social-tag').css('color', 'white');
  });

  $('#forLightMode').click(() => {
    Cookies.set('darkmode', 'false');

    $('#forDarkMode').css('display', 'block');
    $('#forLightMode').css('display', 'none');

    $('nav').removeClass('navbar-dark bg-dark');
    $('nav').addClass('navbar-light bg-light');

    $('.btn-dark').addClass('btn-light');
    $('.btn-dark').removeClass('btn-dark');

    $('.card').css({'background': 'white', 'border': '1px solid #ddd'});

    $('.dropdown-menu').css('background', 'white');
    $('.dropdown-item').css('color', 'black');

    $('footer').css({'color': '#444', 'background': '#F8F8F8'});

    $('body').css({'background': 'white', 'color': 'black'});

    $('.slider-title').css('color', 'black');

    $('.social-tag').css('color', 'black');
  });

  let darkmodeCookie = Cookies.get('darkmode');

  if(darkmodeCookie == 'true'){
    $('#forDarkMode').css('display', 'none');
    $('#forLightMode').css('display', 'block');

    $('nav').removeClass('navbar-light bg-light');
    $('nav').addClass('navbar-dark bg-dark');

    $('.btn-light').addClass('btn-dark');
    $('.btn-light').removeClass('btn-light');

    $('.card').css({'background': '#2a2a2a', 'border': '1px solid #444'});

    $('.dropdown-menu').css('background', 'black');
    $('.dropdown-item').css('color', 'white');

    $('footer').css({'color': '#6c757d', 'background':'#343a40'});

    $('body').css({'background': 'black', 'color': 'white'});

    $('.slider-title').css('color', 'white');

    $('.social-tag').css('color', 'white');
    console.log('darkmode cookie');

  } else if (darkmodeCookie == 'false') {
    $('#forDarkMode').css('display', 'block');
    $('#forLightMode').css('display', 'none');

    $('nav').removeClass('navbar-dark bg-dark');
    $('nav').addClass('navbar-light bg-light');

    $('.btn-dark').addClass('btn-light');
    $('.btn-dark').removeClass('btn-dark');

    $('.card').css({'background': 'white', 'border': '1px solid #ddd'});

    $('.dropdown-menu').css('background', 'white');
    $('.dropdown-item').css('color', 'black');

    $('footer').css({'color': '#444', 'background': '#F8F8F8'});

    $('body').css({'background': 'white', 'color': 'black'});

    $('.slider-title').css('color', 'black');

    $('.social-tag').css('color', 'black');
    console.log('lightmode cookie');
  }

});
