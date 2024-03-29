const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  GuildMember,
} = require("discord.js");
const Game = require("../../models/game.js");
const getMembersRole = require("../../utils/getMembersRole");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('follow-games')
    .setDescription('Choose the games that you play.'),

  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  execute: async (interaction) => {
    /**
     * @type {GuildMember} user
     */
    const user = interaction.member;
    const { value: usersRole, rank } = await getMembersRole(user);

    if (usersRole < rank.member) {
      interaction.editReply({
        content: `You don't have permission to use this command.`,
      });
      return;
    }

    const games = await Game.find({}).sort({ name: 'asc' }).exec();

    let page = 0;
    const numPages = Math.ceil(games.length / 20);

    while (true) {
      const actionRows = [];

      for (let row = 0; row < 4; row++) {
        if (page*20 + row*5 >= games.length) break;

        const actionRow = new ActionRowBuilder();
        
        for (let i = 0; i < 5; i++) {
          const gameIndex = page*20 + row*5 + i;
          if (gameIndex >= games.length) break;

          const gameIsFollowed = user.roles.cache.some((r) => r.id === games[gameIndex].roleId);

          const gameButton = new ButtonBuilder()
            .setCustomId(`${gameIndex}`)
            .setLabel(`💠 ${games[gameIndex].name}`)
            .setStyle((gameIsFollowed)? ButtonStyle.Success : ButtonStyle.Secondary);

          actionRow.addComponents(gameButton);
        }
        actionRows.push(actionRow);
      }

      const previousPageButton = new ButtonBuilder()
        .setCustomId('previous')
        .setLabel('← Last Page')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page < 1);

      const nextPageButton = new ButtonBuilder()
        .setCustomId('next')
        .setLabel('Next Page →')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === numPages-1);

      const pageRow = new ActionRowBuilder()
        .addComponents(previousPageButton, nextPageButton);

      actionRows.push(pageRow);

      const response = await interaction.editReply({
        content: `Page ${page+1} of ${numPages}`,
        components: actionRows,
      });

      const input = await response.awaitMessageComponent();
      await input.update({ fetchReply: false });

      if (input.customId === 'next') {
        page++;
        continue;
      }
      else if (input.customId === 'previous') {
        page--;
        continue;
      }
      // Otherwise, input.customId === gameIndex
      const gameRoleId = games[parseInt(input.customId)].roleId;
      const gameRole = interaction.guild.roles.cache.get(gameRoleId);

      if (user.roles.cache.some((r) => r.id === gameRoleId)) {
        await user.roles.remove(gameRole);
      }
      else {
        await user.roles.add(gameRole);
      }
    }
  },
};
