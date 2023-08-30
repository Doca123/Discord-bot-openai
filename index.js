require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

client.on('ready', () => {
  console.log('The bot is online!✔️');
});

const configuration = new Configuration({
  apiKey: process.env.API_KEY,
  Organization_ID: "org-cXPVU4Rl8V2vF5bBBQEvHx6k",
});

const openai = new OpenAIApi(configuration);

const maxRetries = 3; // Maximum number of retries

async function makeOpenAIRequest(conversationLog) {
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const result = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: conversationLog,
      });
      return result.data.choices[0].message.content;
    } catch (error) {
      if (error.response && error.response.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || 10; // Default to 10 seconds
        console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      } else {
        console.error(`OpenAI API Error: ${error.message}`);
        break;
      }
    }
  }

  return null; // Return null if retries are exhausted
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== process.env.CHANNEL_ID) return;
  if (message.content.startsWith('!')) return;

  let conversationLog = [
    { role: 'system', content: 'You are a bot that responds friendly on all questions.' },
  ];

  try {
    await message.channel.sendTyping();
    
    // Fetch and format previous messages
    let prevMessages = await message.channel.messages.fetch({ limit: 15 });
    prevMessages = [...prevMessages.values()].reverse(); // Convert to array and reverse

    prevMessages.forEach((msg) => {
      if (!msg.author.bot) {
        conversationLog.push({ role: 'user', content: msg.content });
      }
    });

    // Add current user's message to the conversation log
    conversationLog.push({ role: 'user', content: message.content });

    const aiResponse = await makeOpenAIRequest(conversationLog);

    if (aiResponse !== null) {
      message.reply(aiResponse);
    } else {
      console.log('Failed to get a valid response from OpenAI');
    }
  } catch (error) {
    console.log(`Error: ${error}`);
  }
});

client.login(process.env.TOKEN);