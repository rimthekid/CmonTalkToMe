import { TelegrafContext } from 'telegraf/typings/context'
import { User, State } from '../models/user'
import { setNameStep2, unblockStep2 } from './user'
import { sendMessage, replyStep2 } from './messaging'

export const message_handler = async (ctx: TelegrafContext) => {
    const user = await User.findOne({ telegram_id: String(ctx.from?.id) }, { relations: ['blocked', 'blockedBy'] })
    if (!user) {
        ctx.reply('Not allowed')
    } else {
        switch (user.state) {
            case State.SET_NAME: {
                await setNameStep2(ctx, user)
                break
            }
            case State.MESSAGING: {
                await sendMessage(ctx, user)
                break
            }
            case State.REPLY: {
                await replyStep2(ctx, user)
                break
            }
            case State.UNBLOCKING: {
                await unblockStep2(ctx, user)
                break
            }
        }
    }
}