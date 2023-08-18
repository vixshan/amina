---
description: In this guide we will explain how to setup the bot for the first time
---

# Getting Started

To setup your bot firstly you should make sure that you at least have Node.js installed and a code editor (Visual Studio Code)



1. Installing Node.js (if not installed)

{% tabs %}
{% tab title="Windows and MacOS" %}
Assuming you don't have node.js installed

1. visit [https://nodejs.org/en/download](https://nodejs.org/en/download)
2. Download the Node.js  pre-built installer for your platform
3. Execute the installed and install it on your OS
{% endtab %}

{% tab title="Linux" %}
Best way to install node.js on your Linux is using nvm (Node Version Manager)\


To **install** or **update** nvm, you should run the install script.\
To do that, you may either download and run the script manually, or use the following cURL or Wget command:

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
```

```sh
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
```

Running either of the above commands downloads a script and runs it. The script clones the nvm repository to `~/.nvm`, and attempts to add the source lines from the snippet below to the correct profile file (`~/.bash_profile`, `~/.zshrc`, `~/.profile`, or `~/.bashrc`).

```sh
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
```

Now you're ready to install node.js

1.

    Verify that nvm has been installed by doing:

    ```sh
    command -v nvm
    ```

    which should output `nvm` if the installation was successful. Please note that `which nvm` will not work, since `nvm` is a sourced shell function, not an executable binary.

{% hint style="warning" %}
**Note:** On Linux, after running the install script, if you get `nvm: command not found` or see no feedback from your terminal after you type `command -v nvm`, simply close your current terminal, open a new terminal, and try verifying again.
{% endhint %}

2.

    To download, compile, and install the latest release of node, do this:

    ```bash
    nvm install node # "node" is an alias for the latest version
    ```
{% endtab %}
{% endtabs %}

2. Setting up the bot

* Open the terminal and run the following commands

```bash
git clone https://github.com/saiteja-madha/discord-js-bot.git
cd discord-js-bot
npm install
```

* Wait for all the dependencies to be installed
* Rename `.env.example` to `.env` and fill the values
* Optionally edit `config.js`
* Type `npm run start` to start the bot

