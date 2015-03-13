
var substringMatcher = function(strs) {
    return function findMatches(q, cb) {
	var matches, substrRegex;
	
	// an array that will be populated with substring matches
	matches = [];
	
	// regex used to determine if a string contains the substring `q`
	substrRegex = new RegExp("^"+q, 'i');
	
	// iterate through the pool of strings and for any string that
	// contains the substring `q`, add it to the `matches` array
	$.each(strs, function(i, str) {
	    if (substrRegex.test(str)) {
		// the typeahead jQuery plugin expects suggestions to a
		// JavaScript object, refer to typeahead docs for more info
		matches.push({ value: str });
	    }
	});
	
	cb(matches);
    };
};

var tournamentInfo = {};
var allPlayers = [];
var tournaments = [];

function getRounds(tournament)
{
    // first see if we have this tournament
    var rounds = [];
//    console.log("getting rounds for tournament: " , tournament)
    if(typeof tournamentInfo[tournament] ==  'undefined')
    {
	console.log("failed to find tournament:", tournament);
	return 'undefined';
    }
    else
    {
	var roundsInfo = tournamentInfo[tournament]["rounds"];
	console.log("rounds info :",JSON.stringify(roundsInfo));
	for(var i = 0 ; i <  roundsInfo.length; i++)
	{
	    console.log("round = ", roundsInfo[i]);
	    rounds.push(roundsInfo[i]);
	}
	return rounds;
    }
}

$(function() {

    ["#inputAge", "#inputSibSp", "#inputParc", "#inputFare"].forEach(function(e) {
        $(e).slider({
            formatter: function(value) {
                return 'Current value: ' + value;
            }
        })
    });

    var populateTournaments = function() {
        console.log("populate with list of tournaments ");
        var tournamentsUrl = "http://" + window.location.host + "/v1/plugins/tennis/routes/tournaments";
        $("#tournamentsUrlCalled").text(tournamentsUrl);
        $.ajax({
            url: tournamentsUrl,
            dataType: "json",
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.status + textStatus);
            },
            success: function(data) {
		tournamentInfo = data;
//		console.log("tournaments:", tournamentInfo);

		for (var item in tournamentInfo)
		{
//		    console.log("tournament:", item);
		    tournaments.push(item);
		    var rounds = getRounds(item);
		}

                $('#inputTournament').typeahead({
                    hint: true,
                    highlight: true,
                    minLength: 1,
                },
		{
		    name: 'tournaments',
		    displayKey: 'value',
		    source: substringMatcher(tournaments)
		})
		 .on('typeahead:autocompleted', onAutocompleted)

		function onAutocompleted($e, datum) {
		    console.log("auto completed on tournaments");
		    console.log(datum);
		    // get the rounds for this tournament
		    var theRounds = getRounds(datum["value"]);
		    $('#inputRound').empty();
		    for(var i = 0; i < theRounds.length; ++i)
		    {
			var html = '<option value="' + theRounds[i] + '">' + theRounds[i] +'</option>'; 
			$('#inputRound').append(html);
		    }
		    update();
		}
            }
        });

    };


    var populatePlayers = function() {
        console.log("populate with list of players ");
        var playersUrl = "http://" + window.location.host + "/v1/plugins/tennis/routes/players";
        $("#playersUrlCalled").text(playersUrl);
        $.ajax({
            url: playersUrl,
            dataType: "json",
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR.status + textStatus);
            },
            success: function(data) {
//		console.log("players:", data);
		allPlayers = data;
                $('#inputOpponent').typeahead({
                    hint: true,
                    highlight: true,
                    minLength: 1,
                },
		{
		    name: 'players',
		    displayKey: 'value',
		    source: substringMatcher(allPlayers)
		})
		 .on('typeahead:autocompleted', onAutocompleted)

		function onAutocompleted($e, datum) {
		    console.log("auto completed");
		    console.log("<", datum.value, ">");
		    update();
		}

            }
        });
    };
    
    // Before calling the classifier we want to make sure that
    var checkValid = function()
    {
	var result = true;
	var opp = $('#inputOpponent').val().trim();

	console.log("the opponent is ", opp);

	if ($.inArray(opp, allPlayers) == -1)
	{
	    console.log("failed to find player ",opp);
	    alert("failed to find player " + opp);
	    return false;
	}
	else
	{
	    console.log("player was found ", opp);
	}

	var tournament = $('#inputTournament').val().trim();
	console.log("the tournament is ", tournament);	
	if ($.inArray(tournament, tournaments) == -1)
	{
	    alert("failed to find tournament " + tournament);
	    return false
	}
	else
	{
	    console.log("player was found ", opp);
	}
	return result;
    };

    var update = function() {
	// make sure that the opponent selected is known
	// check that the opponent is a known player
	
        var formVals = $("#oddsForm").serialize();
	console.log("the option value is ", $('#inputRound').val());
        var cls = $('#inputCls').val();
	if(checkValid() == false)
	    return;

//        var url = "http://"+window.location.host+"/v1/blocks/classifyBlock"+cls+"/apply?"+formVals;
        var theUrl = "http://" + window.location.host + "/v1/plugins/tennis/routes/multiapply?" + formVals;
        $("#urlCalled").text(theUrl);
         $.ajax({
           url: theUrl,
           dataType: "json",
           error: function (jqXHR, textStatus, errorThrown) {
           alert(jqXHR.status + textStatus);
           },
           success: function(data) {
	       var theResponse = JSON.parse(data.response);
	       console.log("got data!", theResponse);
	       console.log("pins = ", theResponse.pins);
               for(var feature in theResponse) {
		   console.log("feature = ", feature);
	       }
               var score = parseFloat(theResponse.pins.score) * 100;
	       console.log("the score is ", score);
           $('.progress-bar').css('width', score+'%').attr('aria-valuenow', score);
           $('.progress-bar').text(score.toFixed(2)+"%");
           }
           });
        
        console.log("!!!selected item", $('#the-basics .typeahead').typeahead('val'));
        var urlExpl = "http://"+window.location.host+"/v1/blocks/explainBlock"+cls+"/apply?"+formVals;
        $("#urlCalledExpl").text(urlExpl);
        /*
          $.ajax({
          url: urlExpl,
          dataType: "json",
          error: function (jqXHR, textStatus, errorThrown) {
          alert(jqXHR.status + textStatus);
          },
          success: function(data) {
          for(var feature in data.pins) {
          var sf = feature.split(":");
          $('#explain'+sf[1]).text(data.pins[feature]);
          }
          }
          });
        */
    };
    
    // Update the prob is anything changes
    $("form :input").change(function() {
        update();
    });
    
    // update on load
    populatePlayers();
    populateTournaments();
//    update();
});