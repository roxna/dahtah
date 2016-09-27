$(document).ready(function() {
  
  var DATABASE = firebase.database();
  
  /*-----------------------------------------------------------------------
  FIREBASE PULL DATA / SET UP DATA LISTS
  -----------------------------------------------------------------------*/

  DATABASE.ref('/doctors').on('value', function(snapshot) {
    snapshot.forEach(function(childSnapshot){
      DOCTOR_LIST[childSnapshot.key] = true;
      $('#doctor-name').append(
        "<option value='" + childSnapshot.val().fname + " " + childSnapshot.val().lname + "'></option>");
    });
  }, function(error){
    console.log(error);
  });

  DATABASE.ref('/medications').on('value', function(snapshot) {
    snapshot.forEach(function(childSnapshot){
      //Hold a list of medications 
      MEDICATION_LIST[childSnapshot.key] = true;
    })
  });

  function updateMedicationDropdown(){
    DATABASE.ref('/medications').on('value', function(snapshot) {
      snapshot.forEach(function(childSnapshot){

        //Update prescription dropdown on 'Add Record' tab
        $('#prescription-name').append(
          "<option value='" + childSnapshot.key + "'></option>");

        //Update medication dropdown on 'Order Medicine' tab
        $('#medication-name').append(
          "<option value='" + childSnapshot.key + "'></option>");
      });
    }, function(error){
      console.log(error);
    });
  }  
  updateMedicationDropdown(); // Call this on first load for first medication


  /*-----------------------------------------------------------------------
  USER AUTHENTICATION
  -----------------------------------------------------------------------*/
  $('#btnSignin').click(function(){
    var email = $('#txtEmail').val();
    var password = $('#txtPassword').val();

    // Sign in with email and pass.
    firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
      showErrorNotification(error.message);
      $('#txtEmail').val('');
      $('#txtPassword').val('');
    });
  });

  // Sign In on "Enter"
  $('#txtPassword').keypress(function(e){
        if(e.which == 13){
          $('#btnSignin').click();
        }
    });

  $('#btnSignout').click(function(){
    if (firebase.auth().currentUser) {
        firebase.auth().signOut();
      }
  });


  $('#btnForgotPW').click(function(){
    var email = $('#txtEmail').value;
    if(!email){
      showErrorNotification('Please fill in your email');
      return;
    }
    try{      
      firebase.auth().sendPasswordResetEmail(email)
      .then(function() {
        alert('Password Reset Email Sent!');
      })
      .catch(function(error) {
        showErrorNotification(error.message);
      });
    }catch(error){
      showErrorNotification(error.message);
    }
  });

  /*----------------------------------------------------------------------
  AUTH STATE CHANGES
  -----------------------------------------------------------------------*/
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      showSignedInPortal();
    } else {
      console.log("User is not signed in");
      showSignedOutPortal();
    }
  });

  var showSignedInPortal = function(){
    $('.unauthenticated').hide();
    $('.authenticated').show();
    $('.dashboard').addClass('active');
    $('.cont').hide();   
    $('.dashboard-cont').show();
  }

  var showSignedOutPortal = function(){
    $('.authenticated').hide();
    $('.unauthenticated').show();
    $('.signin').addClass('active');
    $('.cont').hide();   
    $('.signin-cont').show();
  }


  /*-----------------------------------------------------------------------
  MANAGE ADD RECORD BUTTON
  -----------------------------------------------------------------------*/
  $('#btnAddRecord').click(function(){
    var gender = $("input[name='gender']:checked").val();
    var age = $("input[name='age']:checked").val();
    var doctor = $('input[name=doctor-name]').val();
    var medications = [];

    for (i=0; i<$('.prescription input').length; i++){          
        medications[i] = $('.prescription[data-id='+(i+1)+'] input').val();
    };    
    console.log(gender); // still unknown
    console.log(medications[0]);

    if(!gender|| !age || !doctor || medications.length==0){
      console.log(medications.length);
      showErrorNotification("Please fill in all the fields");
      return;
    }

    if(checkValidDoctor(doctor) && checkValidMedications(medications, 'Record')){
      updateRecords(gender, age, doctor, medications);
    } 
  });

  // Reset border color when user changes input on a wrong cell
  $('.prescription input').keydown(function(){
    $(this).css('border-color', 'light-grey');
  });

  function updateRecords(gender, age, doctor, medications){
    try{
      var userEmail = firebase.auth().currentUser.email;
      var timestamp = firebase.database.ServerValue.TIMESTAMP;
      var recordData = {
        user: userEmail,
        gender: gender,
        age: age,
        doctor: doctor,
        _updated: timestamp
      };

      for (var i = 0; i < medications.length; i++){
        if (medications[i] != ""){
          recordData['medication'+(i+1)] = medications[i];
        }
      }
      
      /*****
      Update RECORD & USER, DOCTOR, PHARMACY, MEDICATIONS records with information
      *****/
      var recordKey = DATABASE.ref().child('records').push(recordData).key;

      var commonData = {};      
      commonData[recordKey] = timestamp;

      updateUserDoctorPharmacyRecords(encodeKey(userEmail), doctor, commonData);
      updateMedicationList(medications, commonData, 'records');

      showSuccessNotification("Record added", false);
      clearAddRecordFields();
    }catch(error){    
      showErrorNotification(error.message);
    }
  }

  function updateUserDoctorPharmacyRecords(userEmailEncoded, doctor, commonData){
    DATABASE.ref().child('users/'+userEmailEncoded+'/records/').update(commonData);
    DATABASE.ref().child('doctors/'+doctor+'/records/').update(commonData);

    // Get pharmacy of user and add record to pharmacy list
    var pharmacy;
    DATABASE.ref('/users/'+userEmailEncoded).once('value').then(function(snapshot){
      pharmacy = snapshot.val().pharmacy;
      DATABASE.ref().child('pharmacies/'+pharmacy+'/records').update(commonData);
    });    

  }

  function clearAddRecordFields(){
    $("input[name='gender']").prop('checked', false);
    $("input[name='age']").prop('checked', false);
    $("input[name=doctor-name]").val('');
    $("input[name=prescription-name]").val('');
    $('.prescription-group').html(
      '<div class="prescription" data-id=1>' +                
          '<div>Medication name:' +
              '<input type="text" name="prescription-name" list="prescription-name" />' +
              '<datalist id="prescription-name"></datalist>' +
          '</div>' +
        '</div>');
  };

  var prescriptionCount = 2;
  $('#btnAnotherPrescription').click(function(){
    $('#prescription-name').html(''); //Resets the datalist so there aren't duplicates
    $('.prescription-group').append(
      '<div class="prescription" data-id='+prescriptionCount+'>' +                
          '<div>Medication name:' +
              '<input type="text" name="prescription-name" list="prescription-name"/>' +
              '<datalist id="prescription-name"></datalist>' +
          '</div>' +
        '</div>');
    prescriptionCount++;
    updateMedicationDropdown(); //Adds the datalist into the dropdown
  });


  /*-----------------------------------------------------------------------
  MANAGE ADD ORDER BUTTON
  -----------------------------------------------------------------------*/
  $('#btnAddOrder').click(function(){    
    var medications = [];
    var details = [];

    for (i=0; i<($('.medication input').length/2); i++){          
        var medication_name = $('.medication[data-id='+(i+1)+'] input[name="medication-name"]').val();
        var medication_detail = $('.medication[data-id='+(i+1)+'] input[name="medication-details"]').val();
        if (medication_name == "" || medication_detail == ""){
          console.log(i, medication_name, medication_detail);
          showErrorNotification("Please fill in all the fields");
        }else{
          medications[i] = medication_name;
          details[i] = medication_detail;
        }
    };    

    // NEED TO MAKE THIS A CALLBACK FUNCTION
    if(checkValidMedications(medications, 'Order')){
      updateOrder(medications, details);
    }
  });


  function updateOrder(medications, details){
    console.log(medications, details);
    try{
      var userEmail = firebase.auth().currentUser.email;
      var timestamp = firebase.database.ServerValue.TIMESTAMP;
      var orderData = {
        user: userEmail,
        _updated: timestamp,        
      };

      for (var i = 0; i < medications.length; i++){
        orderData['medication'+(i+1)] = medications[i] + " - [" + details[i] + "]";
      }
      
      var orderKey = DATABASE.ref().child('orders').push(orderData).key;

      var commonData = {};      
      
      commonData[orderKey] = timestamp;
      updateMedicationList(medications, commonData, 'orders');

      // orderData['orderKey'] = orderKey;
      updatePharmacyOrder(encodeKey(userEmail), commonData);
      
      showSuccessNotification("Order added", false);
      clearAddOrderFields();
    }catch(error){    
      showErrorNotification(error.message);
    }
  }

  function updatePharmacyOrder(userEmailEncoded, data){
    var pharmacy;
    try{
      DATABASE.ref('/users/'+userEmailEncoded).once('value').then(function(snapshot){
      pharmacy = snapshot.val().pharmacy;
      DATABASE.ref().child('pharmacies/'+pharmacy+'/orders').update(data);
    });
    }catch(error){
      showErrorNotification(error.message);
    }    
  };

  function clearAddOrderFields(){
    $('.medication-group').html(
      '<div class="medication-order" data-id=1>' +
         '<div>Medication:'+
            '<input type="text" name="medication-name" list="medication-name" placeholder="Name"/>'+
            '<datalist id="order-name"></datalist>'+
            '<input type="text" name="medication-details" list="medication-details" placeholder="Details (quantity, dosage etc)"/>'+
          '</div>'+
      '</div>');
  };

  var orderCount = 2;
  $('#btnAnotherOrder').click(function(){
    $('#medication-name').html(''); //Resets the datalist so there aren't duplicates
    $('.medication-group').append(
      '<div class="medication" data-id='+orderCount+'>' +                
          '<div>Medication: ' +
              '<input type="text" name="medication-name" list="medication-name" placeholder="Name"/>' +
              '<datalist id="medication-name"></datalist>' +
              '<input type="text" name="medication-details" list="medication-details" placeholder="Details (quantity, dosage etc)"/>'+
          '</div>' +
        '</div>');
    orderCount++;
    updateMedicationDropdown(); //Adds the datalist into the dropdown
  });


  /*-----------------------------------------------------------------------
  MANAGE DATALIST ENTRIES
  // Datalists provide suggestions but don't force a specific selection. 
  // Functions below are to ensure the user's input is a doctor/medication in the database (vs. a random typo)
  -----------------------------------------------------------------------*/ 

  function checkValidDoctor(doctor){
    if(!(doctor in DOCTOR_LIST)){
      showErrorNotification('Please enter a correct doctor name from the dropdown list.');
      return false;
    }
    return true;
  }

  console.log(MEDICATION_LIST);
  function checkValidMedications(medications, recordOrOrder, callback){
    console.log(medications);
    console.log(MEDICATION_LIST);
      for (i=0; i<medications.length; i++){
        if(!(medications[i] in MEDICATION_LIST)){
          console.log(medications[i]);
          if(recordOrOrder == 'Record'){
            $('.prescription[data-id='+(i+1)+'] input').css('border-color', 'red'); //incorrect entry          
          }else if(recordOrOrder == 'Order'){
            $('.medication[data-id='+(i+1)+'] input').css('border-color', 'red'); //incorrect entry          
          }else{
            console.log('Invalid input - record or order');
          }
          showErrorNotification('Please enter a correct medication name from the dropdown list.');
          return false;
        }
      }
     return true;
  }

  // function checkValidMedications(medications, recordOrOrder, callback){
  //   DATABASE.ref('/medications/').once('value').then(function(snapshot){
  //     for (i=0; i<medications.length; i++){
  //       if(!snapshot.hasChild(medications[i])){
  //         if(recordOrOrder == 'Record'){
  //           $('.prescription[data-id='+(i+1)+'] input').css('border-color', 'red'); //incorrect entry          
  //         }else if(recordOrOrder == 'Order'){
  //           $('.medication-order[data-id='+(i+1)+'] input').css('border-color', 'red'); //incorrect entry          
  //         }else{
  //           console.log('Invalid input - record or order');
  //         }
  //         showErrorNotification('Please enter a correct medication name');
  //         return false;
  //       }
  //     }
  //    return true;   
  //   }).then(function(){
  //       if (typeof(callback) === "function") {
  //         callback(gender, age, doctor, medications);
  //       }
  //   });
  // }

  function updateMedicationList(medications, commonData, recordOrOrder){
    for (var i = 0; i < medications.length; i++){
      // Set MEDICATIONS.records
      DATABASE.ref('/medications/' + medications[i] + '/' + recordOrOrder).update(commonData);

      //TODO: Set MEDICATIONS.doctors.prescCount
      // var prescRef = DATABASE.ref('/medications/' + medications[i] + '/doctors/' + doctor);
      // prescRef.transaction(function(prescCount){
      //   prescCount ? prescCount++ : prescCount=1;
      // });
    }
  }


});
