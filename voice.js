const { joinVoiceChannel, createAudioPlayer, createAudioResource, StreamType } = require('@discordjs/voice');

const audioPlayer = createAudioPlayer();
let voiceConnection = null;

function playText(text) {
  const resource = createAudioResource(text, {
    inputType: StreamType.Arbitrary,
  });

  if (voiceConnection) {
    audioPlayer.play(resource);
  }
}

function joinVoiceChannelCommand(guildId, channelId) {
  voiceConnection = joinVoiceChannel({
    channelId: channelId,
    guildId: guildId,
    adapterCreator: channelId.guild.voiceAdapterCreator,
  });
}

module.exports = {
  playText,
  joinVoiceChannelCommand,
};

