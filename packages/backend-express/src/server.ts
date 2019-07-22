import * as WebSocket from 'ws';
import * as redisLibrary from 'redis';
import * as bluebird from 'bluebird';
import * as uuidv4 from 'uuid/v4';
// import * as RSMQWorker from 'rsmq-worker';
import {Mutex} from 'async-mutex';

import { CRDTCommand, Operation } from 'shared/dist/enums';
import {CRDTStructure} from 'shared/dist/CRDTStructure';

import { LocalQueue, LocalSubscriber, LocalPublisher } from './LocalQueue';

const redis = bluebird.promisifyAll(redisLibrary).createClient();
const mutex = new Mutex();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;

const REDIS_DOCUMENT_KEY = 'document';
const REDIS_TOPIC = 'consumers';
const REDIS_QUEUE = 'queue';

const readDocument = async () => {
  const json = await redis.getAsync(REDIS_DOCUMENT_KEY);
  const document = json ? JSON.parse(json) : {tokens: [], text: ''};
  return document;
}

interface CRDTWebSocket extends WebSocket {
  windowSessionID: string;
}
const wss = new WebSocket.Server({ port: PORT });

const subscriber = new LocalSubscriber();
subscriber.onConsume(async (key, value) => {
  const message = JSON.parse(value);
  wss.clients.forEach((client: CRDTWebSocket) => {
    if (client.windowSessionID === message.fromWindowSessionID ||
        client.readyState !== WebSocket.OPEN) {
      return;
    }

    client.send(JSON.stringify({
      command: CRDTCommand.APPLY,
      value: message.value,
    }));
  });
});

const publisher = new LocalPublisher();
publisher.onPublish(async (key, value) => {
  subscriber.consume(key, value);
});

// const rsmq = new RSMQWorker(REDIS_QUEUE).start();

const queue = new LocalQueue();
queue.onConsume(async (messageString: string) => {
  mutex
    .runExclusive(async () => {
      try {
        const [
          document,
          llen,
        ] = await Promise.all([
          readDocument(),
          redis.llenAsync(REDIS_QUEUE),
        ]);

        const crdtStructure = new CRDTStructure(document.tokens, document.text);

        const message = JSON.parse(messageString);
        const value = message.value;
        value.offset = llen;

        // @ts-ignore
        // console.log(`delay: ${new Date() - new Date(message.time)}ms`);

        switch (value.operation) {
          case Operation.INSERT:
            crdtStructure.handleRemoteInsert(value.crdtToken);
            break;

          case Operation.DELETE:
            crdtStructure.handleRemoteDelete(value.crdtToken, '');
            break;
        }

        const newDocument = {
          tokens: crdtStructure.tokens,
          text: crdtStructure.text,
        };

        // TODO: add to REDIS list for replay
        // await redis.rpushAsync(REDIS_QUEUE, messageString);
        await Promise.all([
          redis.rpushAsync(REDIS_QUEUE, messageString),
          redis.setAsync(REDIS_DOCUMENT_KEY, JSON.stringify(newDocument)),
        ]);
        publisher.publish(REDIS_TOPIC, messageString);
      } catch (error) {
        console.error(error);
        // TODO: figure out how do error handling
      }
  });
});

wss.on('connection', (ws: CRDTWebSocket) => {
  console.log(`${new Date()}: Connection open on port: ${PORT}`);
  ws.windowSessionID = uuidv4();

  ws.on('close', () => {
    console.log('disconnected');
  });

  ws.on('message', async (data) => {
    let message;
    try {
      message = JSON.parse(data.toString());
    } catch (error) {
      console.error(error);
      return;
    }

    switch (message.command) {
      case CRDTCommand.LOAD:
        const document = await readDocument();
        ws.send(JSON.stringify({
          command: CRDTCommand.LOAD,
          value: document,
        }));
        break;
      
      case CRDTCommand.APPLY:
        message.fromWindowSessionID = ws.windowSessionID;
        message.time = new Date().toISOString();
        queue.consume(JSON.stringify(message));
        break;

      case CRDTCommand.REPLAY:
        // TODO
        const start = 0;
        await redis.lrangeAsync(REDIS_QUEUE, start);
        break;
    }
  });
});