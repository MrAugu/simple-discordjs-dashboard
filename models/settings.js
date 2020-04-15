// We grab Schema and model from mongoose library.
const { Schema, model } = require("mongoose");

// We declare new schema.
const guildSettingSchema = new Schema({
  gid: { type: String },
  prefix: { type: String, default: "!" }
});

// We export it as a mongoose model.
module.exports = model("guild_settings", guildSettingSchema);