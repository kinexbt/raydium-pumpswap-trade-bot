Moralis.Cloud.define("getCurrentOwner", async (request) => {
  const query = new Moralis.Query("Artwork");
  const queryResults = await query.find();
  const results = [];
  for (let i = 0; i < queryResults.length; ++i) {
    results.push({
      "owner": queryResults[i].attributes.currentOwner,
      "tokenId": queryResults[i].attributes.nftId,
      "tokenAddress": queryResults[i].attributes.tokenAddress
    });
  }
  return results;
});

Moralis.Cloud.define("getArtwork", async (request) => {
  const query = new Moralis.Query("Artwork");
  const queryResults = await query.find();
  const results = [];

  for (let i = 0; i < queryResults.length; ++i) {
    results.push({
      "cover": queryResults[i].attributes.cover,
      "path": queryResults[i].attributes.path,
      "tokenId": queryResults[i].attributes.nftId,
      "tokenAddress": queryResults[i].attributes.tokenAddress,
      "name": queryResults[i].attributes.name,
      "description": queryResults[i].attributes.description,
      "additionalInfo": queryResults[i].attributes.additionalInfo,
      "unlockableContent": queryResults[i].attributes.unlockableContent,
      "creator": queryResults[i].attributes.creator,
      "fileType": queryResults[i].attributes.fileType,
      "royalty": queryResults[i].attributes.royalty,
      "active": queryResults[i].attributes.active,
      "likes": queryResults[i].attributes.likes,
      "currentOwner": queryResults[i].attributes.currentOwner,
      "likers": queryResults[i].attributes.likers,
      "encouragements": queryResults[i].attributes.encouragements,
      "encouragers": queryResults[i].attributes.encouragers
    });
  }
  return results;
});

Moralis.Cloud.define("getAllUsers", async (request) => {
  const query = new Moralis.Query("User");
  const queryResults = await query.find({useMasterKey: true})
  const results = [];

  for (let i = 0; i < queryResults.length; ++i) {
    results.push({
      "profilePhoto": queryResults[i].attributes.profilePhoto,
      "username": queryResults[i].attributes.username,
      "ethAddress": queryResults[i].attributes.ethAddress,
      "bio": queryResults[i].attributes.bio,
      "twitter": queryResults[i].attributes.twitter,
	    "instagram": queryResults[i].attributes.instagram,
      "amountSold": queryResults[i].attributes.amountSold
    });
  }
  return results;
});

Moralis.Cloud.beforeSave("ArtworkForSale", async (request) => {
  const query = new Moralis.Query("Artwork");
  query.equalTo("tokenAddress", request.object.get('tokenAddress'));
  query.equalTo("nftId", request.object.get('tokenId'));
  const object = await query.first();
  if(object){
    object.set('active', true);
    object.set('encouragements', 0);
    object.unset('encouragers');
    await object.save();
    request.object.set('artwork', object);
  }
});

Moralis.Cloud.beforeSave("ArtworkSold", async (request) => {
  const query = new Moralis.Query("ArtworkForSale");
  query.equalTo("offerId", request.object.get('offerId'));
  const offer = await query.first();

  if(offer){
    request.object.set('offer', offer);
  }
});

Moralis.Cloud.afterSave("ArtworkSold", async (request) => {
  const soldQuery = new Moralis.Query("ArtworkForSale");
  soldQuery.equalTo("offerId", request.object.get('offerId'));
  const sold = await soldQuery.first();

  if(sold){
    sold.set('isSold', true);
    await sold.save();

    const artQuery = new Moralis.Query("Artwork");
    artQuery.equalTo("tokenAddress", request.object.get('tokenAddress'));
    artQuery.equalTo("nftId", request.object.get('tokenId'));
    const artwork = await artQuery.first();
    if(artwork){
      artwork.set('currentOwner', request.object.get('buyer'));
      artwork.set('active', false);
      await artwork.save();
    }
    const seller = sold.attributes.seller;
    if(seller){
      const userQuery = new Moralis.Query("User");
      userQuery.equalTo("ethAddress", seller);
      const thisSeller = await userQuery.first({useMasterKey: true});
      thisSeller.increment('amountSold');
      await thisSeller.save(null, {useMasterKey: true});
    }
  }
});

