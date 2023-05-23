const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { EMBED_COLORS } = require("@root/config.js");
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

// Importing OpenAI API Key from .env file
const apiKey = process.env.OPENAI;

// Configuring the OpenAI API with the API Key
const configuration = new Configuration({ apiKey });
const openai = new OpenAIApi(configuration);

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "ask-gpt",
  description: "Ask ChatGPT a question",
  category: "UTILITY",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "<question>",
    aliases: ["gpt"],
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "question",
        description: "question to ask ChatGPT",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const question = args.join(" ");
    const response = await askGpt(question, message.author);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const question = interaction.options.getString("question");
    const response = await askGpt(question, interaction.user);
    await interaction.followUp(response);
  },
};

async function askGpt(question, user) {
  const completions = await openai.createCompletion({
    model: "text-davinci-003",
    max_tokens: 2048,
    temperature: 0.5,
    prompt: question,
  });

  const answer = completions.choices[0].text;

  const embed = new EmbedBuilder()
    .setAuthor({ name: "❯ ChatGPT Response ❮" })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(answer)
    .setFooter({ text: `Requested by ${user.tag}` });

  return { embeds: [embed] };
}
