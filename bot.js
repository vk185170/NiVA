// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory, CardFactory, ActionTypes } = require('botbuilder');

class NiVA extends ActivityHandler {
    constructor() {
        super();
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            const replyText = `Echo: ${ context.activity.text }`;
            await context.sendActivity(MessageFactory.text(replyText, replyText));
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await this.sendIntroCard(context);
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    async sendIntroCard(context) {
        const card = CardFactory.heroCard(
            'Hello and welcome to NiVA!\nHow can I help?',
            'Try these',
            [],
            [
                {
                    type: ActionTypes.ImBack,
                    title: 'FAQs',
                    value: 'FAQs'
                },
                {
                    type: ActionTypes.ImBack,
                    title: 'Vision Support',
                    value: 'Vision Support'
                },
                {
                    type: ActionTypes.ImBack,
                    title: 'Feedback',
                    value: 'Feedback'
                }
            ]
        );

        await context.sendActivity({ attachments: [card] });
    }
}

module.exports.NiVA = NiVA;
