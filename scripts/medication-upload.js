$(document).ready(function() {

	var DATABASE = firebase.database();

// Don't add details - just name and manufacturer
	$("#medicationFileInput").on('change', function() {
      if (window.FileReader) {          
          getAsText($(this)[0].files[0]);  // FileReader is supported.
      } else {
          alert('FileReader is not supported in this browser.');
      }
	});

    function getAsText(fileToRead) {
      var reader = new FileReader();    
      reader.readAsText(fileToRead);
      reader.onload = function(event){
      	var csv = event.target.result;
      	processData(csv);
      };
      reader.onerror = function(event){
      	if(event.target.error.name == "NotReadableError") {
          alert("Cannot read file !");
      	}
      };
    }

    function processData(csv) {
        var allTextLines = csv.split(/\r\n|\n/);
        var csvArray = [];
        for (var i=0; i<allTextLines.length; i++) {
            var data = allTextLines[i].split(',');
                var tarr = [];
                for (var j=0; j<data.length; j++) {
                    tarr.push(data[j]);
                }
                csvArray.push(tarr);
        }
      console.log(csvArray);
      showSuccessNotification("Medication file uploaded", false);
      // TODO: Clear csv upload
      var jsonArray = convertToJSON(csvArray);
      uploadToFirebase(jsonArray);
    }

	function convertToJSON(csvArray){
		// Convert Array to JSON
	    var jsonArray = [];    
	    for (var i = 1; i < csvArray.length; i++) {
	        jsonArray[i - 1] = {};
	        for (var k = 0; k < csvArray[0].length && k < csvArray[i].length; k++) {
	            var key = csvArray[0][k];
	            jsonArray[i - 1][key] = csvArray[i][k]
	        }
	    }
	    return jsonArray;	
	} 

	function uploadToFirebase(jsonArray){
		for (var i=0; i<jsonArray.length; i++) {
	    	try{
		      var entry = jsonArray[i];
		      DATABASE.ref('/medications/' + entry.drug_name).update(entry);
		      showSuccessNotification("Medication list uploaded", false);
		    }catch(error){
		      console.log(error);
		      showErrorNotification(error.message);
		    }
		}

  	}



});