Moralis.Cloud.beforeSave("ArtworkRemoved", async (request) => {
  const query = new Moralis.Query("Artwork");
  query.equalTo("tokenAddress", request.object.get('tokenAddress'));
  query.equalTo("nftId", request.object.get('tokenId'));
  query.equalTo("active", true);
  const object = await query.first();
  if(object){
    object.set('active', false);
    await object.save();
  }
});

Moralis.Cloud.beforeSave("ArtworkPriceChanged", async (request) => {
  const query = new Moralis.Query("ArtworkForSale");
  query.equalTo("offerId", request.object.get('offerId'));
  const object = await query.first();

  if(object){
    object.set('price', request.object.get('price'));
    await object.save();
  }
});

Moralis.Cloud.afterSave("EthNFTOwners", async (request) => {
  const query = new Moralis.Query("Artwork");
  query.equalTo("tokenAddress", request.object.get('token_address'));
  query.equalTo("nftId", request.object.get('token_id'));
  const object = await query.first();

  if(object){
    object.set('currentOwner', request.object.get('owner_of'));
    await object.save();
  }
});

Moralis.Cloud.define("getOfferDetails", async (request) => {
  const query = new Moralis.Query("ArtworkForSale");
  query.select("offerId", "tokenId", "tokenAddress", "price", "isSold", "artwork.currentOwner", "artwork.creator", "artwork.cover", "artwork.name", "artwork.fileType", "artwork.likes", "artwork.active", "artwork.royalty", "artwork.unlockableContent", 'artwork.likers');
  const queryResults = await query.find({useMasterKey: true});
  const results = [];
  for (let i = 0; i < queryResults.length; ++i) {
    results.push({
      "offerId": queryResults[i].attributes.offerId,
      "tokenId": queryResults[i].attributes.tokenId,
      "tokenAddress": queryResults[i].attributes.tokenAddress,
      "price": queryResults[i].attributes.price,
      "isSold": queryResults[i].attributes.isSold,

      "owner": queryResults[i].attributes.artwork.attributes.currentOwner,
      "creator": queryResults[i].attributes.artwork.attributes.creator,
      "cover": queryResults[i].attributes.artwork.attributes.cover,
      "name": queryResults[i].attributes.artwork.attributes.name,
      "fileType": queryResults[i].attributes.artwork.attributes.fileType,
      "likes": queryResults[i].attributes.artwork.attributes.likes,
      "active": queryResults[i].attributes.artwork.attributes.active,
      "royalty": queryResults[i].attributes.artwork.attributes.royalty,
      "unlockableContent": queryResults[i].attributes.artwork.attributes.unlockableContent,
      "likers": queryResults[i].attributes.artwork.attributes.likers
    });
  }
  return results;
});

Moralis.Cloud.define("getSoldDetails", async (request) => {
  const query = new Moralis.Query("ArtworkSold");
  query.select("offerId", "tokenId", "tokenAddress", "price", "offer.isSold", "offer.artwork.currentOwner", "offer.artwork.cover", "offer.artwork.name", "offer.artwork.fileType", "offer.artwork.likes", "offer.artwork.active", "offer.artwork.unlockableContent");
  const queryResults = await query.find({useMasterKey: true});
  const results = [];

  for (let i = 0; i < queryResults.length; ++i) {
    results.push({
      "offerId": queryResults[i].attributes.offerId,
      "tokenId": queryResults[i].attributes.tokenId,
      "tokenAddress": queryResults[i].attributes.tokenAddress,
      "price": queryResults[i].attributes.price,

      "isSold": queryResults[i].attributes.offer.attributes.isSold,

      "owner": queryResults[i].attributes.offer.attributes.artwork.attributes.currentOwner,
      "cover": queryResults[i].attributes.offer.attributes.artwork.attributes.cover,
      "name": queryResults[i].attributes.offer.attributes.artwork.attributes.name,
      "fileType": queryResults[i].attributes.offer.attributes.artwork.attributes.fileType,
      "likes": queryResults[i].attributes.offer.attributes.artwork.attributes.likes,
      "active": queryResults[i].attributes.offer.attributes.artwork.attributes.active,
      "unlockableContent": queryResults[i].attributes.offer.attributes.artwork.attributes.unlockableContent
    });
  }
  return results;
});

