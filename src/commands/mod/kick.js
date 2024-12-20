import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getUser, createUser, updateUserLogs } from "../../schemas/user.js";

export default {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kicks a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to kick")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for the kick")
        .setRequired(false)
    )
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1]),

  async execute(interaction) {
    if (!interaction.member.permissions.has([PermissionFlagsBits.KickMembers]))
      return await interaction.reply({
        content: "You don't have permission to use this command",
        ephemeral: true,
      });

    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "Not provided";

    try {
      const guild = interaction.guild;
      await guild.members.kick(user, reason);

      let userData = await getUser(user.id, guild.id);
      let kicks = userData?.kicks || [];

      kicks.push({
        reason,
        by: interaction.user.id,
        createdAt: Date.now(),
      });

      if (!userData) {
        await createUser(user.id, guild.id, { kicks });
      } else {
        await updateUserLogs(user.id, guild.id, "kicks", kicks);
      }

      await interaction.reply(`Kicked <@${user.id}>`);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "An error occurred while kicking the user",
        ephemeral: true,
      });
    }
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has([PermissionFlagsBits.KickMembers]))
      return message.reply("You don't have permission to use this command");

    const userId = args[0]?.replace(/[<@!>]/g, "");
    if (!userId) return message.reply("Please provide a user to kick");

    const reason = args.slice(1).join(" ") || "Not provided";

    try {
      const user = await message.client.users.fetch(userId);
      const guild = message.guild;
      await guild.members.kick(user, reason);

      let userData = await getUser(user.id, guild.id);
      let kicks = userData?.kicks || [];

      kicks.push({
        reason,
        by: message.author.id,
        createdAt: Date.now(),
      });

      if (!userData) {
        await createUser(user.id, guild.id, { kicks });
      } else {
        await updateUserLogs(user.id, guild.id, "kicks", kicks);
      }

      await message.reply(`Kicked <@${user.id}>`);
    } catch (error) {
      console.error(error);
      await message.reply("An error occurred while kicking the user");
    }
  },
};
