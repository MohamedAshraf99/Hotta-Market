//#region get favouriteProducts of specific user
/*
api: {
    get /api/favouriteProducts
}
body: {}
params: {}
qstring: {
    [user] => required => string => [owner of these favouriteProducts],
}
return: {
    array of Products
}
*/
//#endregion


//#region toggle favourite Product :: add or remove favourite product to a user
/*
api: {
    post /api/favouriteProducts/toggle/:product
}
body: {}
params: {
    [product] => required => string => [id of the favourite Product],
}
qstring: {}
return: {
    if no product it create one then return it
    else return empty object
}
*/
//#endregion


//#region addFavouriteProduct :: add a new favourite product to a user
/*
api: {
    post /api/favouriteProducts/addFavouriteProduct/:product
}
body: {}
params: {
    [product] => required => string => [id of the favourite Product],
}
qstring: {}
return: {
    object of the new product
}
*/
//#endregion


