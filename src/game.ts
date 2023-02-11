// Handles the running of the game in gui mode
import { GameState, Move, PlayerInterface, PlayerType, Tile } from "azul-tiles";
import { State } from "azul-tiles/dist/state.js";
import { Options } from "./options";
import { GuiDisplay } from "./display";

export class Human implements PlayerInterface {
    type = PlayerType.HUMAN;
    constructor(public id: number, public name: string) {}
    getMove(gs: GameState): Move | undefined {
        return undefined;
    }
    newRound(gs: GameState): void {}
}

// Class that manages the interaction between the game logic, display and players
export class GuiGame {
    gamestate: GameState;
    display: GuiDisplay;

    selected_tile: Tile = Tile.Null;
    selected_factory: number = -1;
    possible_lines: Array<number> = [];

    // Creates a new game with given setup details
    constructor(public players: Array<PlayerInterface>, public opts = new Options()) {
        // Create gamestate
        this.gamestate = new GameState();

        // Start game
        this.gamestate.newGame(this.players.length);

        // Update the display
        this.display = new GuiDisplay(this.gamestate, this.players, this.opts);

        this.assign_callbacks();
    }

    // Replay the game with same seed
    replay() {
        console.log("Replay");
        // Create game with same seed
        const seed = this.gamestate.seed;
        this.gamestate = new GameState();
        this.gamestate.seed = seed;
        // Start game
        this.gamestate.newGame(this.players.length);
        // Reset display
        // this.display.clear()
        // Update the display
        this.display.update_for_end_of_round(this.gamestate);
        // Add callbacks to factory tiles
        this.assign_factory_callbacks();

        // @ts-ignore
        plausible("Tiles Game", { props: { type: "Replay" } });
    }

    // Play with same players
    rematch() {
        console.log("Rematch");
        // Create game with different seed
        this.gamestate = new GameState();
        // Start game
        this.gamestate.newGame(this.players.length);
        // Update display for start of game
        this.display.update_for_end_of_round(this.gamestate);
        // Add callbacks to factory tiles
        this.assign_factory_callbacks();

        // @ts-ignore
        plausible("Tiles Game", { props: { type: "Rematch" } });
    }

    // Start from scratch
    new_game() {
        console.log("New Game");
        // @ts-ignore
        plausible("Tiles Game", { props: { type: "New" } });
        location.reload();
    }

    get_active_player(): PlayerInterface {
        return this.players[this.gamestate.activePlayer];
    }

    assign_callbacks(): void {
        // Add callbacks to factory tiles
        this.assign_factory_callbacks();

        // Add callbacks to lines
        this.players.forEach((player, ind) => {
            if (player.type != PlayerType.HUMAN) {
                return;
            }
            this.display.lines[ind].forEach((line) => {
                line.addEventListener("click", (event) => {
                    this.line_click_callback(event);
                });
            });
        });

        // assign whole screen callback
        document.body.addEventListener("click", (event) => {
            this.screen_click_callback(event);
        });

        // Assign game end button callbacks
        document.getElementById("replay-button")?.addEventListener("click", (event) => {
            this.replay();
        });
        document.getElementById("rematch-button")?.addEventListener("click", (event) => {
            this.rematch();
        });
        document.getElementById("new-game-button")?.addEventListener("click", (event) => {
            this.new_game();
        });
    }

    assign_factory_callbacks(): void {
        this.display.factories.forEach((factory, ind) => {
            const tiles = [...factory.children];
            tiles.forEach((tile) => {
                tile.addEventListener("click", (event) => {
                    this.factory_tile_callback(event);
                });
            });
        });
    }

    factory_tile_callback(event: Event): void {
        // Check if its an AI turn, then let event propagate
        if (this.get_active_player().type != PlayerType.HUMAN) {
            return;
        }
        // Prevent event from reaching upper elements
        event.stopPropagation();

        // Clear all current highlights and selection
        this.clear_selected();

        // Get tile info
        const tile_elem = event.target as HTMLElement;
        const tile_str = tile_elem.getAttribute("tile-colour");
        if (tile_str == undefined) {
            // centre factory with no tile

            return;
        }
        const tile = parseInt(tile_str);

        // Get factory info
        const factory_elem = tile_elem.parentElement as HTMLElement;
        const factory_id = parseInt(factory_elem.getAttribute("factory-id") as string);

        // Highlight factory tiles
        this.display.highlight_factory_tiles(event.target as HTMLElement);

        // Highlight possible lines
        const moves = this.gamestate.availableMoves.filter((move) => {
            if (move.factory == factory_id && move.tile == tile) {
                return true;
            } else {
                return false;
            }
        });
        const lines = moves.reduce<Array<number>>((lines, move) => {
            lines.push(move.line);
            return lines;
        }, []);

        this.display.highlight_lines(this.gamestate.activePlayer, lines);

        // Record info for move
        this.possible_lines = lines;
        this.selected_tile = tile;
        this.selected_factory = factory_id;
    }

