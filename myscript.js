var first_card_clicked = null;
var second_card_clicked = null;
var total_possible_matches = 9;
var match_counter = 0;
var matches = 0;
var attempts = 0;
var accuracy = null;
var games_played = 0;
var last_spell_casted = null;
var fb_ref;
var game_id = null;

$(document).ready(function(){
    init_game();
    $(".card").click(card_clicked());
    $(".reset_button").on("click",reset_button);
});
function init_game(){
    this.player1 = null;
    this.player2 = null;
    init_firebase();
    shuffle();
}
function init_firebase(){
    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyAv9PQDq8j_Clv7S9ND9WU31YCm0l2DfU4",
        authDomain: "memory-match-96fcd.firebaseapp.com",
        databaseURL: "https://memory-match-96fcd.firebaseio.com",
        storageBucket: "memory-match-96fcd.appspot.com",
        messagingSenderId: "431642364742"
    };
    firebase.initializeApp(config);
    fb_ref = firebase.database();
}

function card_clicked() {
    if ($(this).find(".back").is(":visible") == false) {
    } else {
        $(this).find(".back").hide();
        if (first_card_clicked == null) {
            first_card_clicked = $(this);
            var first_card = first_card_clicked.data("position");
            fb_ref.ref("games_in_session/" + game_id + "/" + first_card + "/status").update(true);
        } else {
            second_card_clicked = $(this);
            var second_card = second_card_clicked.data("position");
            fb_ref.ref("games_in_session/" + game_id + "/" + second_card + "/status").update(true);
            attempts++;
            accuracy = (((matches/attempts)*100).toFixed(2));
            display_stats();
            if (first_card_clicked.find(".front > img").attr("src") ===
                second_card_clicked.find(".front > img").attr("src")){
                display_last_card();
                match_counter++;
                matches++;
                accuracy = (((matches/attempts)*100).toFixed(2));
                display_stats();
                first_card_clicked = null;
                second_card_clicked = null;
                if (total_possible_matches == match_counter) {
                    $("#winning_gif").show();
                    $(".card").hide();
                } else {
                    return;
                }
            } else {
                $(".card").unbind("click");
                function time_out(){
                    var first_card = first_card_clicked.data("position");
                    var second_card = second_card_clicked.data("position");
                    fb_ref.ref("games_in_session/" + game_id + "/" + first_card + "/status").update(false);
                    fb_ref.ref("games_in_session/" + game_id + "/" + first_card + "/status").update(false);
                    first_card_clicked.find(".back").show();
                    second_card_clicked.find(".back").show();
                    $(".card").click(card_clicked);
                    first_card_clicked = null;
                    second_card_clicked = null;
                }
                setTimeout(time_out, 1000)
                display_stats()
            }
        }
    }
};
function display_stats(){
    $(".accuracy .value").html((accuracy) + "%");
    $(".games_played .value").html(games_played);
    $(".attempts .value").html(attempts);
}
function reset_stats(){
    accuracy = 0;
    matches = 0;
    attempts = 0;
    match_counter = 0;
    display_stats();
    last_spell_casted = null;
}
function reset_button() {
    games_played++;
    ($(".games_played .value").html(games_played));
    reset_stats();
    display_stats();
    first_card_clicked = null;
    second_card_clicked = null;
    $(".card").show()
    $(".card .back").show();
    $("#winning_gif").hide()
    shuffle();
}
function shuffle() {
    var makeArray = $(".card").toArray();
    var swap_card;
    var sub_card;
    var database_array = [];
    for (var i = makeArray.length - 1; i > 0; i--) {
        swap_card = Math.floor(Math.random() * i);
        sub_card = makeArray[i];
        makeArray[i] = makeArray[swap_card];
        makeArray[swap_card] = sub_card;
    }
    $("#game-area").empty();
    for (var i = 0; i < makeArray.length; i++) {
        var individual_card = {};
        var each_card = makeArray[i];
        individual_card.url = $(makeArray[i]).find(".front img").attr("src");
        individual_card.title = $(makeArray[i]).find(".spells").html();
        individual_card.status = false;
        $(makeArray[i]).data("position", i);
        database_array.push(individual_card);
        $("#game-area").append(each_card);
    }
    game_id = fb_ref.ref("games_in_session").push(database_array).key;
    $(".card").click(card_clicked);
}
function display_last_card() {
    var last_spell_casted = second_card_clicked.find(".front > p").text();
    $(".your_last_spell .my_last_spell").html(last_spell_casted);
}