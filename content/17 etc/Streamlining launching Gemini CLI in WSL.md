---
type: reference
title: Streamlining launching Gemini CLI in WSL
tags: 
categories: 
createdAt: 2025-07-10 16:30
lastmod: 2025-07-10 16:30
lang: en
pin: true
math: true
mermaid: true
permalink: Streamlining launching Gemini CLI in WSL
---
# Streamlining Your Gemini CLI Workflow in WSL: A Comprehensive Guide

If you've ever found yourself with conflicting software installations between Windows and WSL (Windows Subsystem for Linux), or just want a cleaner, faster development environment, this guide is for you. We'll specifically look at installing Google's Gemini CLI directly within WSL using `nvm` (Node Version Manager), optimizing its launch, and creating a convenient shortcut.

---

## 1. How to Install Gemini CLI (or any Node.js package) Natively in WSL using NVM, even if it exists on Windows

When you have Node.js packages installed globally on your Windows system (e.g., in `C:\Users\YourUser\AppData\Roaming\npm`), WSL can sometimes access these. While convenient at times, it can lead to slower execution due to cross-filesystem access and confusion when you want a purely Linux-based environment.

Here's the recommended way to install Gemini CLI (or any `npm` package) directly into your WSL distribution, ensuring it runs efficiently from the Linux filesystem:

### Prerequisites:

* **WSL Installed:** You should have a WSL distribution (like Ubuntu) set up.
* **Basic WSL Terminal Access:** You know how to open your WSL terminal.

### Steps:

1.  **Open your WSL Terminal:** Launch your specific WSL distribution (e.g., Ubuntu).
    You should see your Linux prompt (e.g., `yourusername@yourdistro:~$`).

