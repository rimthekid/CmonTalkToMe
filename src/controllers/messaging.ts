import { User, State } from '../models/user'
import { TelegrafContext } from 'telegraf/typings/context'
import { Markup } from 'telegraf'

export const sendMessage = async (ctx: TelegrafContext, user: User) => {
    let found = false
    for (let i = 0; i < user.blockedBy.length; i++) {
        if (user.blockedBy[i].id == user.messagingTo) {
            found = true
            break
        }
    }
    if (found) {
        ctx.reply('شما نمی‌توانید به این کاربر پیام بدهید')
    } else {
        const messageingTo = await User.findOne(user.messagingTo || -1)
        if (!messageingTo) {
            ctx.reply('Not allowed')
        } else {
            generalSendMessage(
                ctx,
                user.replyingTo,
                user.id,
                user.name,
                messageingTo.telegram_id
                // )    
                // ctx.telegram.sendMessage(
                //     messageingTo.telegram_id,
                //     'پیام از سمت \'' + user.name + '\'\n' + ctx.message?.text,
                //     {
                //         reply_markup: Markup.inlineKeyboard([
                //             [
                //                 Markup.callbackButton('Block', `${'block-' + String(user.id)}`),
                //                 Markup.callbackButton('Reply', `${'reply-' + String(user.id) + '-' + String(ctx.message?.message_id)}`)
                //             ]
                //         ])
                //     }
            ).then(() => {
                user.state = State.IDLE
                user.messagingTo = null
                user.save().then((user) => {
                    ctx.reply('پیام شما ارسال شد')
                }).catch((error) => {
                    console.error(error)
                    ctx.reply('خطایی رخ داده است')
                })
            }).catch((error) => {
                if (error == 'typeNotSupported') {
                    ctx.reply('این نوع پیام پشتیبانی نمی‌شود لطفا برای اضافه کردن آن اینجا گزارش کتید\nhttps://gitlab.com/molaeiali/whisper2me-bot')
                } else {
                    console.error(error)
                    ctx.reply('خطایی رخ داده است')
                }
            })
        }
    }
}

export const reply = async (ctx: TelegrafContext, user: User, to: number, message_id: number) => {
    let contact = await User.findOne(to)
    if (!contact) {
        console.error('!contact')
        ctx.reply('خطایی رخ داده است')
    } else {
        let found = false
        for (let i = 0; i < user.blockedBy.length; i++) {
            if (user.blockedBy[i].id == contact.id) {
                found = true
                break
            }
        }
        if (found) {
            ctx.reply('شما نمی‌توانید به این کاربر پیام بدهید')
        } else {
            user.state = State.REPLY
            user.messagingTo = to
            user.replyingTo = message_id
            user.save().then(() => {
                ctx.reply(`درحال پاسخ به '${contact!.name}': پاسخ خود را بنویسید`)
            }).catch((error) => {
                console.error(error)
                ctx.reply('خطایی رخ داده است')
            })
        }
    }
}

export const replyStep2 = async (ctx: TelegrafContext, user: User) => {
    const messageingTo = await User.findOne(user.messagingTo || -1)
    if (!messageingTo) {
        ctx.reply('Not allowed')
    } else {
        generalSendMessage(
            ctx,
            user.replyingTo,
            user.id,
            user.name || 'ناشناس',
            messageingTo.telegram_id
            // )
            // ctx.telegram.sendMessage(
            //     messageingTo.telegram_id,
            //     'پیام از سمت \'' + user.name + '\'\n' + ctx.message?.text,
            //     {
            //         reply_to_message_id: user.replyingTo || -1,
            //         reply_markup: Markup.inlineKeyboard([
            //             [
            //                 Markup.callbackButton('Block', `${'block-' + String(user.id)}`),
            //                 Markup.callbackButton('Reply', `${'reply-' + String(user.id) + '-' + String(ctx.message?.message_id)}`)
            //             ]
            //         ])
            //     }
        ).then(() => {
            user.state = State.IDLE
            user.replyingTo = null
            user.messagingTo = null
            user.save().then(() => {
                ctx.reply('پیام شما ارسال شد')
            }).catch((error) => {
                console.error(error)
                ctx.reply('خطایی رخ داده است')
            })
        }).catch((error) => {
            if (error == 'typeNotSupported') {
                ctx.reply('این نوع پیام پشتیبانی نمی‌شود لطفا برای اضافه کردن آن اینجا گزارش کتید\nhttps://gitlab.com/molaeiali/whisper2me-bot')
            } else {
                console.error(error)
                ctx.reply('خطایی رخ داده است')
            }
        })
    }
}

const generalSendMessage = (ctx: TelegrafContext, replyingTo: number | null, id: number, name: string, chatId: string) => {
    const extra = {
        caption: `پیام از سمت '${name}'${ctx.message?.caption ? ': ' + ctx.message?.caption : ''}`,
        reply_to_message_id: replyingTo || undefined,
        reply_markup: Markup.inlineKeyboard([
            [
                Markup.callbackButton('Block', `${'block-' + String(id)}`),
                Markup.callbackButton('Reply', `${'reply-' + String(id) + '-' + String(ctx.message?.message_id)}`)
            ]
        ])
    }
    const extraWithOutCaption = {
        reply_to_message_id: replyingTo || undefined,
        reply_markup: Markup.inlineKeyboard([
            [
                Markup.callbackButton('Block', `${'block-' + String(id)}`),
                Markup.callbackButton('Reply', `${'reply-' + String(id) + '-' + String(ctx.message?.message_id)}`)
            ]
        ])
    }
    if (ctx.message?.document) {
        return ctx.telegram.sendDocument(chatId, ctx.message?.document.file_id, extra)
    } else if (ctx.message?.video) {
        return ctx.telegram.sendVoice(chatId, ctx.message?.video.file_id, extra)
    } else if (ctx.message?.photo) {
        return ctx.telegram.sendPhoto(chatId, ctx.message?.photo[0].file_id, extra)
    } else if (ctx.message?.voice) {
        return ctx.telegram.sendVoice(chatId, ctx.message?.voice.file_id, extra)
    } else if (ctx.message?.sticker) {
        ctx.telegram.sendMessage(chatId, `پیام از سمت '${name}':`).then(() => {

        }).catch((error) => {
            console.error(error)
        })
        return ctx.telegram.sendSticker(chatId, ctx.message?.sticker!.file_id!, extraWithOutCaption)
    } else if (ctx.message?.audio) {
        return ctx.telegram.sendAudio(chatId, ctx.message?.audio.file_id, extra)
    } else if (ctx.message?.animation) {
        return ctx.telegram.sendAnimation(chatId, ctx.message?.animation.file_id, extra)
    } else if (ctx.message?.text) {
        return ctx.telegram.sendMessage(chatId, `پیام از سمت '${name}': ${ctx.message?.text}`, extraWithOutCaption)
    } else {
        return Promise.reject('typeNotSupported')
    }
}