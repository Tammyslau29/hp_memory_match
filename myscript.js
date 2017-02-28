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
var character_id;
// var player1_icon = null;
// var player2_icon = null;

$(document).ready(function(){
    choose_player_settings();
    $(".card").click(card_clicked());
    $(".reset_button").on("click",reset_button);
    $("#winning_gif").on("click", reset_button);
    $("#losing_gif").on("click", reset_button);
});
function choose_player_settings(){
    init_firebase();
    $(".current_player").hide();
    $(".id_container").hide();
    $(".stats_container").hide();
    $(".choose_a_char").hide();
    $(".game-body").hide();
    $(".start_game_btn").hide()
}
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
function choose_character(){
    $(".character_img").css("opacity", "1");
    $(this).find(".character_img").css("opacity", "0.6");
    character_id = $(this).find(".character_img").attr("src");
}
function init_game(){
    $(".character_display").hide();
    $(".choose_a_char").hide();
    $(".stats_container").show();
    $(".game-body").show();
    $(".current_player").show();
    $(".id_container").show();
    active_player = player1;
    new_shuffle();
    update_player_score(player1, 0);
    update_player_score(player2, 0);
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
        $(".player1_icon img").addClass("active_player")
    }else{
        $(".player2_icon img").addClass("active_player")
    }
}
function switch_players(){
    if(active_player == 1){
        active_player = 2;
        $(".player1_icon img").removeClass("active_player");
        $(".player2_icon img").addClass("active_player")
    }else if(active_player == 2){
        active_player = 1;
        $(".player2_icon img").removeClass("active_player");
        $(".player1_icon img").addClass("active_player")
    }
}
function read_user_spell(active_player, second_card){
    var spell;
    var unchecked_spell
    fb_ref.ref("games_in_session/" + game_id + "/board/" + second_card).once("value").then(function(snapshot){
        unchecked_spell = snapshot.val().title;
        spell = strip_spell(unchecked_spell);
        handle_spell_damage(active_player, spell);
    });
}
function strip_spell(title){
    var new_title = title;
    for(var i=0; i < title.length; i++){
        if(title[i] === "1") {
            new_title = title.slice(0, -1);
        }
    }
    return new_title
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
            fb_ref.ref("games_in_session/" + game_id + "/board").update(first_card_status);
        } else {
            second_card_clicked = $(this);
            var second_card = second_card_clicked.data("position");
            second_card_status[second_card + "/status"] = true;
            fb_ref.ref("games_in_session/" + game_id + "/board").update(second_card_status);
            attempts++;
            accuracy = (((matches/attempts)*100).toFixed(2));
            display_stats();
            if (first_card_clicked.find(".front > img").attr("src") ===
                second_card_clicked.find(".front > img").attr("src")){
                read_user_spell(active_player, second_card);
                display_last_card();
                switch_players()
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
                function time_out(){
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
    if(player == 2){
        player1_score -= score
        console.log("player1 score is: ", player1_score);
        $(".your_health_score").text(player1_score);
    }else if(player == 1){
        player2_score -= score;
        console.log("Player 2 score is: ", player2_score);
        $(".enemy_health_score").text(player2_score);
    }
}

function add_player_score(player, score){
    if(player == 1){
        player1_score += score
        $(".your_health_score").text(player1_score);
    }else if (player == 2){
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
    new_shuffle();
    $(".your_health_score").text(player1_score);
    $(".enemy_health_score").text(player2_score);
}
function add_player1_to_fb(character_id){
    var player_obj = {};
    player_obj.player1 = character_id;
    if(game_id !== null){
        fb_ref.ref("games_in_session/" + game_id).update(player_obj)
    }
}
function build_player_character(){
    fb_ref.ref("games_in_session/" + game_id + "/player1").once("value", function(snapshot){
        var photo_img = snapshot.val();
        var character_img = $("<img>").attr("src", photo_img);
        $(".player1_icon").append(character_img)
    })
}
function new_shuffle(){
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
        build_card_display(makeArray)
        add_player1_to_fb(character_id);
        build_player_character();
        check_active_player();
    })
}
function build_card_display(card_array){
    var database_array = [];
    for(var i = 0; i < card_array.length; i ++){
        var individual_card = {};
        var img_src = card_array[i].url;
        var img_title = card_array[i].title;
        var card = $("<div>").addClass("card");
        var front = $("<div>").addClass("front");
        var back = $("<div>").addClass("back").append($("<img>").attr("src", "https://s-media-cache-ak0.pinimg.com/originals/19/eb/08/19eb08414ec401d927c97a2e6a262c2f.jpg"))
        var image = $("<img>").attr("src", img_src);
        var spell = $("<p>").text(img_title).addClass("spells");
        front.append(image);
        front.append(spell);
        card.append(front);
        card.append(back);
        $("#game-area").append(card);
        individual_card.url = card_array[i].url;
        individual_card.title = card_array[i].title;
        individual_card.status = false;
        card.data("position", i);
        database_array.push(individual_card);
    }
    game_id = fb_ref.ref("games_in_session").push({
        board:database_array
    }).key;
    $(".game_id").text(game_id);
    $(".card").click(card_clicked);
}

function build_player2_dom(card_array){
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
            var spell = $("<p>").text(img_title).addClass("spells");
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

function display_last_card() {
    var last_spell_casted = second_card_clicked.find(".front > p").text();
    if(active_player == 1){
        $(".your_last_spell .my_last_spell").html(last_spell_casted);
    }else if(active_player == 2){
        $(".opponents_last_spell .opponent_last_spell").html(last_spell_casted);
    }
}
function auto_kill(){
    console.log("function called");
    $("#losing_gif").show();
    $(".card").hide();
}
function handle_spell_damage(player, spell){
    switch(spell){
        case "Avada Kedavra":
            auto_kill();
            break;
        case "Crucio":
            update_player_score(player, 7);
            break;
        case "Expulso":
            update_player_score(player, 5);
            break;
        case "Incendio":
            update_player_score(player, 4);
            break;
        case "Stupefy":
            update_player_score(player, 2);
            break;
        case "Expelliarmus":
            update_player_score(player, 2);
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
    $(".new_game").hide();
}
function join_game(){
    init_firebase();
    game_id = $(".input_game_id").val();
    fb_ref.ref("/games_in_session/" + game_id).on("value", function(snapshot){
        var card_deck = snapshot.val().board;
        build_player2_dom(card_deck);
    });
    $(".game-body").show();
    check_active_player();
    update_player_score(player1, 0);
    update_player_score(player2, 0);
}
function copyToClipboard(element) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val($(element).text()).select();
    document.execCommand("copy");
    $temp.remove();
    $(".copy_status").show();
}