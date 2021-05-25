Moralis.initialize(""); // Application id from moralis.io
Moralis.serverURL = ''; //Server url from moralis.io

const user = Moralis.User.current();
let profilePhotoFile;

console.log(user);

$(document).ready(()=>{
  photoDefault()
  username();
  bio();
  instagram();
  twitter();
  getAllUsernames();
});

if(user == null){
  $('#profilePhotoInput').prop('disabled', true);
  $('#username').prop('disabled', true);
  $('#bio').prop('disabled', true);
  $('#instagram').prop('disabled', true);
  $('#twitter').prop('disabled', true);
  $('#saveProfileInfoBtn').prop('disabled', true);
};

function photoDefault(){
  if(!user.attributes.profilePhoto){
    $('#profilePhoto').attr('src', './assets/images-icons/default.png');
  } else{
    $('#profilePhoto').attr('src', user.attributes.profilePhoto._url);
  }
};

function username(){
  $('#username').val(user.attributes.username);
  let maxLength = 50;
  let length = $('#username').val().length;
  let newUsername = $('#username').val();
  length = maxLength - length;
  $('#usernameCharsRemaining').html(length + '&nbsp');
};

function bio(){
  $('#bio').val(user.attributes.bio);
  let maxLength = 280;
  let length = $('#bio').val().length;
  length = maxLength - length;
  $('#charsRemaining').html(length + '&nbsp');
};

function instagram(){
  $('#instagram').val(user.attributes.instagram);
};

function twitter(){
  $('#twitter').val(user.attributes.twitter);
};

function profilePhoto(input) {
  if (input.files && input.files[0]) {
    let reader = new FileReader();

    let fileType = input.files[0].type;
    let fileSize = input.files[0].size;
    let fileSizeMB = Math.round((fileSize / 1024))/1024;
    if(fileSizeMB > 3){
      $('#fileSizeModal').modal('show');
      $("#profilePhotoInput").val('');
    } else{
      reader.onload = function (file) {
        if(fileType == 'image/png' || fileType == 'image/jpeg' || fileType == 'image/gif' || fileType == 'image/webp'){
          $('#profilePhoto').attr('src', file.target.result);
        } else{
          $('#profilePhoto').html('Incorrect File Format');
        }
      };

      reader.readAsDataURL(input.files[0]);

      let file = input.files[0];

      let fileName = input.files[0].name;

      profilePhotoFile = new Moralis.File(fileName, file);
      console.log(profilePhotoFile);
    }
  }
};

$("#profilePhotoInput").change(function(){
  profilePhoto(this);
});

function clearMessage(){
  $('#saveMessage').html('');
}

$('#saveProfileInfoBtn').click(async ()=>{
  try {
    if($('#profilePhotoInput').val()){
      let reg = new RegExp(profilePhotoFile._name);
      if(!user.attributes.profilePhoto || !reg.test(user.attributes.profilePhoto._name)){saveProfilePhoto();}
    }
    if($('#username').val() && $('#username').val() !== user.attributes.username){saveUsername();}
    if($('#bio').val() && $('#bio').val() !== user.attributes.bio){saveBio();}
    if($('#instagram').val() && $('#instagram').val() !== user.attributes.instagram){saveInstagram();}
    if($('#twitter').val() && $('#twitter').val() !== user.attributes.twitter){saveTwitter();}
  } catch (err) {
    console.log(err)
    $('#saveMessage').removeClass('text-success');
    $('#saveMessage').addClass('text-danger');
    $('#saveMessage').html("Something went wrong!");
    $('#saveProfileInfoBtn').prop('disabled', false);
    $('#saveProfileInfoBtn').html('Save');
  }
});

