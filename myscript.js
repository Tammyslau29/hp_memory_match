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
var player1_score = 100;
var player2_score = 100;
var active_player;
var player1 = 1;
var player2 = 2;

$(document).ready(function(){
    init_game();
    $(".card").click(card_clicked());
    $(".reset_button").on("click",reset_button);
    $("#winning_gif").on("click", reset_button);
    $("#losing_gif").on("click", reset_button);
    update_player_score(player1, 0);
    update_player_score(player2, 0);
});
function init_game(){
    active_player = player1;
    check_active_player();
    init_firebase();
    shuffle();
}
function init_firebase(){
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
function check_active_player(){
    if(active_player == player1){
        $(".player1_icon").addClass("active_player")
    }
}
function switch_players(){
    console.log("Active player is: ", active_player);
    if(active_player == 1){
        active_player = 2;
        $(".player1_icon").removeClass("active_player")
        $(".player2_icon").addClass("active_player")
    }else if(active_player == 2){
        active_player = 1;
        $(".player2_icon").removeClass("active_player");
        $(".player1_icon").addClass("active_player")
    }
}
function read_user_spell(second_card){
    var spell;
    fb_ref.ref("games_in_session/" + game_id + "/" + second_card).once("value").then(function(snapshot) {
        spell = snapshot.val().title;
        handle_spell_damage(spell);
    });
}
function card_clicked() {
    var first_card_status = {};
    var second_card_status = {};
    if ($(this).find(".back").is(":visible") == false) {
    } else {
        $(this).find(".back").hide();
        if (first_card_clicked == null) {
            first_card_clicked = $(this);
            var first_card = first_card_clicked.data("position");
            first_card_status[first_card + "/status"] = true;
            fb_ref.ref("games_in_session/" + game_id).update(first_card_status);
        } else {
            second_card_clicked = $(this);
            var second_card = second_card_clicked.data("position");
            second_card_status[second_card + "/status"] = true;
            fb_ref.ref("games_in_session/" + game_id).update(second_card_status);
            attempts++;
            accuracy = (((matches/attempts)*100).toFixed(2));
            display_stats();
            if (first_card_clicked.find(".front > img").attr("src") ===
                second_card_clicked.find(".front > img").attr("src")){
                switch_players()
                read_user_spell(second_card);
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
                switch_players()
                $(".card").unbind("click");
                var first_card = first_card_clicked.data("position");
                var second_card = second_card_clicked.data("position");
                first_card_status[first_card + "/status"] = true;
                fb_ref.ref("games_in_session/" + game_id).update(first_card_status);
                second_card_status[second_card + "/status"] = true;
                fb_ref.ref("games_in_session/" + game_id).update(second_card_status);
                function time_out(){
                    first_card_clicked.find(".back").show();
                    second_card_clicked.find(".back").show();
                    $(".card").click(card_clicked);
                    first_card_clicked = null;
                    second_card_clicked = null;
                }
                setTimeout(time_out, 2000);
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
function update_player_score(player,score){
    if(player == player1){
        player1_score -= score
        $(".your_health_score").text(player1_score);
    }else if(player == player2){
        player2_score -= score
        $(".enemy_health_score").text(player2_score);
    }
};
function add_player_score(player, score){
    if(player == player1){
        player1_score += score
        $(".your_health_score").text(player1_score);
    }else if (player == player2){
        player2_score += score
        $(".enemy_health_score").text(player2_score);
    }
}
function reset_stats(){
    accuracy = 0;
    matches = 0;
    attempts = 0;
    match_counter = 0;
    display_stats();
    last_spell_casted = null;
    player1_score = 100;
    player2_score = 100;
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
    $("#winning_gif").hide();
    $("#losing_gif").hide();
    shuffle();
    $(".your_health_score").text(player1_score);
    $(".enemy_health_score").text(player2_score);
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
function auto_kill(){
    console.log("function called");
    $("#losing_gif").show();
    $(".card").hide();
}
function handle_spell_damage(spell){
    switch(spell){
        case "Avada Kedavra":
            auto_kill();
            break;
        case "Crucio":
            update_player_score(player2, 7);
            break;
        case "Expulso":
            update_player_score(player2, 5);
            break;
        case "Incendio":
            update_player_score(player2, 4);
            break;
        case "Stupefy":
            update_player_score(player2, 2);
            break;
        case "Expelliarmus":
            update_player_score(player2, 2);
            break;
        case "Liberacorpus":
            add_player_score(player1, 1)
    }
}