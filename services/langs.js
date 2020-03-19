//
// "welcome $$0": {
//     ar: "اهلا بك يا $$0",
//     en: "welcome $$0"
// },

let dictionary = {
    "access denied !": {
        ar: "لا تمتلك صلاحية الدخول !",
        en: "access denied !"
    },
};


var langType = 'en';

function lang(newLangType) {
    langType = newLangType;
}
function translate(message){

    let returnMessage = "";

    returnMessage = (dictionary[message] && dictionary[message][langType])?
     dictionary[message][langType]:
     message;
    
    Object.values(arguments).forEach(function(arg, ind) {
        if(ind>0)
            returnMessage = returnMessage.replace("$$" + (ind - 1), arg);
    });
    return returnMessage;
}
function langTranslate(lang, message){
    
        let returnMessage = "";
    
        returnMessage = (dictionary[message] && dictionary[message][lang])?
        dictionary[message][lang]:
        message;
        
        Object.values(arguments).forEach(function(arg, ind) {
            if(ind>1)
                returnMessage = returnMessage.replace("$$" + (ind - 2), arg);
        });
        return returnMessage;
}


exports.t = translate;
exports.t2 = langTranslate;
exports.lang = lang;
