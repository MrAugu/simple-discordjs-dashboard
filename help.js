module.exports = {
  'help': {
    description: 'Shows the list of commands or help on specified command.',
    format: 'help <command-name>'
  },
  'ping': {
    description: 'Nothing really',
    format: 'ping'
  },
  'say': {
    aliases: ['repeat'],
    description: 'Repeats Your messages.',
    format: 'say <message>'
  }
}