    line_click_callback(event: Event): void {
        // If not Human go, not interested
        if (this.get_active_player().type != PlayerType.HUMAN) {
            return;
        }

        event.stopPropagation();
        if (this.selected_factory != -1 && this.selected_tile != Tile.Null) {
            // get line id
            const line_elem = event.currentTarget as HTMLElement;
            const line_id = parseInt(line_elem.getAttribute("line-id") as string);
            if (this.possible_lines.includes(line_id)) {
                // double check its a possible move
                const move = this.check_move(
                    this.get_active_player().id,
                    this.selected_tile,
                    this.selected_factory,
                    line_id,
                ) as Move;
                this.gamestate.playMove(move);
                this.gamestate.nextTurn();
                this.display.update_with_move(move, this.gamestate);
                this.clear_selected();
                this.autoplay_move();
            }
        } else {
            this.clear_selected();
        }
    }

    clear_selected(): void {
        this.display.clear_factory_highlights();
        this.display.clear_line_highlights();
        this.selected_factory = -1;
        this.selected_tile = Tile.Null;
        this.possible_lines = [];
    }

    screen_click_callback(event: Event): void {
        // Perform different action depending on game state
        switch (this.gamestate.state) {
            case State.turn:
                const activePlayer = this.get_active_player();
                switch (activePlayer.type) {
                    case PlayerType.AI:
                        // Play the AI move
                        const move = activePlayer.getMove(this.gamestate) as Move;
                        this.gamestate.playMove(move);
                        this.gamestate.nextTurn();
                        // Update the screen
                        this.display.update_with_move(move, this.gamestate);
                        this.autoplay_move();

                        break;
                    case PlayerType.HUMAN:
                        this.clear_selected();
                        break;
                }
                break;
            case State.endOfTurns:
                // Either new round with player turn or end of game after this
                if (!this.gamestate.endRound()) {
                    //  Game has finished
                    const player0 = this.players[0];
                    const player1 = this.players[1];
                    const player = player0.name;
                    const opponent = player1.name;
                    let matchup = "";
                    if (player0.type == PlayerType.HUMAN) {
                        if (player1.type == PlayerType.HUMAN) {
                            matchup = "Human v Human";
                        } else {
                            matchup = "Human v AI";
                        }
                    } else {
                        if (player1.type == PlayerType.HUMAN) {
                            matchup = "AI v Human";
                        } else {
                            matchup = "AI v AI";
                        }
                    }
                    // Winner type
                    let type = "Draw";
                    if (this.gamestate.winner.length == 1) {
                        const id = this.gamestate.winner[0];
                        const winner = this.players[id];

                        switch (winner.type) {
                            case PlayerType.HUMAN:
                                type = "Human";
                                break;
                            case PlayerType.AI:
                                type = "AI";
                                break;
                        }
                        const margin = this.gamestate.playerBoards[0].score - this.gamestate.playerBoards[1].score;
                        // Check matchup type

                        // @ts-ignore
                        plausible("Tiles Game Finish", {
                            props: {
                                winner: winner.name,
                                player: player,
                                opponent: opponent,
                                winner_type: type,
                                margin: margin,
                                matchup: matchup,
                            },
                        });
                    } else {
                        // @ts-ignore
                        plausible("Tiles Game Finish", {
                            props: {
                                winner: "",
                                player: player,
                                opponent: opponent,
                                winner_type: type,
                                margin: 0,
                                matchup: matchup,
                            },
                        });
                    }
                }
                this.display.update_for_end_of_round(this.gamestate);
                this.assign_factory_callbacks();
                break;
        }
    }

    check_move(player: number, tile: Tile, factory: number, line: number) {
        const moves = this.gamestate.availableMoves.filter((move) => {
            if (move.factory == factory && move.tile == tile && move.line == line && move.player == player) {
                return true;
            } else {
                return false;
            }
        });
        if (moves.length == 1) {
            return moves[0];
        } else {
            Error("${moves.length} moves match");
        }
    }

    autoplay_move() {
        if (!this.opts.autoplay) {
            return;
        }
        if (this.get_active_player().type == PlayerType.AI) {
            this.screen_click_callback(new Event("autoplay"));
        }
    }
}
