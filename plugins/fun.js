const axios = require('axios');

// Natively embedded, zero-dependency TicTacToe Game Engine
class TicTacToeGame {
    constructor(playerX, playerO) {
        this.playerX = playerX;
        this.playerO = playerO || '';
        this.board = Array(9).fill(null);
        this.currentTurn = playerX;
        this.turns = 0;
    }
    turn(player, index) {
        if (player !== this.currentTurn) return false;
        if (index < 0 || index > 8 || this.board[index]) return false;
        this.board[index] = player === this.playerX ? 'X' : 'O';
        this.currentTurn = player === this.playerX ? this.playerO : this.playerX;
        this.turns++;
        return true;
    }
    get winner() {
        const wins = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (const [a, b, c] of wins) {
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                return this.board[a] === 'X' ? this.playerX : this.playerO;
            }
        }
        return null;
    }
    render() {
        return this.board.map((v, i) => v || (i + 1).toString());
    }
}

const tictactoeGames = {};

module.exports = {
    commands: ['dare', 'truth', 'tictactoe', 'ttt', 'ship', 'wasted', 'rip', 'trivia', 'character'],
    execute: async (sock, msg, context) => {
        const { command, from, sender, args, query, PERSONA_PREFIX, isGroup } = context;
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        // Dynamic TicTacToe Move Parser (Runs if the user is in an active game and types 1-9 or surrender)
        const activeRoom = Object.values(tictactoeGames).find(r => r.state === 'PLAYING' && [r.game.playerX, r.game.playerO].includes(sender) && r.o === from);
        if (activeRoom && command === 'ttt') {
            const moveText = args[0];
            const isSurrender = /^(surrender|give up)$/i.test(moveText);
            
            if (sender !== activeRoom.game.currentTurn && !isSurrender) {
                await sock.sendMessage(from, { text: PERSONA_PREFIX + "It is not your turn, mortal." }, { quoted: msg });
                return;
            }

            let success = isSurrender ? true : activeRoom.game.turn(sender, parseInt(moveText) - 1);
            if (!success) {
                await sock.sendMessage(from, { text: PERSONA_PREFIX + "Invalid move. That coordinates block is occupied." }, { quoted: msg });
                return;
            }

            let winner = activeRoom.game.winner;
            if (isSurrender) {
                winner = sender === activeRoom.game.playerX ? activeRoom.game.playerO : activeRoom.game.playerX;
                await sock.sendMessage(from, { text: `${PERSONA_PREFIX}@${sender.split('@')[0]} has surrendered! @${winner.split('@')[0]} wins the board!`, mentions: [sender, winner] });
                delete tictactoeGames[activeRoom.id];
                return;
            }

            const board = activeRoom.game.render().map(v => ({ 'X': '❎', 'O': '⭕', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣', '4': '4️⃣', '5': '5️⃣', '6': '6️⃣', '7': '7️⃣', '8': '8️⃣', '9': '9️⃣' }[v]));
            let status = "";
            if (winner) {
                status = `🎉 @${winner.split('@')[0]} wins the board!`;
            } else if (activeRoom.game.turns === 9) {
                status = `🤝 Match ended in a draw!`;
            } else {
                status = `🎲 Turn: @${activeRoom.game.currentTurn.split('@')[0]}`;
            }

            const boardText = `${PERSONA_PREFIX}*🎮 TicTacToe Game 🎮*\n\n${status}\n\n${board.slice(0, 3).join('')}\n${board.slice(3, 6).join('')}\n${board.slice(6).join('')}\n\n_Type \`.ttt [number]\` (1-9) to play or \`.ttt surrender\` to quit._`;
            await sock.sendMessage(from, { text: boardText, mentions: [activeRoom.game.playerX, activeRoom.game.playerO, activeRoom.game.currentTurn] });

            if (winner || activeRoom.game.turns === 9) {
                delete tictactoeGames[activeRoom.id];
            }
            return;
        }

        switch (command) {
            case 'tictactoe':
            case 'ttt': {
                if (!isGroup) return;
                if (Object.values(tictactoeGames).find(r => [r.game.playerX, r.game.playerO].includes(sender))) {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "You are already active in a game. Type `.ttt surrender` to quit." }, { quoted: msg });
                    return;
                }

                let room = Object.values(tictactoeGames).find(r => r.state === 'WAITING' && r.x === from);
                if (room) {
                    room.o = from;
                    room.game.playerO = sender;
                    room.state = 'PLAYING';
                    const board = room.game.render().map(v => ({ 'X': '❎', 'O': '⭕', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣', '4': '4️⃣', '5': '5️⃣', '6': '6️⃣', '7': '7️⃣', '8': '8️⃣', '9': '9️⃣' }[v]));
                    const startText = `*🎮 TicTacToe Game Started!* 🎮\n\nWaiting for @${room.game.currentTurn.split('@')[0]} to play...\n\n${board.slice(0, 3).join('')}\n${board.slice(3, 6).join('')}\n${board.slice(6).join('')}\n\n_Type \`.ttt [number]\` to make your move._`;
                    await sock.sendMessage(from, { text: startText, mentions: [room.game.currentTurn, room.game.playerX, room.game.playerO] });
                } else {
                    room = { id: 'tictactoe-' + Date.now(), x: from, o: '', game: new TicTacToeGame(sender, 'o'), state: 'WAITING' };
                    tictactoeGames[room.id] = room;
                    await sock.sendMessage(from, { text: `⏳ *Waiting for an opponent...*\nType \`.ttt\` to join this room!` });
                }
                break;
            }

            case 'dare':
            case 'truth': {
                try {
                    const { data } = await axios.get(`https://api.shizo.top/api/quote/${command}?apikey=knightbot`);
                    if (data?.result) {
                        await sock.sendMessage(from, { text: `*${command.toUpperCase()}*\n\n${data.result}` }, { quoted: msg });
                    }
                } catch {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "The oracle of games is currently silent." }, { quoted: msg });
                }
                break;
            }

            case 'ship': {
                if (!isGroup) return;
                const metadata = await sock.groupMetadata(from);
                const participants = metadata.participants.map(p => p.id);
                if (participants.length < 2) return;

                const user1 = participants[Math.floor(Math.random() * participants.length)];
                let user2 = participants[Math.floor(Math.random() * participants.length)];
                while (user1 === user2) {
                    user2 = participants[Math.floor(Math.random() * participants.length)];
                }

                const shipText = `*New Ship Alert!* 💘\n\n@${user1.split('@')[0]} ❤️ @${user2.split('@')[0]}\n\nA new bond has been forged in the fires of fate.`;
                await sock.sendMessage(from, { text: shipText, mentions: [user1, user2] }, { quoted: msg });
                break;
            }

            case 'wasted':
            case 'rip': {
                const target = m.mentionedJid?.[0] || msg.message.extendedTextMessage?.contextInfo?.participant || sender;
                const proc = await sock.sendMessage(from, { text: "_Applying the seal of death..._" }, { quoted: msg });
                try {
                    let pfpUrl = await sock.profilePictureUrl(target, 'image').catch(() => 'https://i.ibb.co/6yT1W9N/default-pfp.jpg');
                    const response = await axios.get(`https://some-random-api.com/canvas/overlay/wasted?avatar=${encodeURIComponent(pfpUrl)}`, { responseType: 'arraybuffer' });
                    await sock.sendMessage(from, { image: response.data, caption: `*Wasted* : @${target.split('@')[0]} 💀\n\n_This world shall know pain._`, mentions: [target] }, { quoted: msg });
                    await sock.sendMessage(from, { delete: proc.key });
                } catch {
                    await sock.sendMessage(from, { text: PERSONA_PREFIX + "Failed to apply wasted overlay.", edit: proc.key });
                }
                break;
            }

            case 'character': {
                const target = m.mentionedJid?.[0] || msg.message.extendedTextMessage?.contextInfo?.participant || sender;
                const pfpUrl = await sock.profilePictureUrl(target, 'image').catch(() => 'https://i.ibb.co/6yT1W9N/default-pfp.jpg');
                const traits = ["Intelligent", "Creative", "Determined", "Ambitious", "Caring", "Charismatic", "Confident", "Empathetic", "Kind", "Logical", "Loyal", "Wise"];
                
                const selected = [];
                while (selected.length < 3) {
                    const trait = traits[Math.floor(Math.random() * traits.length)];
                    if (!selected.includes(trait)) selected.push(trait);
                }

                const traitPercentages = selected.map(t => `> ${t}: *${Math.floor(Math.random() * 41) + 60}%*`).join('\n');
                const analysis = `*Character Analysis for @${target.split('@')[0]}*\n\n*✨ Key Traits:*\n${traitPercentages}\n\n*🎯 Overall Rating:* ${Math.floor(Math.random() * 21) + 80}%\n\n_Note: This analysis is for entertainment purposes only._`;
                await sock.sendMessage(from, { image: { url: pfpUrl }, caption: analysis, mentions: [target] }, { quoted: msg });
                break;
            }
        }
    }
};
