$(document).ready(function() {

    // Hide/show tabs
    $('.tabs .tab').click(function(){
        if ($(this).hasClass('signin')) {
            $('.tabs .tab').removeClass('active');
            $(this).addClass('active');
            $('.cont').hide();   
            $('.signin-cont').show();
        } 
        if ($(this).hasClass('dashboard')) {
            $('.tabs .tab').removeClass('active');
            $(this).addClass('active');
            $('.cont').hide();       
            $('.dashboard-cont').show();
        } 
        if ($(this).hasClass('record')) {
            $('.tabs .tab').removeClass('active');
            $(this).addClass('active');
            $('.cont').hide();   
            $('.record-cont').show();
        } 
        if ($(this).hasClass('order')) {
            $('.tabs .tab').removeClass('active');
            $(this).addClass('active');
            $('.cont').hide();   
            $('.order-cont').show();
        }             
    });


});

/* TODO
- Is Rx delivered or user bought something else?
- updateMedicationRecords - MEDICATIONS.doctors.prescCount(firebase.js) doesnt work
- index page - error check if datalist is a random text input vs part of dropdown, also add-Html (eg. specializations)
- Dashboard to see if irregular pharma input behavior
- Dashboard for pharma to view (pharma-admin specific)
- AddUserToPharmacy needs to be called on page load - extract it from the function
*/