2.  **Install `nvm` (Node Version Manager):** `nvm` is essential for managing multiple Node.js versions and ensures your installations are native to your Linux environment.
    * **Install `curl` (if you don't have it):**
        ```bash
        sudo apt update
        sudo apt install curl -y
        ```
    * **Install `nvm` itself:**
        ```bash
        curl -o- [https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh](https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh) | bash
        ```
        *(Note: Always check the [official nvm GitHub repository](https://github.com/nvm-sh/nvm) for the latest installation command, as the version number might change.)*

    * **Close and Reopen your WSL Terminal:** This is crucial for `nvm` to be properly loaded into your shell's environment.

3.  **Install Node.js using `nvm`:**
    * Once your terminal is reopened, install a Node.js version (e.g., the latest LTS version):
        ```bash
        nvm install --lts
        nvm use --lts
        ```
        This command downloads and sets up Node.js within your WSL's native filesystem (e.g., in `~/.nvm/`).

4.  **Install Gemini CLI (or your desired Node.js package):**
    Now that you have a native Node.js and `npm` setup within WSL, install Gemini CLI globally:
    ```bash
    npm install -g @google/gemini-cli
    ```
    This installation will be located in a path like `/home/yourusername/.nvm/versions/node/vXX.X.X/bin/gemini`, residing entirely on your Linux filesystem.

5.  **Verify the new path:**
    Confirm the new, native path to your Gemini executable:
    ```bash
    which gemini
    ```
    This should now point to a path within your `/home/yourusername/.nvm/...` directory.

---

## 2. What is NVM (Node Version Manager)?

`nvm` stands for **Node Version Manager**. It's a command-line utility that allows you to easily install, manage, and switch between different versions of Node.js on a single machine.

### Key Benefits of NVM:

* **Version Control:** Install multiple Node.js versions (e.g., Node 16, Node 18, Node 20, Node 22) and switch between them with simple commands (`nvm use 20`).
* **Isolation:** Each Node.js version installed by `nvm` has its own separate set of global npm packages. This prevents conflicts between projects that might require different package versions or Node.js versions.
* **Local Installation:** `nvm` installs Node.js and its associated `npm` packages into your user's home directory (e.g., `~/.nvm/`) rather than system-wide locations (`/usr/local/bin`). This means you don't need `sudo` for `npm install -g`, and it keeps your system's core binaries cleaner.
* **Environment Management:** `nvm` modifies your shell's `PATH` variable dynamically when you switch Node.js versions, ensuring that the correct `node` and `npm` executables are used.

### Why it's particularly useful for WSL:

`nvm` helps create a clean, independent, and performant Node.js development environment *within* your WSL distribution, completely separate from any Node.js installations you might have on your Windows host.

---

## 3. How this made it possible to install another Gemini CLI (only for WSL)

When you installed Gemini CLI using `npm install -g @google/gemini-cli` after setting up `nvm` in WSL, you created a **completely separate and isolated installation** from any previous attempts or Windows installations.

* **Separate Environments:**
    * **Old Gemini:** The `gemini` you previously accessed (e.g., on `/mnt/c/.../npm/gemini`) was likely installed by a Node.js instance located on your Windows filesystem or an older, system-wide Node.js within WSL that wasn't managed by `nvm`. This `npm` had its own "brain" and its own list of globally installed packages.
    * **New Gemini (with `nvm`):** When `nvm` is active, it modifies your shell's `PATH` to point to the `node` and `npm` binaries *within the specific Node.js version NVM manages*. This new `npm` then manages its *own separate set* of global packages. From the perspective of this new `npm`, `gemini-cli` was not yet installed in *its* global package store.

* **No Conflicts:** Because `nvm` creates isolated environments, the new `npm` didn't "see" or conflict with the previous `gemini` installation. It simply installed a fresh copy into its dedicated location within the WSL Linux filesystem.

This approach ensures that your WSL environment has its own, optimized version of Gemini CLI, independent of your Windows setup, leading to faster execution and fewer conflicts.

---

## 4. How to Create a Windows Terminal Profile to Launch Gemini CLI (with Directory Change)

Now that Gemini CLI is installed natively in WSL and runs fast, let's create a convenient shortcut that automatically opens Windows Terminal, changes to your desired directory, and launches Gemini.

### Prerequisites:

* **Windows Terminal Installed:** Download from the Microsoft Store.
* **Gemini CLI Installed Natively in WSL:** As per section 1.
* **Your Gemini CLI Path:** You know the full path (e.g., `/home/parkpark011/.nvm/versions/node/v22.17.0/bin/gemini`).
* **Your WSL Distribution ID/Name:** You can find this by running `wsl -l -v` in PowerShell/CMD (e.g., `Ubuntu` or `{a534990e-7bf0-4ba8-8510-fd1a233b8112}`).
* **Your Desired Directory:** The Linux path you want to open in (e.g., `/mnt/d/PortableGit/GameReport`).

### Steps to Create the Profile/Shortcut:

1.  **Open Windows Terminal Settings:**
    * Open Windows Terminal.
    * Click the **down arrow (⌄)** next to the new tab button (`+`).
    * Select **`Settings` (설정)**.

2.  **Add a New Profile (or Edit Existing):**
    * On the left sidebar, click **`+ Add a new profile` (새 프로필 추가)**.
    * Select `New empty profile` (새 비어 있는 프로필).
    * Click `Duplicate` (복제) if you want to copy an existing WSL profile, then modify it.

3.  **Configure the Profile:**

    * **Name:** Give it a clear name (e.g., "Gemini CLI in GameReport").
    * **Command line (명령줄):** This is the core of our setup. Use the following structure, replacing the placeholders with your specific values:

        ```
        C:\WINDOWS\system32\wsl.exe --distribution-id YOUR_DISTRO_ID_OR_NAME -e /bin/bash -c "cd YOUR_DESIRED_DIRECTORY && YOUR_GEMINI_CLI_FULL_PATH; exec bash"
        ```

        **Using your specific example values:**
        ```
        C:\WINDOWS\system32\wsl.exe --distribution-id {a534990e-7bf0-4ba8-8510-fd1a233b8112} -e /bin/bash -c "cd /mnt/d/PortableGit/GameReport && /home/parkpark011/.nvm/versions/node/v22.17.0/bin/gemini; exec bash"
        ```

    * **Starting directory:** You can leave this blank, as our `cd` command in the "Command line" will handle it.
    * **Icon (Optional):** Click `Browse...` to choose an icon for your profile.

4.  **Save Your Changes:** Click the **`Save` (저장)** button at the bottom right.

### Creating a Desktop Shortcut (Optional, if you prefer launching directly from Desktop):

Once your Windows Terminal profile is configured, you can create a desktop shortcut that launches *that specific profile*.

1.  **Right-click on your Windows Desktop** and select `New` > `Shortcut`.
2.  In the "Type the location of the item" field, enter:
    ```
    wt.exe -p "Your Profile Name"
    ```
    Replace `"Your Profile Name"` with the exact name you gave your Windows Terminal profile (e.g., `"Gemini CLI in GameReport"`).
3.  Click `Next`, give your shortcut a name, and `Finish`.

---

### Command Explanation (The Nitty-Gritty Details):

Let's dissect the core command:
`C:\WINDOWS\system32\wsl.exe --distribution-id {a534990e-7bf0-4ba8-8510-fd1a233b8112} -e /bin/bash -c "cd /mnt/d/PortableGit/GameReport && /home/parkpark011/.nvm/versions/node/v22.17.0/bin/gemini; exec bash"`

* **`C:\WINDOWS\system32\wsl.exe`**: This is the Windows executable that initiates the Windows Subsystem for Linux.
* **`--distribution-id {a534990e-7bf0-4ba8-8510-fd1a233b8112}`**: This specifies *which* WSL distribution to launch. Using the ID is very precise; you could also use `--distribution Ubuntu` if "Ubuntu" is your distro's name.
* **`-e` or `--exec`**: This flag tells `wsl.exe` to execute a specific command *inside* the WSL distribution. Whatever immediately follows `-e` is the command WSL will run.
* **`/bin/bash`**: This is the absolute path to the Bash shell executable within your Linux environment. We launch Bash because it can interpret complex command strings and provide a proper shell environment for `gemini`.
* **`-c`**: This is an option for the `bash` command. It tells Bash to "read commands from the `string`" that follows it. In our case, the entire part enclosed in double quotes (`"cd ... ; exec bash"`) is that string.
* **`"cd /mnt/d/PortableGit/GameReport && /home/parkpark011/.nvm/versions/node/v22.17.0/bin/gemini; exec bash"`**: This is the multi-command string that Bash will execute:
    * **`cd /mnt/d/PortableGit/GameReport`**: This is the first command. It changes the current directory of the Bash shell to `/mnt/d/PortableGit/GameReport`.
    * **`&&` (Logical AND)**: This is a powerful Bash operator. It means the command that follows (`/home/parkpark011/.../gemini`) will **only execute if the preceding command (`cd ...`) was successful**. If `cd` fails (e.g., the directory doesn't exist), `gemini` won't run.
    * **`/home/parkpark011/.nvm/versions/node/v22.17.0/bin/gemini`**: This is the full, absolute path to your Gemini CLI executable, installed natively in WSL.
    * **`;`**: This is a command separator, similar to a newline. It tells Bash to execute the command before it, and then execute the command after it, regardless of success.
    * **`exec bash`**: This is a crucial command for usability. The `exec` command **replaces the current shell process** with a new program. In this case, after `cd` and `gemini` have finished executing (or if you exit Gemini), the temporary Bash shell launched by `wsl.exe -e` replaces itself with a *new, interactive Bash shell*. This leaves you with a functional Bash prompt in your desired directory, instead of the terminal window simply closing.

By understanding these components, you can customize your WSL launch commands to suit almost any workflow!