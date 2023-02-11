// All the required function for manipulating the game display
import { GameState, Move, PlayerBoard, PlayerInterface, Tile } from "azul-tiles";
import { State } from "azul-tiles/dist/state.js";
import { Options } from "./options";

const ATTR = {
    tile_colour: "tile-colour",
    highlight: "highlight",
    border_colour: "border-colour",
    shadow: "shadow",
};

const CLASS = {
    // Layout
    flex_row: "flex-row",
    flex_column: "flex-column",
    horizontal_item: "horizontal-item",

    // Visual
    border: "border",

    // board stuff
    lines: "lines",
    lines_top: "line-top",
    line_container: "line_container",
    board_element: "board-element",
    board_bottom: "board-bottom",
    score: "score",
    name: "name",
};

/**
 * Creates a div HTMLElement
 * @param name id of the created div
 * @returns div element
 */
function new_div(name: string): HTMLElement {
    const div = document.createElement("div");
    div.setAttribute("id", name);
    return div;
}
function create_lines(board_id: number): HTMLElement {
    const lines = new_div("lines-" + board_id);
    lines.classList.add(CLASS.lines);
    lines.classList.add(CLASS.board_element);

    // Create divs for top 2 lines and score
    const top = new_div("lines-" + board_id + "-top");
    top.classList.add(CLASS.flex_row);
    top.classList.add(CLASS.lines_top);

    const top_lines = new_div("lines-" + board_id + "-top-lines");
    top_lines.classList.add(CLASS.line_container);

    const score = new_div("score-" + board_id);
    score.classList.add(CLASS.score);
    // score.classList.add(CLASS.border)
    score.innerHTML = "0";

    const bottom = new_div("lines-" + board_id + "-bottom");
    bottom.classList.add("line-container");

    top.append(score);
    top.append(top_lines);
    lines.append(top);
    lines.append(bottom);

    for (var l = 0; l < 2; l++) {
        const line = create_tile_line(l + 1);
        line.classList.add("line");
        line.id = "line-" + board_id + "-" + l;
        line.setAttribute("line-id", l.toString());
        top_lines.append(line);
    }

    for (var l = 2; l < 5; l++) {
        const line = create_tile_line(l + 1);
        line.classList.add("line");
        line.id = "line-" + board_id + "-" + l;
        line.setAttribute("line-id", l.toString());
        bottom.append(line);
    }

    return lines;
}

function create_tile_line(length: number): HTMLElement {
    const line = document.createElement("div");
    for (var i = 1; i <= length; i++) {
        line.append(create_tile());
    }
    return line;
}

function create_tile(): HTMLElement {
    var tile = document.createElement("div");
    tile.classList.add(CLASS.border);
    tile.classList.add("tile");
    tile.classList.add("board-tile");
    return tile;
}

function create_wall(board_id: number): HTMLElement {
    var wall = new_div("wall-" + board_id);
    wall.classList.add(CLASS.flex_column);
    wall.classList.add("board-element");
    for (var i = 1; i <= 5; i++) {
        const line = create_tile_line(5);
        line.classList.add(CLASS.flex_row);
        wall.append(line);
    }
    colour_wall(wall);
    return wall;
}

function colour_wall(wall: HTMLElement): void {
    const lines = [...wall.children];
    lines.forEach((line, row) => {
        const tiles = [...line.children] as Array<HTMLElement>;
        tiles.forEach((tile, col) => {
            tile.setAttribute(ATTR.border_colour, ((5 + col - row) % 5).toString());
        });
    });
}

function create_floor(board_id: number): HTMLElement {
    const floor = create_tile_line(7);
    [...floor.children].forEach((tile, i) => {
        tile.innerHTML = PlayerBoard.floorScores[i].toString();
    });
    floor.classList.add("floor");
    floor.classList.add(CLASS.flex_row);
    floor.setAttribute("line-id", "5");
    floor.id = "floor-" + board_id;
    return floor;
}

