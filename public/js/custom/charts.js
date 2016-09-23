$(document).ready(function() {

    var DATABASE = firebase.database();

    var userEmailEncoded;
    // var months = ['January', 'February'];
    var today = new Date();
    var today_values = {
        year:  today.getFullYear(),
        month: today.getMonth() + 1,
        date: today.getDate()
    }
    
    var records_month_done, records_month_left;
    var wklyCount = {}; 
    var records_month_goal = 50;    

    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        userEmailEncoded = encodeKey(user.email);
        getInfoDrawCharts(userEmailEncoded);
      } 
    });


    function getInfoDrawCharts(userEmailEncoded){
        DATABASE.ref('/users/'+userEmailEncoded+'/records').once('value').then(function(snapshot) {
            // console.log(snapshot.val());
            records_month_done = snapshot.numChildren();        
            wklyCount = getWeeklyCount(snapshot);
            return [records_month_done, wklyCount];
        }, function(error){
            showErrorNotification(error);
        }).then(function(response){
            createMonthlyGoalChart(response[0], records_month_goal);
            // createMonthlyProgressChart(wklyCount);
        });
    }

    function getWeeklyCount(snapshot){
        // console.log(snapshot.val());
        wklyCount = {
            'wk1': 0,
            'wk2': 0,
            'wk3': 0,
            'wk4': 0,
        }; 
        // snapshot.forEach(function(childSnapshot){
        //     var d = new Date(childSnapshot.val());
        //     date_values = {
        //        'year': d.getFullYear(),
        //        'month': d.getMonth()+1,
        //        'date': d.getDate()
        //     }
            
        //     if (date_values['year'] == today_values['year'] && date_values['month'] == today_values['month']){
        //         if (date_values['date']<8){
        //             wklyCount['wk1']++;
        //         }
        //         else if(date_values['date']<15){
        //             wklyCount['wk2']++;
        //         }
        //         else if(date_values['date']<22){
        //             wklyCount['wk3']++;
        //         }
        //         else{
        //             wklyCount['wk4']++;
        //         }
        //     }
        // });
        return wklyCount;        
    }

    // MONTHLY GOAL CHART 
    function createMonthlyGoalChart(done, goal){
        return new JustGage({
            id: "chart-monthlyGoal",
            value: done,
            min: 0,
            max: goal,
            // title: "Progress this month",
            label: "records completed"
          });
    }

    // MONTHLY PROGRESS CHART    
    function createMonthlyProgressChart(wklyCount){
        console.log(wklyCount);
        return new Morris.Area({
            element: 'chart-monthlyProgress',
            data: [
                { x: '7', a: wklyCount['wk1'] },
                { x: '14', a: wklyCount['wk2'] },
                { x: '21', a: wklyCount['wk3'] },
                { x: '30', a: wklyCount['wk4'] },
            ],
            xkey: 'x',
            ykeys: ['a'],
        });
    }

// Ensure it re-pulls data
$('.tabs .tab').click(function(){
    if ($(this).hasClass('dashboard')) {
        $('.chart').html('');
        wklyCount = {
            'wk1': 0,
            'wk2': 0,
            'wk3': 0,
            'wk4': 0,
        }; 
        getInfoDrawCharts(userEmailEncoded);     
    }

});


});