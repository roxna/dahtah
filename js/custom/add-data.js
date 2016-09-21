$(document).ready(function() {

  var DATABASE = firebase.database();  

  /*-----------------------------------------------------------------------
  FIREBASE PULL DATA / SET UP DATA LISTS
  -----------------------------------------------------------------------*/

 // Populates the datalist on 'Add Record' and 'Add User' (admin) with PHARMACY names
  DATABASE.ref('/pharmacies').once('value').then(function(snapshot) {    
    snapshot.forEach(function(childSnapshot){
      $('#pharmacy-name').append(
        "<option value='" + childSnapshot.val().name + "'></option>");
      // "<option data-key='" + childSnapshot.key + "' value='" + childSnapshot.val().name + "'>" + childSnapshot.val().name + "</option>");
      })      
  }, function(error){
    console.log(error);
  });

  var specializations = ['Anaesthesia', 'Dermatology', 'Emergency medicine', 'General practice',
  'Intensive care', 'OBGyn', 'Opthalmology', 'Pediatrics', 'Pathology', 'Psychiatry', 'Radiation oncology', 
  'Radiology', 'Sexual health medicine', 'Surgery'];
  for (var i=0; i< specializations.length; i++){
    $('#txtDoctorSpecialization').append(
        "<option value='" + specializations[i] + "'></option>"
    );
  }

  /******
  MANAGE AUTH STATE
  *******/
  firebase.auth().onAuthStateChanged(function(user) {
    var userType;
    DATABASE.ref('/users/'+encodeKey(user.email)).once('value').then(function(snapshot){
      userType = snapshot.val().type;
    }).then(function(){
      if (userType == "admin") {
        $('#private_container').show();
      } else {
        showErrorNotification('Bummer. You can not access this page');
        $('#private_container').hide();
        window.location.href = "index.html";
      }
    })
  });

  
  /*-----------------------------------------------------------------------
  MANAGE FORMS ENTRY & SUBMISSION ON THE ADD_DATA PAGE
  -----------------------------------------------------------------------*/
  // ADD USER INFORMATION
  $('#btnAddUser').click(function(){
    var email = $('#txtUserEmail').val();
    var password = $('#txtUserPassword').val();
    var username = $('#txtUserName').val();
    var type = $('#txtUserType').val();
    var first_name = $('#txtUserFName').val();
    var last_name = $('#txtUserLName').val();
    var pharmacy = $('#txtUserPharmacy').val();    
    var zip = "00000";

    if(!checkValidEntries([email, password, username, type, first_name, last_name, pharmacy], email)){
      return;
    }
    getValues(email, password, username, type, first_name, last_name, pharmacy, addUser); 
  });

  function getValues(email, password, username, type, first_name, last_name, pharmacy, callback){
    if(type == "admin"){
      pharmacy = 'n/a';
      if (typeof(callback) === "function") {
        callback(email, password, username, type, first_name, last_name, pharmacy, zip);
      }
    }

    else if(type.includes("pharmacy")){      
      DATABASE.ref('/pharmacies/'+pharmacy).once('value').then(function(snapshot){
        zip = snapshot.val().zip;      
      })
      .then(function(){
        if (typeof(callback) === "function") {
          callback(email, password, username, type, first_name, last_name, pharmacy, zip);
        }
      });
    } 
  }

  function addUser(email, password, username, type, first_name, last_name, pharmacy, zip){
    try{
      createUser(email, password, username, type);
      updateUserRecord(email, password, username, type, first_name, last_name, pharmacy, zip);
      if(type == "pharmacy"){         
        DATABASE.ref('/pharmacies/' + pharmacy + '/users/').set(encodeKey(email));
      }
      showSuccessNotification("User added", true);
    }catch(error) {
      showErrorNotification(error.message);
      $('#txtUserPassword').val('');              
    }
  }

  function createUser(email, password, username, type){
    firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(function() {
      user = firebase.auth().currentUser;
      // user.sendEmailVerification();
    })
    .catch(function(error) {
        console.log(error.message);
    });    
  }

  function updateUserRecord(email, password, username, type, first_name, last_name, pharmacy, zip){
    var userData = {
      username: username,
      type: type,
      first_name: first_name,
      last_name: last_name,
      pharmacy: pharmacy,
      zip: zip,    
      _updated: firebase.database.ServerValue.TIMESTAMP
    };
    var userEmailEncoded = encodeKey(email);
    console.log(userEmailEncoded, userData);
    DATABASE.ref('/users/' + userEmailEncoded).set(userData);
  }


  // ADD PHARMACY INFORMATION
  $('#btnAddPharmacy').click(function(){
    var name = $('#txtPharmacyName').val();
    var address1 = $('#txtPharmacyAdd1').val();
    var address2 = $('#txtPharmacyAdd2').val();
    var city = $('#txtPharmacyCity').val();
    var zip = $('#txtPharmacyZip').val();
    var country = $('#txtPharmacyCountry').val() ? null : "India";
    var email = $('#txtPharmacyEmail').val();
    var phone = $('#txtPharmacyPhone').val();

    if(!checkValidEntries([name, address1, address2, city, zip, country, email, phone], email)){
      return;
    }

    try{
      var pharmacyData = {
        name: name, 
        address1: address1,
        address2: address2,
        city: city,
        zip: zip,
        country: country,
        email: email,
        phone: phone,
        _updated: firebase.database.ServerValue.TIMESTAMP,
      };

      // Check that no other pharmacy has the same email name
      // If yes - 
      // If no - add the pharmacy's info to DOCTORS list
      //       - add the pharmacy's encoded email to specializations, cities, zip lists
      DATABASE.ref('/pharmacies').once("value").then(function(snapshot){
        console.log(snapshot);
        if (snapshot.child(name).exists()){
          showErrorNotification("Sorry - this pharmacy name is already in use by another pharmacy.");
        }else{
          DATABASE.ref().child('pharmacies/' + name).set(pharmacyData);

          var commonData = {};
          commonData[name] = true;
          DATABASE.ref('/cities/' + city + '/pharmacies/').set(commonData);
          DATABASE.ref('/zips/' + zip + '/pharmacies/').set(commonData);
          showSuccessNotification("Pharmacy added", true);    
        }        
      });
    }catch(error){
      showErrorNotification(error.message);
    }
  });

  // ADD DOCTOR INFORMATION
  $('#btnAddDoctor').click(function(){
    var fname = $('#txtDoctorFName').val();
    var lname = $('#txtDoctorLName').val();
    var specialization = $("input[name=doctorSpecialization]").val();
    var address1 = $('#txtDoctorAdd1').val();
    var address2 = $('#txtDoctorAdd2').val();
    var city = $('#txtDoctorCity').val();
    var zip = $('#txtDoctorZip').val();
    var country = $('#txtDoctorCountry').val() ? null : "India";
    var email = $('#txtDoctorEmail').val();
    var phone = $('#txtDoctorPhone').val();

    if(!checkValidEntries([fname, lname, specialization, address1, address2, city, zip, country, email, phone], email)){
      return;
    }

    try{
      var doctorData = {        
        fname: fname,
        lname: lname,
        specialization: specialization,
        address1: address1,
        address2: address2,    
        city: city,
        zip: zip,
        country: country,
        email: email,
        phone: phone,
        _updated: firebase.database.ServerValue.TIMESTAMP,
      };
      var doctorEmailEncoded = encodeKey(email);

      /* Check that no other doctor has the same email address
         If ok - add the doctor's info to DOCTORS list
               - add the doctor's encoded email to specializations, cities, zip lists  */
      DATABASE.ref('/doctors').once("value").then(function(snapshot){
        console.log(snapshot);
        if (snapshot.child(doctorEmailEncoded).exists()){
          showErrorNotification("Sorry - this email is already in use by another doctor.");
        }else{
          DATABASE.ref().child('doctors/' + doctorEmailEncoded).set(doctorData);

          var commonData = {};
          commonData[doctorEmailEncoded] = true;
          DATABASE.ref('/specializations/' + specialization).set(commonData);
          DATABASE.ref('/cities/' + city + '/doctors/').set(commonData);
          DATABASE.ref('/zips/' + zip + '/doctors/').set(commonData);
          showSuccessNotification("Doctor added", true);    
        }        
      });   
    }catch(error){
      showErrorNotification(error.message);
    }
  });


});