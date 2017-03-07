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
var player_score = {};
var active_player;
var player1 = 1;
var player2 = 2;
var check_player2 = null;
var character_id;

$(document).ready(function(){
    choose_player_settings();
    $(".card").click(card_clicked());
    $(".reset_button").on("click",reset_button);
    $("#winning_gif").on("click", reset_button);
    $("#losing_gif").on("click", reset_button);
    var config = {
        apiKey: "AIzaSyAv9PQDq8j_Clv7S9ND9WU31YCm0l2DfU4",
        authDomain: "memory-match-96fcd.firebaseapp.com",
        databaseURL: "https://memory-match-96fcd.firebaseio.com",
        storageBucket: "memory-match-96fcd.appspot.com",
        messagingSenderId: "431642364742"
    };
    firebase.initializeApp(config);
    fb_ref = firebase.database();
    $(".game-body").on("click", function(){
        $(".id_container").hide();
        $(".music_controls").hide()
    })
});
/**
 * Hides everything except player character container
 */
function choose_player_settings(){
    $(".current_player").hide();
    $(".id_container").hide();
    $(".stats_container").hide();
    $(".choose_a_char").hide();
    $(".game-body").hide();
    $(".start_game_btn").hide()
}
/**
 * Loads characters images from Firebase and attaches click handler
 */
function load_players(){
    $(".choose_a_char").show();
    $(".start_game_btn").show();
    $(".game-body").hide();
    $(".multiplayer_option").hide()
    var character_obj;
    fb_ref.ref("characters").once("value").then(function(snapshot){
     character_obj = snapshot.val()
        for(var character in character_obj){
            var character_container = $("<div>").addClass("character_cont")
            var character_img = $("<img>").attr("src", character_obj[character]).addClass("character_img");
            var character_name = $("<p>").text(character).addClass("character_name");
            character_container.append(character_img, character_name);
            character_container.on("click", choose_character);
            $(".character_display").append(character_container)
        }
    })
}
/**
 * hides character display and stats container and reshuffles the board
 */
function init_game(){
    $(".character_display").hide();
    $(".choose_a_char").hide();
    $(".stats_container").show();
    $(".game-body").show();
    $(".current_player").show();
    // $(".id_container").show();
    new_shuffle();
}
/**
 * when game is initialized, current player is set to 1
 */
function assign_current_player(){
    fb_ref.ref("games_in_session/" + game_id).update({current_player:1})
    active_player = 1;
}
/**
 * initializes each player score to 100 in firebase
 */
function init_score_to_db(){
    player_score = {
        player1_score: 100,
        player2_score: 100
    }
    fb_ref.ref("games_in_session/" + game_id + "/player_score").update(player_score)
}

function toggle_current_player(){
    fb_ref.ref("games_in_session/" + game_id + "/current_player").once("value", function(snapshot){
        var current_player = snapshot.val();
        if(current_player == 1){
            fb_ref.ref("games_in_session/" + game_id).update({current_player:2})
            active_player = 2
        }else{
            fb_ref.ref("games_in_session/" + game_id).update({current_player:1})
            active_player = 1
        }
    })
}

function choose_character(){
    $(".character_img").css("opacity", "1");
    $(this).find(".character_img").css("opacity", "0.6");
    character_id = $(this).find(".character_img").attr("src");
}

/**
 * assigns active player class to current player
 */
function check_active_player(current_player){
    if(current_player == 1){
        $(".player2_icon img").removeClass("active_player");
        $(".player2_text").removeClass("active_text")
        $(".player1_icon img").addClass("active_player")
        $(".player1_text").addClass("active_text")
    }else{
        $(".player1_icon img").removeClass("active_player");
        $(".player1_text").removeClass("active_text")
        $(".player2_icon img").addClass("active_player")
        $(".player2_text").addClass("active_text")
    }
}
/**
 * grabs spell name from firebase and calls handle spell function with the name
 */
