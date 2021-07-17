// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory, CardFactory, ActionTypes } = require('botbuilder');
const { QnAMaker } = require('botbuilder-ai');

class NiVA extends ActivityHandler {
    constructor() {
        super();

        // Configure QnA Maker
        try {
            this.qnaMaker = new QnAMaker({
                knowledgeBaseId: process.env.QnAKnowledgebaseId,
                endpointKey: process.env.QnAEndpointKey,
                host: process.env.QnAEndpointHostName
            });
        } catch (err) {
            console.warn(`QnAMaker Exception: ${ err } Check your QnAMaker configuration in .env`);
        }

        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            // Call QnA Maker
            if (!process.env.QnAKnowledgebaseId || !process.env.QnAEndpointKey || !process.env.QnAEndpointHostName) {
                const unconfiguredQnaMessage = 'NOTE: \r\n' +
                    'QnA Maker is not configured. To enable all capabilities, add `QnAKnowledgebaseId`, `QnAEndpointKey` and `QnAEndpointHostName` to the .env file. \r\n' +
                    'You may visit www.qnamaker.ai to create a QnA Maker knowledge base.';

                await context.sendActivity(unconfiguredQnaMessage);
            } else {
                console.log('Calling QnA Maker');

                const qnaResults = await this.qnaMaker.getAnswers(context);

                // If an answer was received from QnA Maker, send the answer back to the user.
                if (qnaResults[0]) {
                    await context.sendActivity(qnaResults[0].answer);

                // If no answers were returned from QnA Maker, reply with help.
                } else {
                    await context.sendActivity('No QnA Maker answers were found.');
                }
            }

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

    async echoMsg(context) {
        const replyText = `Echo: ${ context.activity.text }`;
        await context.sendActivity(MessageFactory.text(replyText, replyText));
        await next();
    }
}

module.exports.NiVA = NiVA;
