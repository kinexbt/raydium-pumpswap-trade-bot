Moralis.initialize(""); // Application id from moralis.io
Moralis.serverURL = ''; //Server url from moralis.io

let user = Moralis.User.current();

$('#singleButton').click(() =>{
  window.location.href='erc-721.html';
});

$('#multipleButton').click(() =>{
  // window.location.href='erc-1155.html';
});
