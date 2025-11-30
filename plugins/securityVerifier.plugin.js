const { 
    ChannelType, 
    PermissionFlagsBits, 
    Collection, 
    AttachmentBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle 
} = require('discord.js');
const Canvas = require('canvas');
const api = require("../core/api/api.js");

// ==========================================
// CONFIGURATION
// ==========================================
const TARGET_INVITE_CODE = "r-spain-discord-298102003479871488"; 
const SUSPECT_ROLE_ID = "1444479211753701539";
const MOD_ROLE_ID = "298102471040172032"; // <--- NEW MOD ROLE
const VERIFIER_CATEGORY_ID = "1444480356932649254";
const LOG_CHANNEL_ID = "667815242977247273"; 
const THREE_MONTHS_MS = 1000 * 60 * 60 * 24 * 90; 
const KICK_TIMEOUT_MS = 10 * 60 * 1000; 
const MAX_ATTEMPTS = 3;

// ==========================================
// STATE MANAGEMENT
// ==========================================
const invitesCache = new Map();
const verificationState = new Map();

// ==========================================
// HELPER FUNCTIONS
// ==========================================
async function sendLog(guild, text) {
    try {
        const channel = await guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
        if (channel) await channel.send(`🛡️ **Seguridad:** ${text}`);
    } catch (err) { console.error("Log Error:", err); }
}

function generateCaptchaText(length = 5) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function drawCaptchaImage(text) {
    const width = 400; 
    const height = 150;
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#23272A';
    ctx.fillRect(0, 0, width, height);

    // Noise Lines
    for(let i = 0; i < 25; i++) {
        ctx.strokeStyle = Math.random() > 0.5 ? '#99AAB5' : '#7289DA';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(Math.random() * width, Math.random() * height);
        ctx.lineTo(Math.random() * width, Math.random() * height);
        ctx.stroke();
    }

    // Text
    ctx.font = 'bold 60px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let startX = width / 2 - (text.length * 20);
    for (let i = 0; i < text.length; i++) {
        ctx.save();
        const rotation = (Math.random() - 0.5) * 0.4;
        ctx.translate(startX + (i * 40), height / 2);
        ctx.rotate(rotation);
        ctx.fillText(text[i], 0, 0);
        ctx.restore();
    }
    return canvas.toBuffer();
}

async function generateChallengePayload(memberId, attemptsLeft) {
    const captchaText = generateCaptchaText();
    const imageBuffer = await drawCaptchaImage(captchaText);
    const attachment = new AttachmentBuilder(imageBuffer, { name: 'challenge.png' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`verify_btn_${captchaText}`) 
            .setLabel('Verificar / Verify')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🔒') 
    );

    const embed = {
        title: "⚠️ Verificación Requerida / Verification Required",
        description: "**ES:** Escriba el texto de la imagen para entrar.\n**EN:** Enter the text from the image to join.\n\n⏳ **10 Minutos / Minutes**",
        color: 0xFF5555,
        image: { url: 'attachment://challenge.png' },
        footer: { text: `Intentos restantes / Attempts remaining: ${attemptsLeft}` }
    };

    return { 
        content: `<@${memberId}>`,
        embeds: [embed],
        files: [attachment],
        components: [row]
    };
}