function create_board(board_id: number): HTMLElement {
    // Create board div and add classes
    const board = new_div("board-" + board_id);
    board.classList.add(CLASS.flex_column);
    board.classList.add(CLASS.border);
    board.classList.add("horizontal-item");
    board.classList.add("board");

    const board_top = document.createElement("div");
    board_top.classList.add(CLASS.flex_row);

    // Create the lines and wall
    board_top.append(create_lines(board_id));
    board_top.append(create_wall(board_id));

    board.append(board_top);

    const board_bottom = new_div("board-bottom-" + board_id);
    board_bottom.classList.add(CLASS.flex_row);
    board_bottom.classList.add(CLASS.board_element);
    board_bottom.classList.add(CLASS.board_bottom);

    // Div to hold name
    const name = new_div("name-" + board_id);
    name.classList.add(CLASS.name);
    name.innerHTML = "";

    board_bottom.append(create_floor(board_id));
    board_bottom.append(name);

    board.append(board_bottom);

    return board;
}

function create_factory_tile(): HTMLElement {
    var tile = document.createElement("div");
    tile.classList.add(CLASS.border);
    tile.classList.add("tile");
    tile.classList.add("factory-tile");
    return tile;
}

function create_factory(factory_id: number): HTMLElement {
    const factory = new_div("factory-" + factory_id);
    factory.setAttribute("factory-id", factory_id.toString());
    factory.classList.add(CLASS.border);
    factory.classList.add("factory");
    factory.classList.add("horizontal-item");
    var ntiles = 4;
    if (factory_id == 0) {
        ntiles = 6;
    }
    for (var i = 0; i < ntiles; i++) {
        factory.append(create_factory_tile());
    }
    return factory;
}

function add_board(board_id: number, name: string): HTMLElement {
    const board = create_board(board_id);
    var parent: HTMLElement | null;
    if (board_id == 0) {
        parent = document.getElementById("player-boards");
    } else {
        parent = document.getElementById("opponent-boards");
    }
    board.getElementsByClassName("name")[0].innerHTML = name;
    parent?.append(board);
    return board;
}

export class GuiDisplay {
    factories: Array<HTMLElement> = [];
    boards: Array<HTMLElement> = [];
    lines: Array<Array<HTMLElement>> = [];

    constructor(gamestate: GameState, public players: Array<PlayerInterface>, public opts: Options) {
        // Create player boards
        gamestate.playerBoards.forEach((_, i) => {
            this.boards.push(add_board(i, players[i].name));
            //  Store references to all the lines
            const lines = [...this.boards[i].getElementsByClassName("line")] as Array<HTMLElement>;
            lines.push(this.boards[i].getElementsByClassName("floor")[0] as HTMLElement);

            this.lines.push(lines);
        });
        this.highlight_board(gamestate.activePlayer);
        // Create factories
        this.create_factories(gamestate);

        // Register callback to maintain vertical height
        window.addEventListener("resize", () => {
            this.body_resize();
        });
        this.body_resize();

        document.getElementById("game-end")!.style.display = "none";
    }

    create(gamestate: GameState, player: Array<PlayerInterface>) {}

    clear() {
        // Clear factories, player boards and tidy centre
        document.getElementById("factories")!.innerHTML = "";
        document.getElementById("opponent-boards")!.innerHTML = "";
        document.getElementById("player-boards")!.innerHTML = "";
    }

    create_factories(gamestate: GameState): void {
        const factories_elem = document.getElementById("factories") as HTMLElement;
        factories_elem.innerHTML = "";
        this.factories = [];
        // Create factories
        gamestate.factory.forEach((factory, ind) => {
            // Create and add factory element
            const factory_elem = create_factory(ind);
            factories_elem.append(factory_elem);
            this.factories.push(factory_elem);
            this.update_factory(ind, gamestate);
        });
    }

    body_resize(): void {
        const height = window.innerHeight.toString() + "px";
        document.getElementById("game")!.style.minHeight = height;
    }