async function saveProfilePhoto(){
  $('#saveProfileInfoBtn').prop('disabled', true);
  $('#saveProfileInfoBtn').html(`Saving Profile Photo <div class="spinner-border spinner-border-sm text-light" role="status">
                                            <span class="sr-only">Loading...</span>
                                          </div>`);
  user.set("profilePhoto", profilePhotoFile);
  try{
    await user.save();
    $('#profilePhotoInNav').attr('src', user.attributes.profilePhoto._url);
    $('#saveMessage').removeClass('text-danger');
    $('#saveMessage').addClass('text-success');
    $('#saveMessage').html(`Profile Photo Updated <i class="fas fa-check"></i>`);
    $('#saveProfileInfoBtn').html("Save");
    $('#saveProfileInfoBtn').prop('disabled', false);
    console.log("profilePhoto saved");
    setTimeout("clearMessage()", 5000);
  } catch (error){
    console.log(error);
    $('#saveMessage').removeClass('text-success');
    $('#saveMessage').addClass('text-danger');
    $('#saveMessage').html("Something went wrong saving your profile photo");
    setTimeout("clearMessage()", 5000);
    $('#saveProfileInfoBtn').html("Try Again");
    $('#saveProfileInfoBtn').prop('disabled', false);
    $('#saveProfileInfoBtn').click(async ()=>{
      saveProfilePhoto();
    });
  }
};

async function saveUsername(){
  if($('#username').val() !== ''){
    $('#saveProfileInfoBtn').prop('disabled', true);
    $('#saveProfileInfoBtn').html(`Saving Username <div class="spinner-border spinner-border-sm text-light" role="status">
                                              <span class="sr-only">Loading...</span>
                                            </div>`);
    let username = $('#username').val();
    user.set("username", username);
    try{
      await user.save();
      $('#saveMessage').removeClass('text-danger');
      $('#saveMessage').addClass('text-success');
      $('#saveMessage').html(`Username Updated <i class="fas fa-check"></i>`);
      console.log("username saved");
      $('#usernameExistsCheck').html('');
      $('#saveProfileInfoBtn').html("Save");
      $('#saveProfileInfoBtn').prop('disabled', false);
      setTimeout("clearMessage()", 5000);
    } catch (error){
      console.log(error);
      $('#saveMessage').removeClass('text-success');
      $('#saveMessage').addClass('text-danger');
      $('#usernameExistsCheck').html(error.message);
      setTimeout("clearMessage()", 5000);
      $('#saveProfileInfoBtn').html("Try Again");
      $('#saveProfileInfoBtn').prop('disabled', false);
      $('#saveProfileInfoBtn').click(async ()=>{
        saveUsername();
      });
    }
  } else{
    $('#saveMessage').removeClass('text-success');
    $('#saveMessage').addClass('text-danger');
    $('#saveMessage').html("Username cannot be left blank");
  }
};

async function getAllUsernames(){
  let allUsernamesArray = [];
  try{
    let users = await Moralis.Cloud.run('getAllUsers');
    for (i = 0; i < users.length; i++) {
      let allUsernames = users[i].username.replace(/\s/g, '');
      allUsernamesArray.push(allUsernames.toLowerCase());
    }
    checkUsername(...allUsernamesArray);
  } catch(err){
    console.log(err);
  }
};

function checkUsername(...allUsernamesArray){
  $('#username').on('keyup', ()=> {
    let maxLength = 50;
    let length = $('#username').val().length;
    let newUsername = $('#username').val().replace(/\s/g, '').toLowerCase();
    length = maxLength - length;
    $('#usernameCharsRemaining').html(length + '&nbsp');

    let currentName = user.attributes.username.replace(/\s/g, '').toLowerCase();

    let nameExistsAlready = allUsernamesArray.includes(newUsername);

    if(newUsername == ''){
      $('#usernameExistsCheck').removeClass('text-success');
      $('#usernameExistsCheck').addClass('text-danger');
      $('#usernameExistsCheck').html('Username cannot be left blank!');
    } else if(newUsername == currentName){
      $('#usernameExistsCheck').removeClass('text-success');
      $('#usernameExistsCheck').addClass('text-danger');
      $('#usernameExistsCheck').html('This your current username!');
    } else if(nameExistsAlready) {
      $('#usernameExistsCheck').removeClass('text-success');
      $('#usernameExistsCheck').addClass('text-danger');
      $('#usernameExistsCheck').html('This username already exists!');
    } else{
      $('#usernameExistsCheck').html('');
    }
  });
};

