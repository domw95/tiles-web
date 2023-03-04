import { AIOpts, PlayerInterface, MultiAI, AI, PruningType, SearchMethod, SortMethod } from "azul-tiles";
import { Options } from "./options";
import { Human } from "./game";

export function add_player(type: string): void {
    // Get element that holds players
    const players = document.getElementById("players") as HTMLElement;
    if (players.children.length == 2) {
        alert("Sorry, only 2 player games currently supported");
        return;
    }

    // Create id
    const player_id = players.children.length + 1;

    var player_template;
    switch (type) {
        case "human":
            player_template = document.getElementById("human-player-template") as HTMLElement;
            break;
        case "ai":
            player_template = document.getElementById("ai-player-template") as HTMLElement;
            break;
        case "ai-advanced":
            return;
            break;
    }
    const player = player_template?.cloneNode(true) as HTMLElement;
    player.classList.add("player");
    player.classList.add("flex-row");
    player.id = "player-" + player_id;

    // Add event listeners to remove player
    player.getElementsByClassName("remove-button")[0].addEventListener("click", (event) => {
        const target = event.target as HTMLElement;
        target.parentElement?.parentElement?.remove();
    });

    // Modify header
    const player_title = player.getElementsByClassName("player-title")[0] as HTMLElement;
    player_title.innerHTML = "Player " + player_id;
    players.append(player);
    //  player_header.after(player)
    update_descriptions();

    // Add callback to personality selector if AI
    if (type == "ai") {
        const description_elem = player.getElementsByClassName("setup-ai-type")[0] as HTMLElement;
        description_elem.onchange = update_descriptions;
    }
}

export function get_options() {
    // Get data from form
    const data = new FormData(document.getElementById("options-form") as HTMLFormElement);
    // Create options
    const options = new Options();
    // Populate options and return
    options.shadowTiles = data.get("shadow-tiles") == "on" ? true : false;
    options.autoplay = data.get("auto-play") == "on" ? true : false;
    options.autoRound = data.get("auto-play-round") == "on" ? true : false;
    options.highlightPrevious = data.get("highlight-move") == "on" ? true : false;
    options.expectedScore = data.get("expected-score") == "on" ? true : false;
    console.log(options);

    return options;
}

export function get_players(): Array<PlayerInterface> {
    // array to hold players for game creation
    const players: Array<PlayerInterface> = [];
    const players_elem = document.getElementById("players") as HTMLElement;
    [...players_elem.children].forEach((player, id) => {
        const player_data = new FormData(player as HTMLFormElement);
        switch (player_data.get("player-type")) {
            case "human":
                var name = player_data.get("name") as string;
                if (name == "") {
                    name = player.getElementsByClassName("player-title")[0].innerHTML;
                }
                players.push(new Human(id, name));
                break;

            case "ai":
                players.push(process_ai_player(player_data, id));
                break;
        }
    });
    return players;
}

export function validate_players(players: Array<PlayerInterface>): {
    valid: boolean;
    message: string;
} {
    // if (players.length != 2) {
    //     return { valid: false, message: "Game requires 2 players" };
    // }
    return { valid: true, message: "" };
}

export function validate_options(): boolean {
    return true;
}

// const AI_LEVEL = [10, 100, 1000];

function process_ai_player(data: FormData, id: number): PlayerInterface {
    // const level = parseInt(data.get("level") as string);
    const personality = data.get("personality") as string;

    const opts = new AIOpts();
    opts.print = true;
    let name = "A.I ";
    switch (personality) {
        case "1":
            // Noob player
            opts.depth = 1;
            opts.method = SearchMethod.DEPTH;
            opts.randomWeight = 1.1;
            opts.config.moveAllFill = true;
            opts.config.moveNoFloor = true;
            name += "N";
            break;
        case "2":
            // Beginner
            opts.depth = 1;
            opts.method = SearchMethod.DEPTH;
            opts.randomWeight = 3;
            opts.config.moveAllFill = true;
            opts.config.moveNoFloor = true;
            opts.config.firstTileValue = 0.5;
            name += "B";
            break;
        case "3":
            // Intermediate
            opts.depth = 3;
            opts.method = SearchMethod.TIME;
            opts.timeout = 100;
            opts.randomWeight = 5;
            opts.config.moveAllFill = true;
            opts.config.friendly = true;
            opts.config.moveNoFloor = true;
            opts.config.firstTileValue = 0.5;
            opts.config.quickEval = true;
            opts.config.negativeScore = true;
            name += "I";
            break;
        case "4":
            // Competitive
            opts.depth = 3;
            opts.method = SearchMethod.TIME;
            opts.timeout = 100;
            opts.randomWeight = 10;
            opts.config.moveAllFill = true;
            opts.config.firstTileValue = 0.5;
            opts.config.centre = 0.1;
            opts.config.quickEval = true;
            opts.config.negativeScore = true;
            name += "C";
            break;
        case "5":
            // Tactical
            opts.depth = 3;
            opts.method = SearchMethod.TIME;
            opts.timeout = 100;
            opts.optimal = true;
            opts.config.movePruning;
            opts.config.forecast = 0.001;
            opts.config.firstTileValue = 1.5;
            opts.config.quickEval = true;
            opts.config.negativeScore = true;
            name += "T";
            break;
        case "6":
            // Advanced
            opts.method = SearchMethod.TIME;
            opts.timeout = 100;
            opts.optimal = true;
            opts.config.movePruning;
            opts.config.forecast = 0.001;
            opts.config.firstTileValue = 1.5;
            opts.config.quickEval = true;
            opts.config.negativeScore = true;
            name += "A";
            break;
        case "7":
            // Master
            opts.method = SearchMethod.TIME;
            opts.timeout = 1000;
            opts.optimal = true;
            opts.config.movePruning;
            opts.config.forecast = 0.001;
            opts.config.firstTileValue = 1;
            opts.config.quickEval = true;
            opts.config.negativeScore = false;
            name += "M";
            break;
    }
    // const ai = new MultiAI(id, opts);
    const ai = new AI(id, opts);
    ai.name = name;
    return ai;
}

const PLAYER_DESCRIPTIONS = [
    "Newbie player, likes to fill lines, doesn't know much else.",
    "Has some idea about how to score more points by aligning tiles on the wall.",
    "Is able to look slightly into the future and combine 2 moves together.",
    "Watch out for the hate-drafting, this bot is out to beat you. Luckily it still isn't very good yet",
    "A student of the game, this bot has discovered some useful tactics. Can be a challenge to beat.",
    "Expect a tough game. Can look quite far ahead and occasionally plays some nasty moves.",
    "Good luck",
];

function update_descriptions() {
    // Get element that holds players
    const players_elem = document.getElementById("players") as HTMLElement;
    // Go through each player updating description
    [...players_elem.children].forEach((player, id) => {
        const player_data = new FormData(player as HTMLFormElement);
        if (player_data.get("player-type") == "ai") {
            const level = player_data.get("personality") as string;
            const description_elem = player.getElementsByClassName("setup-ai-description")[0] as HTMLElement;
            description_elem.innerHTML = PLAYER_DESCRIPTIONS[(parseInt(level) as number) - 1];
        }
    });
}

// Add even listener to create a new player
document.getElementById("add-player-button")?.addEventListener("click", () => {
    // Get type
    const select = document.getElementById("add-new-type") as HTMLSelectElement;
    const type_string = select.value;
    add_player(type_string);
});
