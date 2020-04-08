//#region get cats
/*
api: {
    get /api/cats
}
body: {}
params: {}
qstring: {
    [all] => optional => bool => [true => override all query strings and get all cats],
    [startId] => optional => string => [null => start from first id] or [string => start from this id]
    [limit] => optional => number => [count of results - default = 10]
}
return: {
    array of cats
}
*/
//#endregion


//#region add cat
/*
api: {
    post /api/cats/add
}
body: {
    [profitPercentage] => optional => number => [profitPercentage from the country on products of this cat default zero],
    [isNeglected] => optional => bool => [is this cat deleted => default false],
    [nameAr] => required => string => [arabic name],
    [nameEn] => required => string => [english name],
    [avatar] => required => file => [image file],
    [icon] => required => file => [image file],
    [parent] => required => string => [id of cat parent],
    [type] => required => string => enum: ['vendor', 'productiveFamily', 'admin'],
}
params: {}
qstring: {}
return: {
    object of new cat
}
*/
//#endregion