function read_user_spell(active_player, second_card){
    var spell;
    var unchecked_spell
    fb_ref.ref("games_in_session/" + game_id + "/board/" + second_card).once("value").then(function(snapshot){
        unchecked_spell = snapshot.val().title;
        spell = strip_spell(unchecked_spell);
        handle_spell_damage(active_player, spell);
    });
}
/**
 * removes extra character from spell so text is uniform
 */
function strip_spell(title){
    var new_title = title;
    for(var i=0; i < title.length; i++){
        if(title[i] === "1") {
            new_title = title.slice(0, -1);
        }
    }
    return new_title
}
/**
 * card click handler with card win logic
 */
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
            fb_ref.ref("games_in_session/" + game_id + "/board").update(first_card_status);
        } else {
            second_card_clicked = $(this);
            var second_card = second_card_clicked.data("position");
            second_card_status[second_card + "/status"] = true;
            attempts++;
            accuracy = (((matches/attempts)*100).toFixed(2));
            display_stats();
            fb_ref.ref("games_in_session/" + game_id + "/board").update(second_card_status);
            if (first_card_clicked.find(".front > img").attr("src") ===
                second_card_clicked.find(".front > img").attr("src")){
                handle_card_match();
                read_user_spell(active_player, second_card);
                display_last_card();
                toggle_current_player();
            }
            else {
                toggle_current_player()
                $(".card").unbind("click");
                setTimeout(card_time_out, 2000);
                display_stats()
            }
        }
    }
};
/**
 * resets card status in firebase to false and resets first_card and second_card clicked variables
 */
function card_time_out(){
    var first_card = first_card_clicked.data("position");
    var second_card = second_card_clicked.data("position");
    first_card_status[first_card + "/status"] = false;
    fb_ref.ref("games_in_session/" + game_id + "/board").update(first_card_status);
    second_card_status[second_card + "/status"] = false;
    fb_ref.ref("games_in_session/" + game_id + "/board").update(second_card_status);
    first_card_clicked.find(".back").show();
    second_card_clicked.find(".back").show();
    $(".card").click(card_clicked);
    first_card_clicked = null;
    second_card_clicked = null;
}
/**
 * checks to see if total matches condition is met
 */
function handle_card_match(){
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
}

function display_stats(){
    $(".accuracy .value").html((accuracy) + "%");
    $(".games_played .value").html(games_played);
    $(".attempts .value").html(attempts);
}
/**
 * subtracts player score that's opposite the current players
 */
function subtract_player_score(player,score){
    if(player == 2){
        fb_ref.ref("games_in_session/" + game_id + "/player_score").once("value", function(snapshot){
            var new_player_score = snapshot.val().player1_score;
            new_player_score -= score
            fb_ref.ref("games_in_session/" + game_id + "/player_score").update({player1_score:new_player_score})
        });
    }else if(player == 1){
        fb_ref.ref("games_in_session/" + game_id + "/player_score").once("value", function(snapshot){
            var new_player_score = snapshot.val().player2_score;
            new_player_score -= score

            fb_ref.ref("games_in_session/" + game_id + "/player_score").update({player2_score:new_player_score})
        });
    }
    display_score()
}
/**
 * adds to player score for current player
 */
function add_player_score(player, score){
    if(player == 2){
        fb_ref.ref("games_in_session/" + game_id + "/player_score").once("value", function(snapshot){
            var new_player_score = snapshot.val().player1_score;
            new_player_score += score
            fb_ref.ref("games_in_session/" + game_id + "/player_score").update({player2_score:new_player_score})
        });
    }else if(player == 1){
        fb_ref.ref("games_in_session/" + game_id + "/player_score").once("value", function(snapshot){
            var new_player_score = snapshot.val().player2_score;
            new_player_score += score

            fb_ref.ref("games_in_session/" + game_id + "/player_score").update({player1_score:new_player_score})
        });
    }
    display_score()
}

