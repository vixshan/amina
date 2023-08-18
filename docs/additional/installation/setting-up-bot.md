---
description: Guide of how to set up bot for the first time
---

# Setting up bot

### 1- Setting up config.js

Config.js is the file which gives you option to control over your bot, like enabling/disabling features, customizing preferences and more...

1. Setting up general bot informations:

```javascript
OWNER_IDS: [""],
SUPPORT_SERVER: "",
```

Here you can pass owner IDs (developers team members IDs) so you can access to OWNER Commands\
Also you can add your support server invite URL for buttons

2. Setting up prefix commands:

```javascript
PREFIX_COMMANDS: {
  ENABLED: true, // Enable/Disable prefix commands
  DEFAULT_PREFIX: "!", // Default prefix for the bot
},
```

Here you can enable or disable prefix commands as you want, also you can setup the global bot prefix

3. Setting up Slash Commands:

```
INTERACTIONS: {
  SLASH: false, // Should the interactions be enabled
  CONTEXT: false, // Should contexts be enabled
  GLOBAL: false, // Should the interactions be registered globally
  TEST_GUILD_ID: "", // Guild ID where the interactions should be registered. [** Test you commands here first **]
},
```



<table><thead><tr><th width="184">Property</th><th width="96">Type</th><th>Description</th></tr></thead><tbody><tr><td><code>SLASH</code></td><td>Boolean</td><td>Whether the Slash Commands are enabled or not (set it to <code>true</code> to enable)</td></tr><tr><td><code>CONTEXT</code></td><td>Boolean</td><td>Whether the Context Menus are enabled or not (set it to <code>true</code> to enable)</td></tr><tr><td><code>GLOBAL</code></td><td>Boolean</td><td>Whether the Slash Commands should be globally registered or not (set it to <code>true</code> to enable)</td></tr><tr><td><code>TEST_GUILD_ID</code></td><td>String</td><td>Guild ID where interactions should be registered [**here you should try your slash command for the first itme**]</td></tr></tbody></table>

{% hint style="warning" %}
**Global slash commands** can take up to 1 hour to be shown across all guilds
{% endhint %}

