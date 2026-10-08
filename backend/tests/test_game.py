"""The draw-and-guess game, played over the room WebSocket."""

import time
from contextlib import ExitStack

import pytest

from backend import game
from backend.seed import DEFAULT_THEMES
from backend.tests.helpers import joined, messages_until, receive_until, ws_url

STROKE = {"tool": "brush", "from": {"x": 1, "y": 2}, "to": {"x": 3, "y": 4}, "color": "#ff0000", "size": 5}


@pytest.fixture
def table(client, create_user, create_room):
    """Open a room, seat players in it (first one is the host) and let tests make players leave."""
    stacks: list[ExitStack] = []

    def _open(players: int = 2, **room_settings):
        users = [create_user(name) for name in ("ana", "bob", "cid")[:players]]
        settings = {"round_time": 30, "max_rounds": 1, "target_score": 1000} | room_settings
        room = create_room(users[0], **settings)
        sockets = []
        for user in users:
            stack = ExitStack()
            stacks.append(stack)
            sockets.append(stack.enter_context(joined(client, room["code"], user)))
        return room, users, sockets, stacks

    yield _open
    for stack in reversed(stacks):
        stack.close()


def start_turn(sockets):
    """Start the game and return each player's copy of the first TURN_START payload."""
    sockets[0].send_json({"type": "START_GAME"})
    return [receive_until(ws, "TURN_START")["payload"] for ws in sockets]


def guess(ws, text):
    ws.send_json({"type": "CHAT", "payload": {"message": text}})


def wait_for(condition, timeout=2.0):
    deadline = time.monotonic() + timeout
    while not condition():
        assert time.monotonic() < deadline, "condition not met in time"
        time.sleep(0.02)


# --- Rules ---


def test_normalize_ignores_case_spacing_and_punctuation():
    assert game.normalize("  Pirate-Ship! ") == game.normalize("pirate ship")


def test_word_hint_hides_letters_but_keeps_the_shape():
    assert game.word_hint("pirate ship") == "______ ____"


@pytest.mark.parametrize(("seconds_left", "points"), [(60, 20), (30, 15), (0, 10), (-5, 10)])
def test_faster_guesses_score_more(seconds_left, points):
    assert game.guess_points(seconds_left, duration=60) == points


# --- Starting a game ---


def test_a_game_needs_at_least_two_players(table):
    _, _, (ana_ws,), _ = table(players=1)

    ana_ws.send_json({"type": "START_GAME"})

    assert receive_until(ana_ws, "ERROR")["payload"] == {"message": "At least 2 players are needed to start a game."}


def test_starting_twice_does_not_start_a_second_game(table):
    _, _, (ana_ws, bob_ws), _ = table()
    start_turn([ana_ws, bob_ws])

    bob_ws.send_json({"type": "START_GAME"})

    assert receive_until(bob_ws, "ERROR")["payload"] == {"message": "A game is already running in this room."}


def test_only_the_drawer_sees_the_word(client, table):
    room, (ana, _), sockets, _ = table()

    for_drawer, for_guesser = start_turn(sockets)

    assert for_drawer["word"] in DEFAULT_THEMES
    assert for_drawer["drawer"] == {"id": ana.id, "username": "ana"}
    assert "word" not in for_guesser
    assert for_guesser["hint"] == game.word_hint(for_drawer["word"])
    assert (for_guesser["round"], for_guesser["maxRounds"], for_guesser["timeLeft"]) == (1, 1, 30)
    assert client.get(f"/rooms/{room['code']}").json()["status"] == "in_progress"


# --- Guessing ---


def test_correct_guess_scores_and_ends_the_turn_once_everyone_guessed(table):
    _, (ana, bob), (ana_ws, bob_ws), _ = table()
    word = start_turn([ana_ws, bob_ws])[0]["word"]

    guess(bob_ws, f"  {word.upper()}! ")

    ana_messages = messages_until(ana_ws, "TURN_END")
    correct = next(m["payload"] for m in ana_messages if m["type"] == "CORRECT_GUESS")
    assert correct["player"] == {"id": bob.id, "username": "bob"}
    assert 10 <= correct["points"] <= 20
    assert {s["id"]: s["score"] for s in correct["scores"]} == {ana.id: 5, bob.id: correct["points"]}
    assert ana_messages[-1]["payload"]["word"] == word
    assert "CHAT" not in [m["type"] for m in ana_messages]  # the guess itself stays secret
    assert receive_until(bob_ws, "WORD")["payload"] == {"word": word}


def test_wrong_guess_is_shared_in_the_chat(table):
    _, _, (ana_ws, bob_ws), _ = table()
    start_turn([ana_ws, bob_ws])

    guess(bob_ws, "definitely not it")

    assert receive_until(ana_ws, "CHAT")["payload"] == {"user": "bob", "message": "definitely not it"}