function display_score(){
    fb_ref.ref("games_in_session/" + game_id + "/player_score").on("value", function(snapshot){
        var score_obj = snapshot.val();
        $(".your_health_score").text(score_obj.player1_score);
        $(".enemy_health_score").text(score_obj.player2_score);
    });
}
/**
 * sets stats to initial state
 */
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
/**
 * resets stats, reshuffles the board, and initializes players score
 */
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
    new_shuffle(true);
    init_score_to_db();
    display_score()
}

function add_player1_to_fb(character_id){
    var player_obj = {};
    player_obj.player1 = character_id;
    if(game_id !== null){
        fb_ref.ref("games_in_session/" + game_id).update(player_obj)
    }
}

function add_player2_to_fb(character_id){
    var player_obj = {};
    player_obj.player2 = character_id;
    if(game_id !== null){
        fb_ref.ref("games_in_session/" + game_id).update(player_obj)
    }
}
/**
 * creates player icon
 */
function build_player_character(player, player_icon){
    fb_ref.ref("games_in_session/" + game_id + "/" + player).once("value", function(snapshot){
        var photo_img = snapshot.val();
        var character_img = $("<img>").attr("src", photo_img);
        $(player_icon).append(character_img)
    })
}
/**
 * shuffle function that checks if game has been initialized or reset button was pressed
 */
function new_shuffle(reset){
    var makeArray = [];
    var swap_card;
    var sub_card;
    fb_ref.ref("card_info").once("value", function(snapshot){
        var card_array = snapshot.val();
        for(var key in card_array){
            var card_obj = {};
            card_obj.title = key;
            card_obj.url =  card_array[key];
            makeArray.push(card_obj);
        }
        for (var i = makeArray.length - 1; i > 0; i--) {
            swap_card = Math.floor(Math.random() * i);
            sub_card = makeArray[i];
            makeArray[i] = makeArray[swap_card];
            makeArray[swap_card] = sub_card;
        }
        push_card_to_db(makeArray, reset)
        add_player1_to_fb(character_id);
        assign_current_player();
        display_score();
        if(!reset) {
            build_player_character("player1", ".player1_icon");
            fb_ref.ref("/games_in_session/" + game_id + "/current_player").on("value", function(snapshot){
                var current_player = snapshot.val();
                check_active_player(current_player);
            });
            fb_ref.ref("/games_in_session/" + game_id + "/board").on("value", function(snapshot){
                var card_deck = snapshot.val();
                build_card_dom_display(card_deck);
            });
        }

    })
}
/**
 * adds newly shuffled deck to firebase
 */
function push_card_to_db(card_array, reset){
    var database_array = [];
    for(var i = 0; i < card_array.length; i ++){
        var individual_card = {};
        individual_card.url = card_array[i].url;
        individual_card.title = card_array[i].title;
        individual_card.status = false;
        database_array.push(individual_card);
    }
    if(reset){
        fb_ref.ref("games_in_session/" + game_id).update({
            board:database_array
        })
    }else {
        game_id = fb_ref.ref("games_in_session").push({
            board:database_array
        }).key;
    }
    init_score_to_db();
    $(".game_id").text(game_id);
}

function check_for_reset(card_array) {
    var cards = $('.card');
    for(var i = 0; i < card_array.length; i ++) {
        var spell = $(cards[i]).find('.front .spells').text();
        if(spell !== strip_spell(card_array[i].title)) {
            $('#game-area').empty();
            return;
        }
    }
}
/**
 * builds card dom elements
 */