// ==========================================
// MAIN MODULE
// ==========================================
module.exports = () => {
    const { client } = api;

    // ------------------------------------------
    // PART A: GLOBAL CHANNEL LOCK
    // ------------------------------------------
    client.on('channelCreate', async channel => {
        if (!channel.guild) return; 
        try {
            if (!channel.permissionOverwrites.cache.has(SUSPECT_ROLE_ID)) {
                await channel.permissionOverwrites.edit(SUSPECT_ROLE_ID, {
                    ViewChannel: false, SendMessages: false, Connect: false
                });
            }
        } catch (err) { console.error(`Lock Error: ${err}`); }
    });

    // ------------------------------------------
    // PART B: INVITE TRACKING
    // ------------------------------------------
    const cacheInvites = async () => {
        console.log("🛡️ Verifier Module: Caching Invites...");
        client.guilds.cache.forEach(async guild => {
            try {
                const invites = await guild.invites.fetch();
                invitesCache.set(guild.id, new Collection(invites.map(inv => [inv.code, inv.uses])));
            } catch (e) {
                console.log(`❌ Error caching invites for ${guild.name}`);
            }
        });
    };

    if (client.isReady()) {
        cacheInvites();
    } else {
        client.once('ready', cacheInvites);
    }

    client.on('inviteCreate', async invite => {
        const invites = invitesCache.get(invite.guild.id) || new Collection();
        invites.set(invite.code, invite.uses);
        invitesCache.set(invite.guild.id, invites);
    });

    client.on('inviteDelete', async invite => {
        const invites = invitesCache.get(invite.guild.id);
        if (invites) invites.delete(invite.code);
    });

    // ------------------------------------------
    // PART C: THE TRAP (MEMBER JOIN)
    // ------------------------------------------
    client.on('guildMemberAdd', async member => {
        console.log(`👉 Event Triggered: User ${member.user.tag} joined.`);
        const guild = member.guild;
        
        const cachedInvites = invitesCache.get(guild.id);
        const newInvites = await guild.invites.fetch();
        let usedInvite = newInvites.find(inv => {
            const oldUses = cachedInvites ? cachedInvites.get(inv.code) : 0;
            return inv.uses > oldUses;
        });
        invitesCache.set(guild.id, new Collection(newInvites.map(inv => [inv.code, inv.uses])));

        console.log(`   -> Invite used: ${usedInvite ? usedInvite.code : "Unknown"}`);

        // VALIDATION
        // if (!usedInvite || usedInvite.code !== TARGET_INVITE_CODE) return;
        const accountAgeMs = Date.now() - member.user.createdTimestamp;
        if (accountAgeMs > THREE_MONTHS_MS) return;

        console.log(`   -> 🚨 TRAP TRIGGERED for ${member.user.tag}`);

        try {
            await member.roles.add(SUSPECT_ROLE_ID);
            await sendLog(guild, `🚨 **Nuevo Sospechoso:** <@${member.id}> (${member.user.tag})\n**Cuenta:** ${(accountAgeMs/(1000*60*60*24)).toFixed(1)} días.`);

            // CREATE SECURE CHANNEL
            const channel = await guild.channels.create({
                name: `verify-${member.user.username.substring(0, 10)}`, 
                type: ChannelType.GuildText,
                parent: VERIFIER_CATEGORY_ID,
                permissionOverwrites: [
                    // 1. Block Everyone
                    { 
                        id: guild.id, 
                        deny: [PermissionFlagsBits.ViewChannel] 
                    },
                    // 2. Allow Bot (Full Access)
                    { 
                        id: client.user.id, 
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] 
                    },
                    // 3. ALLOW MODS (View & Send)
                    {
                        id: MOD_ROLE_ID,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
                    },
                    // 4. Configure Suspect (View ONLY - No Threads, No Reactions, No Messages)
                    { 
                        id: member.id, 
                        allow: [PermissionFlagsBits.ViewChannel], 
                        deny: [
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.AddReactions,
                            PermissionFlagsBits.CreatePublicThreads,
                            PermissionFlagsBits.CreatePrivateThreads
                        ] 
                    }
                ]
            });

            // SEND INITIAL CHALLENGE
            const payload = await generateChallengePayload(member.id, MAX_ATTEMPTS);
            const msg = await channel.send(payload);

            const state = {
                attempts: 0,
                channelId: channel.id,
                mainMsgId: msg.id,
                warningMsgId: null,
                timeouts: [] 
            };

            // TIMER LOGIC (DELETE & RESEND FOR PING)
            const scheduleWarning = (ms, text) => {
                const tid = setTimeout(async () => {
                    try {
                        // Delete previous warning to reduce clutter
                        if (state.warningMsgId) {
                            const existingMsg = await channel.messages.fetch(state.warningMsgId).catch(() => null);
                            if (existingMsg) await existingMsg.delete();
                        }

                        // Send new message to trigger ping sound
                        const newMsg = await channel.send(`<@${member.id}> ⏳ **${text}**`);
                        state.warningMsgId = newMsg.id;

                    } catch (e) { console.error("Timer Error:", e); }
                }, ms);
                state.timeouts.push(tid);
            };

            scheduleWarning(2 * 60 * 1000, "Quedan 8 minutos / 8 minutes remaining");
            scheduleWarning(4 * 60 * 1000, "Quedan 6 minutos / 6 minutes remaining");
            scheduleWarning(6 * 60 * 1000, "Quedan 4 minutos / 4 minutes remaining");
            scheduleWarning(8 * 60 * 1000, "Quedan 2 minutos / 2 minutes remaining");
            scheduleWarning(9.5 * 60 * 1000, "⚠️ **30 segundos restantes / 30 seconds remaining!**");

            const kickTid = setTimeout(async () => {
                const currentMember = await guild.members.fetch(member.id).catch(() => null);
                if (currentMember && currentMember.roles.cache.has(SUSPECT_ROLE_ID)) {
                    await currentMember.kick("Tiempo agotado.");
                    await sendLog(guild, `💀 **Expulsado (Timeout):** <@${member.id}>`);
                    if (channel) await channel.delete().catch(() => {});
                    verificationState.delete(member.id);
                }
            }, KICK_TIMEOUT_MS);
            
            state.timeouts.push(kickTid);
            verificationState.set(member.id, state);

        } catch (error) { console.error("Trap Error:", error); }
    });

    // ------------------------------------------
    // PART C-2: GARBAGE COLLECTOR
    // ------------------------------------------
    client.on('guildMemberRemove', async member => {
        if (verificationState.has(member.id)) {
            console.log(`🧹 Garbage Collector: User ${member.user.tag} left.`);
            const state = verificationState.get(member.id);
            state.timeouts.forEach(t => clearTimeout(t));
            try {
                const channel = member.guild.channels.cache.get(state.channelId);
                if (channel) await channel.delete();
            } catch (err) {}
            verificationState.delete(member.id);
            await sendLog(member.guild, `🏃 **Salida Detectada:** <@${member.id}> abandonó durante verificación.`);
        }
    });

    // ------------------------------------------
    // PART D: INTERACTION HANDLER
    // ------------------------------------------
    client.on('interactionCreate', async interaction => {
        if (!interaction.inGuild() || !interaction.channel.name.startsWith('verify-')) return;
        
        const userId = interaction.user.id;
        const userState = verificationState.get(userId);
        
        if (!userState && (interaction.isButton() || interaction.isModalSubmit())) {
            return interaction.reply({ content: "⚠️ Error de sesión. Por favor reingresa.", ephemeral: true });
        }

        if (interaction.isButton() && interaction.customId.startsWith('verify_btn_')) {
            const correctAnswer = interaction.customId.split('_')[2];
            const modal = new ModalBuilder()
                .setCustomId(`verify_modal_${correctAnswer}`)
                .setTitle('Seguridad / Security');

            const input = new TextInputBuilder()
                .setCustomId('captcha_input')
                .setLabel("Código / Code")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(6);

            modal.addComponents(new ActionRowBuilder().addComponents(input));
            await interaction.showModal(modal);
        }

        if (interaction.isModalSubmit() && interaction.customId.startsWith('verify_modal_')) {
            const correctAnswer = interaction.customId.split('_')[2];
            const userAnswer = interaction.fields.getTextInputValue('captcha_input');

            if (userAnswer.toUpperCase() === correctAnswer.toUpperCase()) {
                // SUCCESS
                try {
                    userState.timeouts.forEach(t => clearTimeout(t));
                    await interaction.member.roles.remove(SUSPECT_ROLE_ID);
                    verificationState.delete(userId);
                    
                    await interaction.reply({ content: "✅ **Verificado / Verified.**", ephemeral: true });
                    await sendLog(interaction.guild, `🟢 **Verificación Exitosa:** <@${userId}>`);
                    
                    setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
                } catch (err) {
                    interaction.reply({ content: "Error de permisos.", ephemeral: true });
                }
            } else {
                // FAILURE
                userState.attempts++;
                const attemptsLeft = MAX_ATTEMPTS - userState.attempts;
                await sendLog(interaction.guild, `⚠️ **Fallo:** <@${userId}>. Quedan ${attemptsLeft} intentos.`);

                if (userState.attempts >= MAX_ATTEMPTS) {
                    // KICK
                    userState.timeouts.forEach(t => clearTimeout(t)); 
                    try {
                        await interaction.member.kick("Falló 3 veces.");
                        await sendLog(interaction.guild, `🚫 **Expulsado (Intentos):** <@${userId}> falló 3 veces.`);
                        await interaction.reply({ content: "❌ **Expulsado / Kicked**", ephemeral: true });
                        setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
                        verificationState.delete(userId);
                    } catch (e) {}
                } else {
                    // RETRY: EDIT MAIN MESSAGE
                    await interaction.deferUpdate(); 
                    try {
                        const mainMsg = await interaction.channel.messages.fetch(userState.mainMsgId);
                        const newPayload = await generateChallengePayload(interaction.member.id, attemptsLeft);
                        await mainMsg.edit(newPayload);
                        await interaction.followUp({ content: `❌ **Incorrecto / Incorrect.**`, ephemeral: true });
                        
                    } catch (e) {
                        const newPayload = await generateChallengePayload(interaction.member.id, attemptsLeft);
                        const newMsg = await interaction.channel.send(newPayload);
                        userState.mainMsgId = newMsg.id;
                        verificationState.set(userId, userState);
                    }
                }
            }
        }
    });
};