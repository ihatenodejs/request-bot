require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const moment = require('moment');

const bot = new Telegraf(process.env.BOT_TOKEN);

const questions = [
    "Are you submitting an app (1) or a module (2)? You may only respond with 1 or 2.",
    "What is the name of the app or module?",
    "Where can I find an icon of the app or module? If there is none, simply enter https://nothing.com",
    "What is the GitHub/Source of the app or module? If there is none, simply enter https://nothing.com",
    "Do you have any other comments?"
];

const labels = ["type", "name", "icon", "source", "comments"];
let userResponses = {};
const userSummary = {};

if (fs.existsSync('responses.json')) {
    const data = fs.readFileSync('responses.json');
    userResponses = JSON.parse(data);
}

bot.use((ctx, next) => {
    console.log(ctx.message);
    return next();
});

bot.start((ctx) => ctx.reply(`Hey there! You can call me RequestBot. Did you know I'm FOSS?! Use /help if you need any :)`));

bot.help((ctx) => {
    let helpMessage = '<b>Commands:</b>\n\n' +
                      '/start - Start bot (not really useful)\n' +
                      '/help - Get help (you know this one!)\n' +
                      '/new - Start a new request\n' +
                      '/status - Check the status of your requests\n' +
                      '/check [requestid] - View details of a specific request\n\n';
    if (ctx.from.id.toString() === process.env.ADMIN_ID) {
        helpMessage += '<b>Admin Commands:</b>\n\n' +
                       '/requests - List all requests\n' +
                       '/view [id] - View details of a user and their requests\n' +
                       '/view [userid] [requestid] - View details of a user\'s request\n' +
                       '/accept [userid] [requestid] - Accept a request\n' +
                       '/decline [userid] [requestid] - Decline a request\n';
    }
    ctx.replyWithHTML(helpMessage);
});

bot.command('new', (ctx) => {
    const chatId = ctx.chat.id;
    if (!userResponses[chatId]) {
        userResponses[chatId] = [];
    }
    userResponses[chatId].push({ 
        step: 0, 
        responses: {}, 
        timestamp: Math.floor(Date.now() / 1000), 
        username: ctx.from.username, 
        firstName: ctx.from.first_name,
        status: 'pending'
    });
    ctx.reply(questions[0]);
    fs.writeFileSync('responses.json', JSON.stringify(userResponses, null, 2));
});

bot.command('status', (ctx) => {
    const chatId = ctx.chat.id;
    if (userResponses[chatId] && userResponses[chatId].length > 0) {
        let responseText = '<b>My Requests:</b>\n\n';
        userResponses[chatId].forEach((request, index) => {
            responseText += `[${index + 1}] ${request.status.toUpperCase()} - ${request.responses.name || 'N/A'}\n`;
        });
        responseText += '\nUse /check [id] to view the request.';
        ctx.replyWithHTML(responseText);
    } else {
        ctx.reply(`You don't have any requests to view.`);
    }
});

bot.command('check', (ctx) => {
    const text = ctx.message.text;
    const args = text.split(' ');
    if (args.length === 2) {
        const chatId = ctx.chat.id;
        const requestId = parseInt(args[1]) - 1;
        if (userResponses[chatId] && userResponses[chatId][requestId]) {
            const request = userResponses[chatId][requestId];
            let responseText = `<b>My Request - #${requestId + 1}</b>\n\n`;
            responseText += `Timestamp: ${moment.unix(request.timestamp).format('MMMM Do YYYY, h:mm:ss a')}\n`;
            responseText += `Status: ${request.status}\n\n`;
            responseText += `Request:\n\n`;
            for (const [key, value] of Object.entries(request.responses)) {
                responseText += `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value || 'N/A'}\n`;
            }
            ctx.replyWithHTML(responseText);
        } else {
            ctx.reply('Invalid request ID.');
        }
    } else {
        ctx.reply('Invalid command. Try doing /check [requestid].');
    }
});

bot.command('requests', (ctx) => {
    if (ctx.from.id.toString() === process.env.ADMIN_ID) {
        if (Object.keys(userResponses).length === 0) {
            ctx.reply(`Sorry, there aren't any requests yet!`);
            return;
        }
        let responseText = '<b>Requests:</b>\n\n';
        let index = 1;
        let hasPendingRequests = false;
        for (const [chatId, requests] of Object.entries(userResponses)) {
            const pendingRequests = requests.filter(request => request.status === 'pending').length;
            if (pendingRequests > 0) {
                responseText += `[${index}] <b>${pendingRequests}</b> new requests from @${requests[0].username}\n`;
                userSummary[index] = { chatId, username: requests[0].username, totalRequests: requests.length, pendingRequests };
                index++;
                hasPendingRequests = true;
            }
        }
        if (!hasPendingRequests) {
            ctx.reply(`Sorry, there aren't any requests yet!`);
        } else {
            responseText += '\nPlease select a user to view with /view [id].';
            ctx.replyWithHTML(responseText);
        }
    } else {
        ctx.reply(`Hey, you aren't allowed to use that command!`);
    }
});