    highlight_board(player_id: number): void {
        this.boards.forEach((board, ind) => {
            if (player_id == ind) {
                board.setAttribute(ATTR.highlight, "");
            } else {
                board.removeAttribute(ATTR.highlight);
            }
        });
    }

    highlight_boards(player_ids: Array<number>): void {
        this.boards.forEach((board, ind) => {
            if (player_ids.includes(ind)) {
                board.setAttribute(ATTR.highlight, "");
            } else {
                board.removeAttribute(ATTR.highlight);
            }
        });
    }

    clear_board_highlights(): void {
        this.boards.forEach((board) => {
            board.removeAttribute(ATTR.highlight);
        });
    }

    // Takes reference to a factory tile element and highlights all other of that colour
    // in the factory
    highlight_factory_tiles(tile: HTMLElement): void {
        const highlight = "highlight";
        const tile_colour = "tile-colour";

        const colour = tile.getAttribute(tile_colour) as string;
        const factory_elem = tile.parentElement as HTMLElement;

        [...factory_elem.children].forEach((tile) => {
            if (colour == tile.getAttribute(tile_colour)) {
                tile.setAttribute(highlight, colour);
            } else {
                tile.removeAttribute(highlight);
            }
        });
    }

    clear_factory_highlights() {
        this.factories.forEach((factory) => {
            [...factory.children].forEach((tile) => {
                tile.removeAttribute(ATTR.highlight);
            });
        });
    }

    highlight_lines(player_id: number, lines: Array<number>): void {
        const line_str = "line-" + player_id + "-";
        lines.forEach((line) => {
            [...this.lines[player_id][line].children].forEach((tile) => {
                tile.setAttribute(ATTR.highlight, "");
            });
        });
    }

    clear_line_highlights(): void {
        this.lines.forEach((playerlines) => {
            playerlines.forEach((line) => {
                [...line.children].forEach((tile) => {
                    tile.removeAttribute(ATTR.highlight);
                });
            });
        });
    }

    update_with_move(move: Move, gamestate: GameState): void {
        if (move.factory) {
            this.update_factory(move.factory, gamestate);
        }
        this.update_centre(gamestate);
        if (move.line < 5) {
            this.update_line(move.player, move.line, gamestate);
        }
        this.update_board(move.player, gamestate);
        // this.update_floor(move.player, gamestate);
        this.highlight_board(gamestate.activePlayer);
    }

    update_for_end_of_round(gamestate: GameState): void {
        gamestate.playerBoards.forEach((_, player_id) => {
            this.update_board(player_id, gamestate);
        });
        // If not end of game, setup for next round
        if (gamestate.state != State.gameEnd) {
            this.create_factories(gamestate);
            this.highlight_board(gamestate.activePlayer);
            document.getElementById("factories")!.style.display = "";
            document.getElementById("game-end")!.style.display = "none";
        } else {
            // Show end of game info
            document.getElementById("factories")!.style.display = "none";
            document.getElementById("game-end")!.style.display = "";

            var end_string = "";
            if (gamestate.winner.length == 1) {
                end_string = "The winner is: <b>" + this.players[gamestate.winner[0]].name + "</b>!";
                this.highlight_board(gamestate.winner[0]);
            } else if (gamestate.winner.length == gamestate.nPlayers) {
                end_string = "It's a draw!";
                this.clear_board_highlights();
            }
            document.getElementById("game-end-text")!.innerHTML = end_string;
        }
    }

