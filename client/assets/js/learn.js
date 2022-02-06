const appId = ""; // Application id from moralis.io
const serverUrl = ''; //Server url from moralis.io
Moralis.start({ serverUrl, appId });


const user = Moralis.User.current();
