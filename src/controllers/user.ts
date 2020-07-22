import { User, State } from '../models/user'
import { TelegrafContext } from 'telegraf/typings/context'
import * as AsciiTable from 'ascii-table'

export const setName = async (ctx: TelegrafContext) => {
    let user = await User.findOne({ telegram_id: String(ctx.from?.id) })
    if (!user) {
        ctx.reply('Not allowed')
    } else {
        user.state = State.SET_NAME
        user.save().then(() => {
            ctx.reply('نام مورد نظر را وارد کنید')
        }).catch((error) => {
            console.error(error)
            ctx.reply('خطایی رخ داده است')
        })
    }
}

export const setNameStep2 = async (ctx: TelegrafContext, user: User) => {
    user.name = ctx.message!.text || 'ناشناس'
    user.save().then((user) => {
        ctx.reply(`نام شما ثبت شد: ${user.name}`)
    }).catch((error) => {
        console.error(error)
        ctx.reply('خطایی رخ داده است')
    })
}

export const block = async (ctx: TelegrafContext, user: User, toBlock: number) => {
    let contact = await User.findOne(toBlock, { relations: ['blocked'] })
    if (!contact) {
        ctx.reply('Not allowed')
    } else {
        user.blocked.push(contact)
        user.save().then((user) => {
            const table = new AsciiTable()
            table.setHeading('شماره', 'نام')
            for (let i = 0; i < user.blocked.length; i++) {
                table.addRow(user.blocked[i].id, user.blocked[i].name)
            }
            ctx.reply('کسانی که بلاک کردی اینا هستن:\n\n' +
                '```' + table.toString().replace(/\|/g, 'ا').replace(/\'/g, 'ا') + '```',
                { parse_mode: 'MarkdownV2' }
            )

        }).catch((error) => {
            console.error(error)
            ctx.reply('خطایی رخ داده است')
        })
    }
}

export const unblock = async (ctx: TelegrafContext) => {
    let user = await User.findOne({ telegram_id: String(ctx.from?.id) }, { relations: ['blocked'] })
    if (!user) {
        ctx.reply('Not allowed')
    } else {
        if (user.blocked.length > 0) {
            const table = new AsciiTable()
            table.setHeading('شماره', 'نام')
            user.state = State.UNBLOCKING
            user.save().then((user) => {
                for (let i = 0; i < user.blocked.length; i++) {
                    table.addRow(user.blocked[i].id, user.blocked[i].name)
                }
                ctx.reply('شماره فردی که می‌خوای رفع بلاک بشه رو وارد کن:\n\n' +
                    '```' + table.toString().replace(/\|/g, 'ا').replace(/\'/g, 'ا') + '```',
                    { parse_mode: 'MarkdownV2' }
                )
            })
        } else {
            ctx.reply('شما هیچکس را بلاک نکرده‌اید')
        }
    }
}

export const unblockStep2 = async (ctx: TelegrafContext, user: User) => {
    let contact = await User.findOne(ctx.message?.text?.trim())
    if (!contact) {
        ctx.reply('شما این کاربر را بلاک نکرده‌اید یا شماره نامعتبر می‌باشد')
    } else {
        let blocked = []
        for (let i = 0; i < user.blocked.length; i++) {
            if (user.blocked[i].telegram_id != contact.telegram_id) {
                blocked.push(user)
            }
        }
        if (blocked.length == user.blocked.length) {
            ctx.reply('شما این کاربر را بلاک نکرده‌اید')
        } else {
            user.blocked = blocked
            user.state = State.IDLE
            user.save().then(() => {
                ctx.reply(`'${contact!.name}' رفع بلاک شد`)
            }).catch((error) => {
                console.error(error)
                ctx.reply('خطایی رخ داده است')
            })
        }
    }
}

export const mylink = async (ctx: TelegrafContext) => {
    let user = await User.findOne({ telegram_id: String(ctx.from?.id) })
    if (!user) {
        ctx.reply('Not allowed')
    } else {
        ctx.reply(`https://t.me/whisper2me_bot?start=${user.id}`)
    }
}