def test_players_who_know_the_word_cannot_write_it(table):
    _, _, (ana_ws, bob_ws, cid_ws), _ = table(players=3)
    word = start_turn([ana_ws, bob_ws, cid_ws])[0]["word"]
    guess(bob_ws, word)

    guess(ana_ws, f"hint: it's a {word}")  # the drawer
    guess(bob_ws, f"it was {word}!")  # already guessed
    guess(bob_ws, "nice one")

    assert receive_until(ana_ws, "ERROR")["payload"]["message"].startswith("No spoilers")
    assert receive_until(bob_ws, "ERROR")["payload"]["message"].startswith("No spoilers")
    assert receive_until(cid_ws, "CHAT")["payload"]["message"] == "nice one"


def test_only_the_drawer_can_draw(table):
    _, _, (ana_ws, bob_ws), _ = table()
    start_turn([ana_ws, bob_ws])

    bob_ws.send_json({"type": "DRAW", "payload": STROKE})
    ana_ws.send_json({"type": "DRAW", "payload": STROKE})
    guess(bob_ws, "checking")

    assert receive_until(bob_ws, "DRAW")["payload"] == STROKE
    assert "DRAW" not in [m["type"] for m in messages_until(ana_ws, "CHAT")]


# --- Ending ---


def test_everyone_draws_once_per_round_and_the_best_scorer_wins(client, table):
    room, (ana, bob), (ana_ws, bob_ws), _ = table(round_time=2)
    first_turn = start_turn([ana_ws, bob_ws])[0]
    assert first_turn["drawer"]["id"] == ana.id

    guess(bob_ws, first_turn["word"])
    receive_until(bob_ws, "TURN_END")
    second_turn = receive_until(bob_ws, "TURN_START")["payload"]
    assert second_turn["drawer"]["id"] == bob.id
    # Nobody guesses Bob's word, so his turn simply runs out.

    results = receive_until(ana_ws, "GAME_END")["payload"]
    assert [entry["username"] for entry in results["leaderboard"]] == ["bob", "ana"]
    assert results["leaderboard"][1]["score"] == 5
    assert results["winners"] == [bob.id]

    wait_for(lambda: client.get(f"/rooms/{room['code']}").json()["status"] == "open")
    ana_ws.send_json({"type": "GET_EXISTING_PLAYERS"})
    saved = {p["username"]: p["score"] for p in receive_until(ana_ws, "EXISTING_PLAYERS")["payload"]}
    assert saved == {e["username"]: e["score"] for e in results["leaderboard"]}


def test_reaching_the_target_score_ends_the_game_early(table):
    _, (_, bob), (ana_ws, bob_ws), _ = table(max_rounds=3, target_score=1)
    word = start_turn([ana_ws, bob_ws])[0]["word"]

    guess(bob_ws, word)

    turns = [m["type"] for m in messages_until(ana_ws, "GAME_END") if m["type"].startswith("TURN")]
    assert turns == ["TURN_END"]  # no second turn was started
    assert receive_until(bob_ws, "GAME_END")["payload"]["winners"] == [bob.id]


def test_drawer_leaving_ends_the_turn_and_a_lone_player_ends_the_game(table):
    _, (_, bob), (ana_ws, bob_ws), stacks = table()
    word = start_turn([ana_ws, bob_ws])[0]["word"]

    stacks[0].close()  # Ana, the drawer, leaves

    messages = messages_until(bob_ws, "GAME_END")
    assert [m["type"] for m in messages[-3:]] == ["PLAYER_LEAVE", "TURN_END", "GAME_END"]
    assert messages[-2]["payload"]["word"] == word
    assert messages[-1]["payload"] == {"leaderboard": [{"id": bob.id, "username": "bob", "score": 0}], "winners": []}


def test_player_joining_mid_turn_catches_up(client, create_user, table):
    room, (ana, _), (ana_ws, bob_ws), _ = table()
    start_turn([ana_ws, bob_ws])
    second_stroke = {**STROKE, "color": "#0000ff"}
    for action in (STROKE, {"tool": "clear"}, second_stroke):
        ana_ws.send_json({"type": "DRAW", "payload": action})
    for _ in range(3):
        receive_until(bob_ws, "DRAW")

    with client.websocket_connect(ws_url(room["code"], create_user("cid"))) as cid_ws:
        types = [cid_ws.receive_json()["type"] for _ in range(2)]
        turn = cid_ws.receive_json()
        canvas = cid_ws.receive_json()

    assert types == ["WELCOME", "EXISTING_PLAYERS"]
    assert turn["type"] == "TURN_START"
    assert turn["payload"]["drawer"]["id"] == ana.id
    assert "word" not in turn["payload"]
    assert 0 < turn["payload"]["timeLeft"] <= 30
    # Clearing the canvas also clears the history, so only the last stroke is replayed.
    assert canvas == {"type": "CANVAS_STATE", "payload": {"actions": [second_stroke]}}