bot.command('view', (ctx) => {
    const text = ctx.message.text;
    const args = text.split(' ');
    if (args.length === 2 && ctx.from.id.toString() === process.env.ADMIN_ID && userSummary[args[1]]) {
        const summary = userSummary[args[1]];
        const lastRequest = userResponses[summary.chatId][userResponses[summary.chatId].length - 1];
        const lastRequestTime = moment.unix(lastRequest.timestamp).fromNow();
        let responseText = `<b>@${summary.username}</b>\nUser ID: ${summary.chatId}\n\n`;
        responseText += `Requests Sent (Lifetime): ${summary.totalRequests}\n`;
        responseText += `New Requests (Pending): ${summary.pendingRequests}\n`;
        responseText += `Request Last Sent: ${lastRequestTime}\n\n`;
        userResponses[summary.chatId].forEach((request, index) => {
            if (request.status === 'pending') {
                responseText += `[${index + 1}] ${request.responses.name || 'N/A'}\n`;
            }
        });
        ctx.replyWithHTML(responseText);
    } else if (args.length === 3 && ctx.from.id.toString() === process.env.ADMIN_ID) {
        const chatId = args[1];
        const requestId = parseInt(args[2]) - 1;
        if (userResponses[chatId] && userResponses[chatId][requestId]) {
            const request = userResponses[chatId][requestId];
            let responseText = `<b>Request from @${request.username}</b>\n\n`;
            responseText += `Timestamp: ${moment.unix(request.timestamp).format('MMMM Do YYYY, h:mm:ss a')}\n`;
            responseText += `Status: ${request.status}\n\n`;
            responseText += `Request:\n\n`;
            for (const [key, value] of Object.entries(request.responses)) {
                responseText += `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value || 'N/A'}\n`;
            }
            ctx.replyWithHTML(responseText);
        } else {
            ctx.reply('Invalid user ID or request ID.');
        }
    } else {
        ctx.reply(`You entered an invalid command or aren't allowed to use this!`);
    }
});

bot.command('accept', (ctx) => {
    const text = ctx.message.text;
    const args = text.split(' ');
    if (args.length === 3 && ctx.from.id.toString() === process.env.ADMIN_ID) {
        const chatId = args[1];
        const requestId = parseInt(args[2]) - 1;
        if (userResponses[chatId] && userResponses[chatId][requestId]) {
            userResponses[chatId][requestId].status = 'accepted';
            fs.writeFileSync('responses.json', JSON.stringify(userResponses, null, 2));
            ctx.reply(`Request ${requestId + 1} from @${userResponses[chatId][requestId].username} has been accepted.`);
        } else {
            ctx.reply('Invalid user ID or request ID.');
        }
    } else {
        ctx.reply(`You entered an invalid command or aren't allowed to use this!`);
    }
});

bot.command('decline', (ctx) => {
    const text = ctx.message.text;
    const args = text.split(' ');
    if (args.length === 3 && ctx.from.id.toString() === process.env.ADMIN_ID) {
        const chatId = args[1];
        const requestId = parseInt(args[2]) - 1;
        if (userResponses[chatId] && userResponses[chatId][requestId]) {
            userResponses[chatId][requestId].status = 'declined';
            fs.writeFileSync('responses.json', JSON.stringify(userResponses, null, 2));
            ctx.reply(`Request ${requestId + 1} from @${userResponses[chatId][requestId].username} has been declined.`);
        } else {
            ctx.reply('Invalid user ID or request ID.');
        }
    } else {
        ctx.reply(`You entered an invalid command or aren't allowed to use this!`);
    }
});

bot.on('text', (ctx) => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text;

    if (userResponses[chatId] && userResponses[chatId].length > 0 && userResponses[chatId][userResponses[chatId].length - 1].step < questions.length) {
        const currentRequest = userResponses[chatId][userResponses[chatId].length - 1];
        if (currentRequest.step === 0 && (text !== '1' && text !== '2')) {
            ctx.reply('Please respond with either 1 or 2.');
            return;
        }
        if (currentRequest.step === 3 && !text.match(/https?:\/\/[^\s]+/)) {
            ctx.reply('Please provide a valid link. A link should look like: https://example.com');
            return;
        }

        currentRequest.responses[labels[currentRequest.step]] = text;
        currentRequest.step += 1;

        if (currentRequest.step < questions.length) {
            ctx.reply(questions[currentRequest.step]);
        } else {
            fs.writeFileSync('responses.json', JSON.stringify(userResponses, null, 2));
            ctx.reply('Thank you for your responses!');
        }
    } else if (text.startsWith('/')) {
        ctx.reply('Please complete the current process by answering the questions.');
    } else {
        ctx.reply(`Why are you talking to me? Create a request and stop blabbing about "${text}"`);
    }
});

bot.action(/setstatus_(.+)/, (ctx) => {
    if (ctx.from.id.toString() === process.env.ADMIN_ID) {
        const [chatId, requestIndex, status] = ctx.match[1].split('_');
        userResponses[chatId][requestIndex].status = status;
        fs.writeFileSync('responses.json', JSON.stringify(userResponses, null, 2));
        ctx.reply(`Status of request ${parseInt(requestIndex) + 1} from ${userResponses[chatId][requestIndex].firstName} (@${userResponses[chatId][requestIndex].username}) has been updated to ${status}.`);
    } else {
        ctx.reply(`Hey, you aren't allowed to use that command!`);
    }
});

bot.launch().then(() => {
    console.log('Bot is up');
}).catch(err => {
    console.error('FAIL:', err);
});