function build_card_dom_display(card_array){
    check_for_reset(card_array);
    var cards = $('.card');

    for(var i = 0; i < card_array.length; i ++) {
        if (cards.length > 0) {
            if (card_array[i].status) {
                $(cards[i]).find('.back').hide();
            } else {
                $(cards[i]).find('.back').show();
            }
        } else {
            var img_src = card_array[i].url;
            var img_title = card_array[i].title;
            var card = $("<div>").addClass("card");
            var front = $("<div>").addClass("front");
            var back = $("<div>").addClass("back").append($("<img>").attr("src", "https://s-media-cache-ak0.pinimg.com/originals/19/eb/08/19eb08414ec401d927c97a2e6a262c2f.jpg"))
            var image = $("<img>").attr("src", img_src);
            var checked_spell =  strip_spell(img_title);
            var spell = $("<p>").text(checked_spell).addClass("spells")
            front.append(image);
            front.append(spell);
            card.append(front);
            card.append(back);
            card.data("position", i);
            $("#game-area").append(card);
            if (card_array[i].status == true) {
                back.hide();
            }
        }
    }
    $(".card").click(card_clicked);
}

function display_last_card(){
    var last_spell_casted = second_card_clicked.find(".front > p").text();
    if(active_player == 1){
        fb_ref.ref("games_in_session/" + game_id + "/last_spell/").update({player1: last_spell_casted})
        fb_ref.ref("games_in_session/" + game_id + "/last_spell/player1").once("value", function(snapshot){
            $(".your_last_spell .my_last_spell").html(snapshot.val())
        });
    }else if(active_player == 2){
        fb_ref.ref("games_in_session/" + game_id + "/last_spell/").update({player2: last_spell_casted})
        fb_ref.ref("games_in_session/" + game_id + "/last_spell/player2").once("value", function(snapshot){
            $(".opponents_last_spell .opponent_last_spell").html(snapshot.val());
        });

    }
}

function auto_kill(){
    $("#losing_gif").show();
    $(".card").hide();
}
/**
 * calls appropriate handler depending on spell param
 */
function handle_spell_damage(player, spell){
    switch(spell){
        case "Avada Kedavra":
            auto_kill();
            break;
        case "Crucio":
            subtract_player_score(player, 7);
            break;
        case "Expulso":
            subtract_player_score(player, 5);
            break;
        case "Incendio":
            subtract_player_score(player, 4);
            break;
        case "Stupefy":
            subtract_player_score(player, 2);
            break;
        case "Expelliarmus":
            subtract_player_score(player, 2);
            break;
        case "Liberacorpus":
            add_player_score(player, 1);
            break;
        case "Rennervate":
            add_player_score(player,3);
            break;
        case "Finite Incantatum":
            add_player_score(player, 2)
    }
}

function join_existing_game(){
    $(".enter_room_key").show();
    $(".join_game").hide();
    $(".new_game").hide();
}
/**
 * accesses database at key to join exisiting game and will build dom base upon key
 */
function join_game(){
    $(".id_container").hide();
    $(".character_display").hide();
    $(".choose_a_char").hide();
    $(".stats_container").show();
    $(".game-body").show();
    $(".current_player").show();
    fb_ref.ref("/games_in_session/" + game_id + "/board").on("value", function(snapshot){
        var card_deck = snapshot.val()
        build_card_dom_display(card_deck);
    });
    fb_ref.ref("/games_in_session/" + game_id + "/current_player").on("value", function(snapshot){
        var current_player = snapshot.val();
        check_active_player(current_player);
    });
    add_player2_to_fb(character_id);
    build_player_character("player2", ".player2_icon");
    build_player_character("player1", ".player1_icon");
    display_score();
    $(".game-body").show();
}

function build_characters_for_player2(){
    check_player2 = true;
    game_id = $(".input_game_id").val();
    load_players();
}
/**
 * checks to see if this is player1 or player2 joining the game ad which function to call
 */
function checks_player2(){
    if (check_player2 == null){
        init_game()
    }else{
        join_game()
    }
}

function copyToClipboard(element) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val($(element).text()).select();
    document.execCommand("copy");
    $temp.remove();
    $(".copy_status").show();
}

function pauseMusic(){
    var x = document.getElementById("music");
        x.pause();
}

function playMusic(){
    var x = document.getElementById("music");
        x.play();
}

function open_settings(){
    $("#myDropdown").toggle();
}

function open_shareable(){
    $(".id_container").toggle();
}