Moralis.Cloud.define("updateAdditionalInfo", async (request) => {
  const query = new Moralis.Query("Artwork");
  query.equalTo("tokenAddress", request.params.tokenAddress);
  query.equalTo("nftId", request.params.tokenId);
  const artwork = await query.first();

  if(artwork){
    artwork.set('additionalInfo', request.params.updatedAdditionalInfo);
    await artwork.save();
  }
});

Moralis.Cloud.define("getUnlockableContent", async (request) => {
  const query = new Moralis.Query("Artwork");
  query.equalTo("currentOwner", request.params.currentOwner);
  query.equalTo("tokenAddress", request.params.tokenAddress);
  query.equalTo("nftId", request.params.tokenId);
  const artwork = await query.first();

  if(artwork){
    return artwork.get('unlockableContent');
  }
});

Moralis.Cloud.define("like", async (request) => {
  const artQuery = new Moralis.Query("Artwork");
  artQuery.equalTo("tokenAddress", request.params.tokenAddress);
  artQuery.notContainedIn("likers", [request.user.attributes.ethAddress]);
  artQuery.equalTo("nftId", request.params.tokenId);
  const artwork = await artQuery.first();
  if(artwork){
    const likerAddress = request.user.attributes.ethAddress;
    artwork.addUnique('likers', likerAddress);
    artwork.increment('likes');
    await artwork.save();
    return artwork.get('likes');
  } else {
    const query = new Moralis.Query("Artwork");
    query.equalTo("tokenAddress", request.params.tokenAddress);
    query.containedIn("likers", [request.user.attributes.ethAddress]);
    query.equalTo("nftId", request.params.tokenId);
    const unlikeArtwork = await query.first();
    if(unlikeArtwork){
      const address = request.user.attributes.ethAddress;
      unlikeArtwork.remove('likers', address);
      unlikeArtwork.decrement('likes');
      await unlikeArtwork.save();
      return unlikeArtwork.get('likes');
    }
  }
});

Moralis.Cloud.define("userLikesThisArtwork", async (request) => {
  const artQuery = new Moralis.Query("Artwork");
  artQuery.equalTo("tokenAddress", request.params.tokenAddress);
  artQuery.containedIn("likers", [request.user.attributes.ethAddress]);
  artQuery.equalTo("nftId", request.params.tokenId);
  const artwork = await artQuery.first();
  if(artwork){
    return true;
  } else{
    return false;
  }
});

Moralis.Cloud.define("encourage", async (request) => {
  const artQuery = new Moralis.Query("Artwork");
  artQuery.equalTo("tokenAddress", request.params.tokenAddress);
  artQuery.notContainedIn("encouragers", [request.user.attributes.ethAddress]);
  artQuery.equalTo("nftId", request.params.tokenId);
  artQuery.equalTo("active", false);
  const artwork = await artQuery.first();
  if(artwork){
    const encouragersAddress = request.user.attributes.ethAddress;
    artwork.addUnique('encouragers', encouragersAddress);
    artwork.increment('encouragements');
    await artwork.save();
    return artwork.get('encouragements');
  } else {
    const query = new Moralis.Query("Artwork");
    query.equalTo("tokenAddress", request.params.tokenAddress);
    query.containedIn("encouragers", [request.user.attributes.ethAddress]);
    query.equalTo("nftId", request.params.tokenId);
    const unencourageArtwork = await query.first();
    if(unencourageArtwork){
      const address = request.user.attributes.ethAddress;
      unencourageArtwork.remove('encouragers', address);
      unencourageArtwork.decrement('encouragements');
      await unencourageArtwork.save();
      return unencourageArtwork.get('encouragements');
    }
  }
});

Moralis.Cloud.define("userEncouragedThisArtwork", async (request) => {
  const artQuery = new Moralis.Query("Artwork");
  artQuery.equalTo("tokenAddress", request.params.tokenAddress);
  artQuery.containedIn("encouragers", [request.user.attributes.ethAddress]);
  artQuery.equalTo("nftId", request.params.tokenId);
  const artwork = await artQuery.first();
  if(artwork){
    return true;
  } else{
    return false;
  }
});