    // Refreshes content of all lines, wall and floor of given player
    update_board(player_id: number, gamestate: GameState): void {
        // Update Lines
        for (var i = 0; i < 5; i++) {
            this.update_line(player_id, i, gamestate);
        }

        // Update Walls
        const wall = gamestate.playerBoards[player_id].wall;
        const shadowWall = gamestate.playerBoards[player_id].shadowWall;
        const wall_elem = document.getElementById("wall-" + player_id) as HTMLElement;
        [...wall_elem.children].forEach((row, row_ind) => {
            [...row.children].forEach((tile, col_ind) => {
                const wall_tile = wall[row_ind][col_ind];
                const shadow_tile = shadowWall[row_ind][col_ind];
                if (wall_tile != Tile.Null) {
                    tile.setAttribute(ATTR.tile_colour, wall_tile.toString());
                    tile.removeAttribute(ATTR.shadow);
                } else if (shadow_tile != Tile.Null && this.opts.shadowTiles) {
                    tile.setAttribute(ATTR.tile_colour, shadow_tile.toString());
                    tile.setAttribute(ATTR.shadow, "");
                } else {
                    tile.removeAttribute(ATTR.tile_colour);
                    tile.removeAttribute(ATTR.shadow);
                }
            });
        });
        this.update_floor(player_id, gamestate);

        // Update score
        document.getElementById("score-" + player_id)!.innerHTML = gamestate.playerBoards[player_id].score.toString();
    }

    update_centre(gamestate: GameState): void {
        const tiles_elem = [...this.factories[0].children] as Array<HTMLElement>;
        tiles_elem.forEach((tile, ind) => {
            tile.setAttribute(ATTR.border_colour, ind.toString());

            if (ind == 5) {
                if (gamestate.firstTile == Tile.FirstPlayer) {
                    tile.setAttribute(ATTR.tile_colour, Tile.FirstPlayer.toString());
                    tile.innerHTML = "-1";
                } else {
                    tile.removeAttribute(ATTR.tile_colour);
                    tile.innerHTML = "";
                }
            } else {
                // Count how many tiles in factory
                const ntiles = gamestate.factory[0].filter((x) => x == ind).length;
                if (ntiles) {
                    tile.setAttribute(ATTR.tile_colour, ind.toString());
                    if (ntiles > 1) {
                        tile.innerHTML = ntiles.toString();
                    } else {
                        tile.innerHTML = "";
                    }
                } else {
                    tile.removeAttribute(ATTR.tile_colour);
                    tile.innerHTML = "";
                }
            }
        });
    }

    update_factory(factory_id: number, gamestate: GameState): void {
        // Check if centre
        if (factory_id == 0) {
            this.update_centre(gamestate);
            return;
        }
        // If no tiles left, remove the factory
        if (gamestate.factory[factory_id].length == 0) {
            // this.factories[factory_id].style.display = "none"
            this.factories[factory_id].remove();

            // Otherwise colour the tiles
        } else {
            // Colour tiles
            const tiles_elem = [...this.factories[factory_id].children] as Array<HTMLElement>;
            tiles_elem.forEach((tile, ind) => {
                tile.setAttribute(ATTR.tile_colour, gamestate.factory[factory_id][ind].toString());
            });
        }
    }

    update_line(player_id: number, line_number: number, gamestate: GameState): void {
        // const board = this.boards[player_id];
        const line_text = "line-" + player_id + "-" + line_number;
        const line_elem = document.getElementById(line_text) as HTMLElement;
        const line = gamestate.playerBoards[player_id].lines[line_number];

        [...line_elem.children].forEach((tile, ind) => {
            if (ind < line.length) {
                tile.setAttribute(ATTR.tile_colour, line[ind].toString());
            } else {
                tile.removeAttribute(ATTR.tile_colour);
            }
        });
    }

    update_floor(player_id: number, gamestate: GameState): void {
        const floor = document.getElementById("floor-" + player_id) as HTMLElement;
        const tiles = [...floor.children] as Array<HTMLElement>;
        const pb_floor = gamestate.playerBoards[player_id].floor;

        tiles.forEach((tile, ind) => {
            if (pb_floor[ind] !== undefined) {
                tile.setAttribute(ATTR.tile_colour, pb_floor[ind].toString());
            } else {
                tile.removeAttribute(ATTR.tile_colour);
            }
        });
    }
}
