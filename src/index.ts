// Entry point for web gui
// Load required resources (webpack)

import "./gui.css";

// For managing the startup page
import { add_player, get_options, get_players, validate_players } from "./setup";

// For mainpulating the display of the game
import "./display";

// For running the game
import { GuiGame } from "./game";

// global variable
var gui_game: GuiGame;

// Plausible event tracking
// @ts-ignore
window.plausible =
    // @ts-ignore
    window.plausible ||
    function () {
        // @ts-ignore
        (window.plausible.q = window.plausible.q || []).push(arguments);
    };

// On document load, hide game
// and add human and AI
document.addEventListener("DOMContentLoaded", (event) => {
    document.getElementById("game")!.style.display = "none";
    add_player("human");
    add_player("ai");
});

// Add required functionality to start button
document.getElementById("start-button")?.addEventListener("click", (event) => {
    console.log("Start Button");
    event.stopPropagation();

    // Get setup info
    const players = get_players();
    const options = get_options();

    // Validate setup info
    const player_check = validate_players(players);
    if (!player_check.valid) {
        alert(player_check.message);
        return;
    }

    // Hide start and show game div
    document.getElementById("start")!.style.display = "none";
    document.getElementById("game")!.style.display = "";

    // Start the game
    gui_game = new GuiGame(players, options);

    // @ts-ignore
    plausible("Tiles Game", { props: { type: "Start" } });
});
