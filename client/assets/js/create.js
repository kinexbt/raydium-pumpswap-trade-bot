Moralis.initialize("SIPW4jCaU0ViJhBqKyPnaBt7LnO1g9M5gIWkLcUy"); // Application id from moralis.io
Moralis.serverURL = 'https://lxsxj1tvocfd.moralis.io:2053/server'; //Server url from moralis.io

let user = Moralis.User.current();

$('#singleButton').click(() =>{
  window.location.href='erc-721.html';
});

$('#multipleButton').click(() =>{
  // window.location.href='erc-1155.html';
});
