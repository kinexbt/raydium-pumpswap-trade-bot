
  //setting theme changes twice so they can be seem without page reload

$(document).ready(()=>{ //doesn't work for dynamic content
  let darkmodeCookie = Cookies.get('darkmode');

  if(darkmodeCookie == 'true'){
    console.log(darkmodeCookie)
    $('#forDarkMode').css('display', 'none');
    $('#forLightMode').css('display', 'block');

    $('nav').removeClass('navbar-light bg-light');
    $('nav').addClass('navbar-dark bg-dark');

    $('.btn-light').addClass('btn-dark');
    $('.btn-light').removeClass('btn-light');

    $('.card').css({'background': '#2a2a2a', 'border': '1px solid #444'});

    $('.dropdown-menu').css('background', 'black');
    $('.dropdown-item').css('color', '#8a8a8a');

    $('footer').css({'color': '#6c757d', 'background':'#343a40'});

    $('body').css({'background': '#1f1f1f', 'color': 'white'});

    $('.form-control').css('color', 'white');

    $('.slider-title').css('color', 'white');

    $('.social-tag').css('color', 'white');

    $('.modal-content').css('background', '#343a40');

    $('.anchor').css('color', 'white');

    $('.spinner-grow').removeClass('text-light');
    $('.spinner-grow').addClass('text-dark');

    $('#profile').css('background', '#525a61');

    $('.description').removeClass('bg-light');
    $('.description').addClass('bg-dark');
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

    $('.form-control').css('color', 'black');

    $('.slider-title').css('color', 'black');

    $('.social-tag').css('color', 'black');

    $('.modal-content').css('background', 'white');

    $('.anchor').css('color', 'black');

    $('.spinner-grow').removeClass('text-dark');
    $('.spinner-grow').addClass('text-light');

    $('#profile').css('background', '#e3e6ea');

    $('.description').removeClass('bg-dark');
    $('.description').addClass('bg-light');

    console.log('lightmode cookie');
  }
})

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
    $('.dropdown-item').css('color', '#8a8a8a');

    $('footer').css({'color': '#6c757d', 'background':'#343a40'});

    $('body').css({'background': '#1f1f1f', 'color': 'white'});

    $('.form-control').css('color', 'white');

    $('.slider-title').css('color', 'white');

    $('.social-tag').css('color', 'white');

    $('.modal-content').css('background', '#343a40');

    $('.anchor').css('color', 'white');

    $('.spinner-grow').removeClass('text-light');
    $('.spinner-grow').addClass('text-dark');

    $('#profile').css('background', '#525a61');

    $('.description').removeClass('bg-light');
    $('.description').addClass('bg-dark');

    $('.form-control').keydown(()=>{
      $('.form-control').css('color', 'white');
    });
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

    $('.form-control').css('color', 'black');

    $('.slider-title').css('color', 'black');

    $('.social-tag').css('color', 'black');

    $('.modal-content').css('background', 'white');

    $('.anchor').css('color', 'black');

    $('.spinner-grow').removeClass('text-dark');
    $('.spinner-grow').addClass('text-light');

    $('#profile').css('background', '#e3e6ea');

    $('.description').removeClass('bg-dark');
    $('.description').addClass('bg-light');

    $('.form-control').keydown(()=>{
      $('.form-control').css('color', 'black');
    });
  });