async function saveBio(){
  $('#saveProfileInfoBtn').prop('disabled', true);
  $('#saveProfileInfoBtn').html(`Saving Bio <div class="spinner-border spinner-border-sm text-light" role="status">
                                            <span class="sr-only">Loading...</span>
                                          </div>`);
  let bio = $('#bio').val();
  user.set("bio", bio);
  try{
    await user.save();
    $('#saveMessage').removeClass('text-danger');
    $('#saveMessage').addClass('text-success');
    $('#saveMessage').html(`Bio Updated <i class="fas fa-check"></i>`);
    console.log("bio saved");
    $('#saveProfileInfoBtn').html("Save");
    $('#saveProfileInfoBtn').prop('disabled', false);
    setTimeout("clearMessage()", 5000);
  } catch (error){
    console.log(error);
    $('#saveMessage').removeClass('text-success');
    $('#saveMessage').addClass('text-danger');
    $('#saveMessage').html("Something went wrong saving your bio");
    setTimeout("clearMessage()", 5000);
    $('#saveProfileInfoBtn').html("Try Again");
    $('#saveProfileInfoBtn').prop('disabled', false);
    $('#saveProfileInfoBtn').click(async ()=>{
      saveBio();
    });
  }
};

$('#bio').keyup(()=> {
  let maxLength = 280;
  let length = $('#bio').val().length;
  length = maxLength - length;
  $('#charsRemaining').html(length + '&nbsp');
});

async function saveInstagram(){
  $('#saveProfileInfoBtn').prop('disabled', true);
  $('#saveProfileInfoBtn').html(`Saving Instagram <div class="spinner-border spinner-border-sm text-light" role="status">
                                            <span class="sr-only">Loading...</span>
                                          </div>`);
  let instagram = $('#instagram').val();
  user.set("instagram", instagram);
  try{
    await user.save();
    $('#saveMessage').removeClass('text-danger');
    $('#saveMessage').addClass('text-success');
    $('#saveMessage').html(`Instagram Updated <i class="fas fa-check"></i>`);
    console.log("instagram saved");
    $('#saveProfileInfoBtn').html("Save");
    $('#saveProfileInfoBtn').prop('disabled', false);
    setTimeout("clearMessage()", 5000);
  } catch (error){
    console.log(error);
    $('#saveMessage').removeClass('text-success');
    $('#saveMessage').addClass('text-danger');
    $('#saveMessage').html("Something went wrong saving your instagram");
    setTimeout("clearMessage()", 5000);
    $('#saveProfileInfoBtn').html("Try Again");
    $('#saveProfileInfoBtn').prop('disabled', false);
    $('#saveProfileInfoBtn').click(async ()=>{
      saveInstagram();
    });
  }
};

//makes sure you can't press spacebar
$('#instagram').on('keypress', (e)=> {
  if (e.which == 32){
    return false;
  }
});

async function saveTwitter(){
  $('#saveProfileInfoBtn').prop('disabled', true);
  $('#saveProfileInfoBtn').html(`Saving Twitter <div class="spinner-border spinner-border-sm text-light" role="status">
                                            <span class="sr-only">Loading...</span>
                                          </div>`);
  let twitter = $('#twitter').val();
  user.set("twitter", twitter);
  try{
    await user.save();
    $('#saveMessage').removeClass('text-danger');
    $('#saveMessage').addClass('text-success');
    $('#saveMessage').html(`Twitter Updated <i class="fas fa-check"></i>`)
    console.log("twitter saved");
    $('#saveProfileInfoBtn').html("Save");
    $('#saveProfileInfoBtn').prop('disabled', false);
    setTimeout("clearMessage()", 5000);
  } catch (error){
    console.log(error);
    $('#saveMessage').removeClass('text-success');
    $('#saveMessage').addClass('text-danger');
    $('#saveMessage').html("Something went wrong saving your twitter");
    setTimeout("clearMessage()", 5000);
    $('#saveProfileInfoBtn').html("Try Again");
    $('#saveProfileInfoBtn').prop('disabled', false);
    $('#saveProfileInfoBtn').click(async ()=>{
      saveTwitter();
    });
  }
};

//makes sure you can't press spacebar
$('#twitter').on('keypress', (e)=> {
  if (e.which == 32){
    return false;
  }
});
