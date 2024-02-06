const login_form=document.querySelector("#login_form");
const register_form=document.querySelector("#register_form");

if(register_form.addEventListener){
    register_form.addEventListener("submit", validate_form());  //Modern browsers
}else if(register_form.attachEvent){
    register_form.attachEvent('onsubmit', validate_form());            //Old IE
}

if(login_form.addEventListener){
    login_form.addEventListener("submit", validate_form());  //Modern browsers
}else if(login_form.attachEvent){
    login_form.attachEvent('onsubmit', validate_form());            //Old IE
}


function validate_form(){
    
}