Moralis.Cloud.define("follow", async (request) => {
  const userQuery = new Moralis.Query(Moralis.User);
  userQuery.notContainedIn("following", [request.params.followThisAddress]);
  userQuery.equalTo("ethAddress", request.user.attributes.ethAddress);
  const follow = await userQuery.first({useMasterKey: true});
  if(follow){
    const followAddress = request.params.followThisAddress;
    follow.addUnique('following', followAddress);
    await follow.save(null, {useMasterKey: true});
    return;
  } else {
    const unfollowQuery = new Moralis.Query(Moralis.User);
    unfollowQuery.containedIn("following", [request.params.followThisAddress]);
    unfollowQuery.equalTo("ethAddress", request.user.attributes.ethAddress);
    const unfollow = await unfollowQuery.first({useMasterKey: true});
    if(unfollow){
      const unfollowAddress = request.params.followThisAddress;
      unfollow.remove('following', unfollowAddress);
      await unfollow.save(null, {useMasterKey: true});
      return;
    }
  }
});

Moralis.Cloud.define("followers", async (request) => {
  const followerQuery = new Moralis.Query(Moralis.User);
  followerQuery.equalTo("ethAddress", request.params.followThisAddress);
  followerQuery.notContainedIn("followers", [request.user.attributes.ethAddress]);
  const follower = await followerQuery.first({useMasterKey: true});
  if(follower){
    const followerAddress = request.user.attributes.ethAddress;
    follower.addUnique('followers', followerAddress);
    await follower.save(null, {useMasterKey: true});
    return;
  } else {
    const unfollowerQuery = new Moralis.Query(Moralis.User);
    unfollowerQuery.equalTo("ethAddress", request.params.followThisAddress);
    unfollowerQuery.containedIn("followers", [request.user.attributes.ethAddress]);
    const unfollower = await unfollowerQuery.first({useMasterKey: true});
    if(unfollower){
      const unfollowerAddress = request.user.attributes.ethAddress;
      unfollower.remove('followers', unfollowerAddress);
      await unfollower.save(null, {useMasterKey: true});
      return;
    }
  }
});

Moralis.Cloud.define("doesUserFollow", async (request) => {
  const query = new Moralis.Query(Moralis.User);
  query.equalTo("ethAddress", request.params.ethAddress);
  query.containedIn("followers", [request.user.attributes.ethAddress]);
  const doesFollow = await query.first({useMasterKey: true});
  if(doesFollow){
    return true;
  } else{
    return false;
  }
});

Moralis.Cloud.define("getFollowers", async (request) => {
  const query = new Moralis.Query(Moralis.User);
  query.equalTo("ethAddress", request.params.ethAddress);
  const user = await query.first({useMasterKey: true});
  if(user){
    return user.get('followers');
  }
});

Moralis.Cloud.define("getFollowing", async (request) => {
  const query = new Moralis.Query(Moralis.User);
  query.equalTo("ethAddress", request.params.ethAddress);
  const user = await query.first({useMasterKey: true});
  if(user){
    return user.get('following');
  }
});

Moralis.Cloud.define("getUser", async (request) => {
  const query = new Moralis.Query(Moralis.User);
  query.equalTo("ethAddress", request.params.ethAddress);
  const queryResults = await query.first({useMasterKey: true});
  if(queryResults){
    if(queryResults.attributes.followers == undefined){
      queryResults.set("followers", []);
      await queryResults.save(null, {useMasterKey: true});
    }
    return {
      'username': queryResults.get('username'),
      'ethAddress': queryResults.get('ethAddress'),
      'profilePhoto': queryResults.get('profilePhoto'),
      'amountOfFollowers': queryResults.get('followers').length,
      'amountSold': queryResults.get('amountSold')
    }
  }
});

Moralis.Cloud.define("isAddressInDatabase", async (request) => {
  const query = new Moralis.Query(Moralis.User);
  query.equalTo("ethAddress", request.params.ethAddress);
  const queryResults = await query.first({useMasterKey: true});
  if(queryResults){
    return true;
  }
});
